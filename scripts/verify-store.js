// scripts/verify-store.js — the store family as a shopper walks it (catalogue → product →
// cart → checkout → orders → favourites), with the shelf at the centre of it.
//
// The bug this probe exists for: `instock` was the only thing the store read, so `quantity` —
// the number actually on the shelf — could be 0 while the card still offered ADD TO CART, and
// the cart's stepper could be walked past a shelf that had already refused the add. Three claims
// follow from the fix, and they are the reason for the checks below:
//
//   1. the server is the authority — `quantity` decides, 0 is out of stock even with
//      `instock: true`, and **both** write paths (POST /add_to_cart, PUT /edit_cart/:cartId)
//      refuse past the shelf and say how many are left;
//   2. a refusal changes nothing — no line is written, and no empty cart is left behind as a
//      souvenir for a shopper refused on their very first tap;
//   3. the UI agrees with that — ONLY N LEFT / MAX — ONLY N LEFT beside a disabled +, SOLD OUT
//      on the card, OUT OF STOCK on the product page, so the button a shopper can press is
//      never one the next request would refuse.
//
// It borrows the real "LCJ Tee" as the shelf (3, then 0) and puts it back exactly as it found
// it, including after a failure, then takes its probe accounts and their carts with it.
//
// Screenshots land in /tmp/shot_cart_limit.png and /tmp/shot_store_soldout.png.
//
// Run:  node scripts/verify-store.js          (see scripts/README.md for prerequisites)
const fs = require('fs');
const { newTab, sleep } = require('./cdp');

const BASE = 'http://localhost:3003';
const API = 'http://localhost:3002';
// The backend lives beside this repo; override with BACKEND_DIR if it does not.
const BACKEND = process.env.BACKEND_DIR || require('path').resolve(__dirname, '../../original-backend');
require(BACKEND + '/node_modules/dotenv').config({ path: BACKEND + '/.env' });
const mongoose = require(BACKEND + '/node_modules/mongoose');

const stamp = Date.now().toString(36);
const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

async function shot(client, file) {
  const { data } = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
}

// ---- the API half: a session driven by hand ----------------------------------------------
// The frontend answers on :3003 and proxies to :3002; these checks talk to the API directly so
// that a refusal is measured as a status and a message rather than as a missing pixel.
let cookie = '';
async function api(method, path, body) {
  const res = await fetch(API + path, {
    method,
    // A hung request is the one failure this probe cannot afford: bound it and let the finally
    // block put the shelf back.
    signal: AbortSignal.timeout(15000),
    headers: { 'Content-Type': 'application/json', ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const setCookie = res.headers.get('set-cookie');
  if (setCookie) cookie = setCookie.split(';')[0];
  let json = null;
  try { json = await res.json(); } catch (err) { /* an empty body is fine */ }
  return { status: res.status, json };
}

async function cartLines() {
  const { json } = await api('GET', '/api/store/fetch_user_cart');
  return (json?.data?.products || []).map((l) => ({ id: String(l.product?._id || l.product), q: l.quantity }));
}

// signup does not open a session (the form signs in afterwards), so every account here signs
// up and then signs in — the same two calls pages/signin.js makes.
async function account(tag, prefix = 'storeprobe') {
  cookie = '';
  const email = `${prefix}${tag}${stamp}@example.com`;
  const username = `${prefix}${tag}${stamp}`;
  const password = 'Probe123!';
  const signup = await api('POST', '/api/auth/signup', { username, email, password });
  const signin = await api('POST', '/api/auth/signin', { email, password });
  return { email, username, password, signup: signup.status, signin: signin.status };
}

(async () => {
  await mongoose.connect(process.env.MONGO_URI || process.env.DB_URI || process.env.DATABASE_URL);
  const db = mongoose.connection.db;

  const catalogue = (await api('GET', '/api/store/public/products')).json.data;
  const tee = catalogue.find((p) => p.name === 'LCJ Tee');
  // A product with no shelf of its own — a virtual item cannot be limited by a quantity, so the
  // ceiling must be per product and not a global cap.
  const digital = catalogue.find((p) => p.item_type === 'virtual');
  const original = { quantity: tee.quantity, instock: tee.instock };
  console.log(`shelf for this probe: "${tee.name}" (${tee._id}) with quantity ${original.quantity}\n`);

  const setStock = (quantity, instock = true) =>
    db.collection('products').updateOne(
      { _id: new mongoose.Types.ObjectId(String(tee._id)) },
      { $set: { quantity, instock } }
    );

  try {
    // ---- a shopper with a session ----------------------------------------------------------
    const A = await account('a');
    ok('signup + signin establish a session', A.signup === 201 || A.signup === 200, `signup ${A.signup}`);
    const who = await api('GET', '/api/store/fetch_user_cart');
    ok('signed in (the cart answers for this session)', who.status === 200, `status ${who.status}`);

    // ---- the shelf is 3 --------------------------------------------------------------------
    await setStock(3);

    const add2 = await api('POST', '/api/store/add_to_cart', { productId: tee._id, quantity: 2 });
    ok('add 2 of 3 to an empty cart', add2.status === 200, `status ${add2.status} ${JSON.stringify(add2.json)}`);
    ok('cart holds 2', JSON.stringify(await cartLines()) === JSON.stringify([{ id: tee._id, q: 2 }]));

    const add1 = await api('POST', '/api/store/add_to_cart', { productId: tee._id, quantity: 1 });
    ok('add 1 more, exactly to the shelf', add1.status === 200, `status ${add1.status}`);

    const addPast = await api('POST', '/api/store/add_to_cart', { productId: tee._id, quantity: 1 });
    ok('adding past the shelf is refused', addPast.status === 400, `status ${addPast.status}`);
    ok(
      '...and says how many are left and how many are in the cart',
      /Only 3 of "LCJ Tee" are left and 3 are already in your cart/.test(addPast.json?.message || ''),
      addPast.json?.message
    );
    ok('...and the cart is untouched by the refusal', JSON.stringify(await cartLines()) === JSON.stringify([{ id: tee._id, q: 3 }]));

    const addThree = await api('POST', '/api/store/add_to_cart', { productId: tee._id, quantity: 3 });
    ok('a single add of more than the shelf is refused too', addThree.status === 400, `status ${addThree.status}`);

    // ---- the stepper cannot walk past it either --------------------------------------------
    const cart = (await api('GET', '/api/store/fetch_user_cart')).json.data;
    const edit = (quantity) => api('PUT', `/api/store/edit_cart/${cart._id}`, { items: [{ productId: tee._id, quantity }] });

    const down = await edit(2);
    ok('stepping down to 2 is allowed', down.status === 200, `status ${down.status}`);
    const upPast = await edit(4);
    ok('stepping up to 4 of 3 is refused', upPast.status === 400, `status ${upPast.status}`);
    ok('...and names the shelf', /Only 3 are left of "LCJ Tee"/.test(upPast.json?.message || ''), upPast.json?.message);
    ok('...and the cart still holds 2', JSON.stringify(await cartLines()) === JSON.stringify([{ id: tee._id, q: 2 }]));
    const upTo = await edit(3);
    ok('stepping up to exactly the shelf is allowed', upTo.status === 200, `status ${upTo.status}`);

    // ---- nothing left, while the flag still says in stock -----------------------------------
    await setStock(0, true);
    const addNone = await api('POST', '/api/store/add_to_cart', { productId: tee._id, quantity: 1 });
    ok('a sold-out shelf refuses an add even with instock true', addNone.status === 400, `status ${addNone.status}`);
    ok('...with a message about the shelf', /There is none of "LCJ Tee" left/.test(addNone.json?.message || ''), addNone.json?.message);
    const editNone = await edit(3);
    ok('...and the stepper is refused as well', editNone.status === 400, `status ${editNone.status}`);
    ok('...naming it as out of stock', /out of stock/.test(editNone.json?.message || ''), editNone.json?.message);
    ok('...leaving the cart alone', JSON.stringify(await cartLines()) === JSON.stringify([{ id: tee._id, q: 3 }]));

    // ---- a refused add must not leave an empty cart behind ----------------------------------
    const B = await account('b');
    const refused = await api('POST', '/api/store/add_to_cart', { productId: tee._id, quantity: 1 });
    ok('a fresh shopper is refused the sold-out tee', refused.status === 400, `status ${refused.status}`);
    const bUser = await db.collection('users').findOne({ username: B.username });
    const bcarts = await db.collection('carts').countDocuments({ user: bUser._id });
    ok('...and no empty cart was created as a souvenir', bcarts === 0, `${bcarts} carts`);
    ok('...and the user has no cart id stored', !bUser.cart, String(bUser.cart));
    const bCart = await api('GET', '/api/store/fetch_user_cart');
    ok('...and reading the cart is still an empty answer, not a 404', bCart.status === 200, `status ${bCart.status}`);

    // ---- back on the shelf: the ordinary path still works -----------------------------------
    await setStock(original.quantity, original.instock);
    const back = await api('POST', '/api/store/add_to_cart', { productId: tee._id, quantity: 1 });
    ok('after restocking, the same add succeeds', back.status === 200, `status ${back.status} ${JSON.stringify(back.json)}`);
    ok('...and the cart now exists with the line', JSON.stringify(await cartLines()) === JSON.stringify([{ id: tee._id, q: 1 }]));

    // ---- the ceiling is per product, not global ---------------------------------------------
    const digitalLine = await api('POST', '/api/store/add_to_cart', { productId: digital._id, quantity: 5 });
    ok(`a second product still adds freely (${digital.name}, 5)`, digitalLine.status === 200, `status ${digitalLine.status}`);
    const lines = await cartLines();
    ok('the cart holds both lines', lines.length === 2, JSON.stringify(lines));
  } finally {
    // ---- put the shelf back, whatever happened ----------------------------------------------
    await setStock(original.quantity, original.instock);
    const restored = await db.collection('products').findOne({ _id: new mongoose.Types.ObjectId(String(tee._id)) });
    ok(`shelf restored to ${original.quantity}`, restored.quantity === original.quantity && restored.instock === original.instock,
      `quantity ${restored.quantity}, instock ${restored.instock}`);

    // ---- and take the API-side probe accounts and their carts with us ------------------------
    const probes = await db.collection('users').find({ username: { $regex: new RegExp(`^storeprobe[a-z]?${stamp}$`) } }).toArray();
    const ids = probes.map((u) => u._id);
    const carts = await db.collection('carts').deleteMany({ user: { $in: ids } });
    const users = await db.collection('users').deleteMany({ _id: { $in: ids } });
    console.log(`\ncleaned up: ${users.deletedCount} API probe users, ${carts.deletedCount} carts deleted`);
  }

  // ---- the browser half: the same shelf as a shopper meets it ------------------------------
  // A second account, this one signed in through the form itself, so the checks below see what
  // a person sees — the real cookie, the real redux slice, the real page.
  const c = await newTab('about:blank');
  await c.send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 1000, deviceScaleFactor: 1, mobile: false });
  const U = await account('u', 'uistore');

  const fill = (selector, value) => `(() => {
    const el = document.querySelector(${JSON.stringify(selector)});
    if (!el) return 'no element';
    const set = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
    set.call(el, ${JSON.stringify(value)});
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
    return el.value;
  })()`;

  // Read the basket back through the page: same origin, same cookie, so what the server answers
  // the page is what is asserted rather than the probe's own bookkeeping.
  const cartVia = () => c.eval(`fetch('/api/store/fetch_user_cart', { credentials: 'include' })
    .then(r => r.json())
    .then(d => (d.data?.products || []).map(l => ({ id: String(l.product?._id || l.product), q: l.quantity })))`);

  const stepper = () => c.eval(`(() => {
    const inc = document.querySelector('button[aria-label="Increase quantity"], button[aria-label^="Only "]');
    const dec = document.querySelector('button[aria-label="Decrease quantity"]');
    const nxt = dec ? dec.nextElementSibling : null;
    const spans = [...document.querySelectorAll('span')].map(s => s.textContent.trim());
    return {
      incDisabled: inc ? inc.disabled : null,
      incLabel: inc ? inc.getAttribute('aria-label') : null,
      incCursor: inc ? getComputedStyle(inc).cursor : null,
      decFound: !!dec,
      qty: nxt ? nxt.textContent.trim() : null,
      label: spans.find(t => /^(MAX — ONLY|ONLY) \\d+ LEFT$/.test(t)) || null,
    };
  })()`);

  // The page writes to the server and reads the cart back, so a state sampled too early shows
  // `busy` (cursor: wait) rather than the shelf. Wait for it to settle instead of guessing a
  // sleep, and report the last state seen if it never does.
  const settle = async (attempts = 20) => {
    let last = null;
    for (let i = 0; i < attempts; i += 1) {
      last = await stepper();
      if (last.incCursor !== 'wait') return last;
      await sleep(1000);
    }
    console.log(`  (the cart page was still busy after ${attempts}s: ${JSON.stringify(last)})`);
    return last;
  };

  // Same idea for an expected end state, keeping a timeline so a genuinely stale render is
  // distinguishable from a probe that simply looked too early.
  const waitForStepper = async (disabled, label, attempts = 15) => {
    const samples = [];
    let st = null;
    for (let i = 0; i < attempts; i += 1) {
      st = await stepper();
      samples.push(`t${i}s qty=${st.qty} +disabled=${st.incDisabled} label=${st.label}`);
      if (st.incDisabled === disabled && st.label === label) return { ok: true, st, samples };
      await sleep(1000);
    }
    return { ok: false, st, samples };
  };

  const clickAddToCart = () => c.eval(`(() => {
    const b = [...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'ADD TO CART');
    if (!b) return 'no ADD TO CART button';
    b.click();
    return 'clicked';
  })()`);

  // A dev server compiles a route on first request, so a page that is not up yet renders an
  // empty #__next. Poll for the thing being read instead of trusting a fixed sleep — the first
  // run of this probe "found" no card and no stepper purely because it looked too early.
  const waitFor = async (expression, attempts = 15) => {
    for (let i = 0; i < attempts; i += 1) {
      if (await c.eval(expression)) return true;
      await sleep(1000);
    }
    return false;
  };
  const waitForCart = () => waitFor('!!document.querySelector(\'button[aria-label="Decrease quantity"]\')');

  // The add button writes and the page refetches, so a cart read straight after the click can
  // still show the previous line — the trap that made the first browser half of this probe lie.
  const waitForLines = async (expected, attempts = 12) => {
    let lines = null;
    for (let i = 0; i < attempts; i += 1) {
      lines = await cartVia();
      if (JSON.stringify(lines) === JSON.stringify(expected)) return lines;
      await sleep(1000);
    }
    return lines;
  };

  try {
    // ---- sign in the way a person does, so redux and the cookie agree ----------------------
    // pages/signin.js navigates itself two seconds after an accepted sign-in, and a click that
    // lands before hydration is swallowed, so the wait is for the page to *leave* /signin — with
    // the click offered again if it has not — rather than a sleep that assumes both happened.
    ok('the UI probe account was created', U.signup === 201 || U.signup === 200, `signup ${U.signup}`);
    await c.goto(`${BASE}/signin`, 4000);
    let loginLabel = null;
    const signIn = async () => {
      await c.eval(fill('#email', U.email));
      await c.eval(fill('#password', U.password));
      const label = await c.eval(`(() => {
        const b = [...document.querySelectorAll('button')].find(e => /LOGIN|SIGN IN/i.test(e.textContent.trim()));
        if (!b) return 'not found';
        b.click();
        return b.textContent.trim().slice(0, 40);
      })()`);
      if (loginLabel === null) loginLabel = label;
      for (let i = 0; i < 25; i += 1) {
        if ((await c.eval('location.pathname')) !== '/signin') return true;
        await sleep(1000);
        if (i === 6 || i === 13) await c.eval(`(() => {
          const b = [...document.querySelectorAll('button')].find(e => /LOGIN|SIGN IN/i.test(e.textContent.trim()));
          if (b) b.click();
        })()`);
      }
      return false;
    };
    const signedIn = await signIn();
    console.log('login button:', loginLabel);
    ok('signing in through the form leaves /signin', signedIn, `url ${await c.eval('location.pathname')}`);

    // ---- stock is 3, the basket gets 2 -----------------------------------------------------
    await setStock(3);
    await c.goto(`${BASE}/store/${tee._id}`, 3000);
    const drewProduct = await waitFor(`/ONLY 3 LEFT/.test(document.body.innerText)`);
    ok('the product page drew the tee with 3 left', drewProduct);
    const page3 = await c.eval(`({
      stock: /IN STOCK|OUT OF STOCK/.exec(document.body.innerText)?.[0] || null,
      only: (document.body.innerText.match(/ONLY \\d+ LEFT/) || [null])[0],
      button: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).find(t => /ADD TO CART|SOLD OUT/.test(t)) || null,
    })`);
    console.log('product page with 3 left:', JSON.stringify(page3));
    ok('the product page says only 3 are left', page3.only === 'ONLY 3 LEFT', JSON.stringify(page3));

    // A swallowed click (hydration, a redirect to /signin) must fail the run, not pass quietly:
    // each tap is checked against the server's own cart.
    console.log('add #1:', await clickAddToCart());
    const afterFirst = await waitForLines([{ id: tee._id, q: 1 }]);
    ok('the first tap put one in the cart', JSON.stringify(afterFirst) === JSON.stringify([{ id: tee._id, q: 1 }]), JSON.stringify(afterFirst));
    await c.goto(`${BASE}/store/${tee._id}`, 3000);
    await waitFor(`!![...document.querySelectorAll('button')].find(b => b.textContent.trim() === 'ADD TO CART')`);
    console.log('add #2:', await clickAddToCart());

    // ---- the cart: the stepper knows the shelf ---------------------------------------------
    await c.goto(`${BASE}/cart`, 3000);
    const drewCart = await waitForCart();
    ok('the cart page drew the stepper for the line', drewCart);
    const lines = await waitForLines([{ id: tee._id, q: 2 }]);
    ok('the cart holds the two tapped tees', JSON.stringify(lines) === JSON.stringify([{ id: tee._id, q: 2 }]), JSON.stringify(lines));

    const with2 = await settle();
    console.log('stepper with 2 of 3:', JSON.stringify(with2));
    ok('the line warns only 3 are left', with2.label === 'ONLY 3 LEFT', JSON.stringify(with2));
    ok('the + button is still clickable', with2.incDisabled === false, `${with2.incDisabled} / ${with2.incLabel}`);

    // The + sits before the stop, so the stop is reached by pressing it — the same gesture a
    // shopper makes. The next write is the one the server refuses if the UI has it wrong.
    await c.eval(`(() => { const inc = document.querySelector('button[aria-label="Increase quantity"]'); if (inc) inc.click(); })()`);
    const atShelf = await waitForStepper(true, 'MAX — ONLY 3 LEFT');
    if (!atShelf.ok) console.log(`  timeline: ${atShelf.samples.join(' | ')}`);
    ok('stepping up to the shelf is accepted (3)', atShelf.st.qty === '3', JSON.stringify(atShelf.st));
    console.log('stepper standing on the shelf:', JSON.stringify(atShelf.st));
    ok('the stepper now reads MAX — ONLY 3 LEFT', atShelf.st.label === 'MAX — ONLY 3 LEFT', atShelf.st.label);
    ok('...and the + button is disabled', atShelf.st.incDisabled === true, String(atShelf.st.incDisabled));
    ok('...and it is named for screen readers', atShelf.st.incLabel === 'Only 3 left in stock', atShelf.st.incLabel);
    ok('...and it does not look clickable', atShelf.st.incCursor === 'not-allowed', atShelf.st.incCursor);

    console.log('clicking the stopped +:', await c.eval(`(() => {
      const inc = document.querySelector('button[aria-label^="Only "]');
      if (!inc) return 'no stopped +';
      inc.click();
      return 'clicked';
    })()`));
    await sleep(2500);
    const afterStopped = await settle();
    ok('clicking the stopped + anyway changes nothing (still 3)', afterStopped.qty === '3', JSON.stringify(afterStopped));
    await shot(c, '/tmp/shot_cart_limit.png');

    // Back down again: the ceiling must not be a trap.
    await c.eval(`(() => { const dec = document.querySelector('button[aria-label="Decrease quantity"]'); if (dec) dec.click(); })()`);
    const back2 = await waitForStepper(false, 'ONLY 3 LEFT');
    if (!back2.ok) console.log(`  timeline: ${back2.samples.join(' | ')}`);
    ok('stepping back down still works (2)', back2.st.qty === '2', JSON.stringify(back2.st));
    ok('...and the + button comes back', back2.st.incDisabled === false, String(back2.st.incDisabled));

    // ---- sold out: the catalogue stops offering what is gone --------------------------------
    await setStock(0, true);
    await c.goto(`${BASE}/store`, 3000);
    // Anchored on the tee's own link, so a SOLD OUT button somewhere else on the page cannot be
    // mistaken for the tee's.
    const drewStore = await waitFor(`!!document.querySelector('a[href="/store/${tee._id}"]')`);
    ok('the catalogue drew the tee', drewStore);
    const card = await c.eval(`(() => {
      const link = document.querySelector('a[href="/store/${tee._id}"]');
      const box = link ? link.closest('div[style]') : null;
      const b = box ? [...box.querySelectorAll('button')].find(b => b.textContent.trim() === 'SOLD OUT') : null;
      return {
        found: !!b,
        disabled: b ? b.disabled : null,
        cursor: b ? getComputedStyle(b).cursor : null,
        owns: box ? /LCJ TEE/i.test(box.innerText) : false,
        card: box ? box.innerText.replace(/\\n/g, ' | ').slice(0, 90) : null,
      };
    })()`);
    console.log('store card on an empty shelf:', JSON.stringify(card));
    ok('the card for the empty tee offers SOLD OUT', card.found, JSON.stringify(card));
    ok('...on a disabled button', card.disabled === true, String(card.disabled));
    ok('...that no longer looks clickable', card.cursor === 'not-allowed', card.cursor);
    ok('...on the tee it belongs to', card.owns, card.card);
    await shot(c, '/tmp/shot_store_soldout.png');

    // ---- and the product page for a sold-out tee says so ------------------------------------
    await c.goto(`${BASE}/store/${tee._id}`, 3000);
    await waitFor(`/OUT OF STOCK/.test(document.body.innerText)`);
    const page0 = await c.eval(`({
      stock: /IN STOCK|OUT OF STOCK/.exec(document.body.innerText)?.[0] || null,
      button: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).find(t => /ADD TO CART|SOLD OUT/.test(t)) || null,
      disabled: (() => {
        const b = [...document.querySelectorAll('button')].find(b => /ADD TO CART|SOLD OUT/.test(b.textContent.trim()));
        return b ? b.disabled : null;
      })(),
    })`);
    console.log('product page on an empty shelf:', JSON.stringify(page0));
    ok('the product page reads OUT OF STOCK', page0.stock === 'OUT OF STOCK', JSON.stringify(page0));
    ok('...and its button is a disabled SOLD OUT', page0.button === 'SOLD OUT' && page0.disabled === true, JSON.stringify(page0));

    // The page builds these labels from the product it fetched; an uncaught error would mean a
    // render that fell back to something else, which is exactly what "the label is right" would
    // otherwise miss.
    const fresh = c.freshErrors();
    ok('no uncaught errors in the tab', fresh.length === 0, fresh.join(' | '));
  } finally {
    c.close();

    // ---- put the shelf back, and take the UI probe's account with us -------------------------
    await setStock(original.quantity, original.instock);
    const restored = await db.collection('products').findOne({ _id: new mongoose.Types.ObjectId(String(tee._id)) });
    ok(`shelf restored to ${original.quantity}`, restored.quantity === original.quantity && restored.instock === original.instock,
      `quantity ${restored.quantity}, instock ${restored.instock}`);

    const ui = await db.collection('users').findOne({ username: U.username });
    const carts = await db.collection('carts').deleteMany({ user: ui ? ui._id : null });
    const users = await db.collection('users').deleteMany({ username: U.username });
    console.log(`\ncleaned up: ${users.deletedCount} UI probe user, ${carts.deletedCount} cart deleted`);
    console.log('DB now:',
      await db.collection('users').countDocuments(), 'users,',
      await db.collection('carts').countDocuments(), 'carts,',
      await db.collection('orders').countDocuments(), 'orders');
    console.log('screenshots: /tmp/shot_cart_limit.png /tmp/shot_store_soldout.png');
  }

  // ---- the verdict --------------------------------------------------------------------------
  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  if (failed.length) {
    console.log('FAILED:');
    failed.forEach(f => console.log(`  - ${f.name}  ${f.detail || ''}`));
  } else {
    console.log('ALL STORE SHELF CHECKS PASSED');
  }
  await mongoose.disconnect();
  process.exit(failed.length ? 1 : 0);
})().catch((err) => {
  console.error('the probe threw:', err);
  process.exit(1);
});
