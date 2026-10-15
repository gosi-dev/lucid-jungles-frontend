// scripts/verify-shell.js — the shell that ten routes share, and where MESSAGE lands.
//
// Three questions, all measured rather than eyeballed:
//   1. On a 1440 desktop, is the content a readable column or does it stretch to the window?
//   2. Does /chat (the MESSAGE destination) give a desktop layout, and does sending a
//      message actually write it and render it?
//   3. Does the persisted store still hold a plaintext password?
//
// Screenshots land in /tmp/shot_chat_*.png and /tmp/shot_world_desktop.png.
//
// Run:  node scripts/verify-shell.js           (see scripts/README.md for prerequisites)
const fs = require('fs');
const { newTab, sleep } = require('./cdp');

const BASE = 'http://localhost:3003';
const EMAIL = 'seed@lucidcityjungles.com';
const PASSWORD = 'SeedAdmin@2024!';
// The entity with a linked account (see the event's attendees[]) — the one MESSAGE is
// offered for, since an in-app conversation needs a user id on the other end.
const TARGET_ID = '6a1986d87fe26b4dfa2f8823';
const TARGET_NAME = 'Bonzo';
const MARK = `probe shell check ${Date.now()}`;

const results = [];
const ok = (name, pass, detail = '') => {
  results.push({ name, pass, detail });
  console.log(`${pass ? 'PASS' : 'FAIL'}  ${name}${detail ? '  — ' + detail : ''}`);
};

async function shot(client, file) {
  const { data } = await client.send('Page.captureScreenshot', { format: 'png' });
  fs.writeFileSync(file, Buffer.from(data, 'base64'));
}

async function setViewport(client, width, height) {
  await client.send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 1, mobile: width < 600 });
}

// Cards are the shell's own primitive: a 1px rgba(171,212,158,0.15) border. Measuring
// them tells us how much of the window the content is actually using.
const MEASURE = `(() => {
  const box = (el) => el ? { x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) } : null;
  const isCard = (el) => {
    const s = getComputedStyle(el);
    return s.borderTopStyle === 'solid' && s.borderTopColor === 'rgba(171, 212, 158, 0.15)' && parseFloat(s.borderTopWidth) === 1;
  };
  const cards = [...document.querySelectorAll('#__next div')].filter(isCard).map(c => Math.round(c.getBoundingClientRect().width));
  const scrollers = [...document.querySelectorAll('#__next div')].filter(d => getComputedStyle(d).overflowY === 'auto');
  const composer = document.querySelector('input[placeholder="Type a message"]');
  const widest = cards.length ? Math.max(...cards) : 0;
  const navs = [...document.querySelectorAll('nav')].filter(n => n.getBoundingClientRect().height > 0);
  return {
    vw: window.innerWidth,
    cards,
    widest,
    ratio: +(widest / window.innerWidth).toFixed(2),
    scroller: box(scrollers[0]),
    composer: box(composer),
    // The pane the composer lives in: its height is what actually uses the window.
    composerPane: box(composer ? composer.closest('div[style*="flex-direction"]') : null),
    bottomNav: navs.length,
    docHeight: document.documentElement.scrollHeight,
    text: document.body.innerText.replace(/\\n+/g, ' | ').slice(0, 240),
  };
})()`;


const fillComposer = (value) => `(() => {
  const el = document.querySelector('input[placeholder="Type a message"]');
  if (!el) return { filled: false };
  const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
  setter.call(el, ${JSON.stringify(value)});
  el.dispatchEvent(new Event('input', { bubbles: true }));
  return { filled: true, value: el.value };
})()`;

const clickSend = `(() => {
  const el = [...document.querySelectorAll('button')].find(b => (b.textContent || '').trim().toUpperCase() === 'SEND');
  if (!el) return { clicked: false, buttons: [...document.querySelectorAll('button')].map(b => b.textContent.trim()).slice(0, 12) };
  if (el.disabled) return { clicked: false, disabled: true };
  el.scrollIntoView({ block: 'center' });
  el.click();
  return { clicked: true };
})()`;

const hasMark = `document.body.innerText.includes(${JSON.stringify(MARK)})`;

// A page that derives its thread from ?to= sets that thread from an effect (a profile
// fetch, then the thread), so reading the screen at a fixed delay measures the wait rather
// than the page. Every measurement below waits for the composer to exist instead.
const COMPOSER_READY = `document.querySelector('input[placeholder="Type a message"]') !== null`;

async function waitFor(c, expr, timeoutMs = 12000, stepMs = 300) {
  const deadline = Date.now() + timeoutMs;
  let last = null;
  while (Date.now() < deadline) {
    last = await c.eval(expr);
    if (last) return last;
    await sleep(stepMs);
  }
  return last;
}

(async () => {
  const c = await newTab('about:blank');

  // Signed in by cookie, exactly the state the MESSAGE action leaves a returning user in.
  await setViewport(c, 1440, 900);
  await c.goto(BASE + '/', 2500);
  const signin = await c.eval(`fetch('/api/auth/signin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:${JSON.stringify(EMAIL)},password:${JSON.stringify(PASSWORD)}})}).then(async r=>({status:r.status}))`);
  ok('session: signed in for the chat probe', signin.status === 200, `signin ${signin.status}`);

  // ---------------------------------------------------------------- /chat on desktop
  const chatUrl = `${BASE}/chat?to=${TARGET_ID}&name=${TARGET_NAME}`;
  await c.goto(chatUrl, 3500);
  const composed = await waitFor(c, COMPOSER_READY);
  ok('chat: the thread derived from ?to= opens with a composer', composed === true, composed ? 'composer mounted' : 'no composer after 12s');

  const path = await c.eval('location.pathname');
  ok('chat: stays on /chat when signed in (no gate bounce)', path === '/chat', path);
  const bodyText = await c.eval('document.body.innerText');
  ok('chat: subtitle names the person from MESSAGE', bodyText.includes(`MESSAGE ${TARGET_NAME.toUpperCase()}`), `MESSAGE ${TARGET_NAME.toUpperCase()}`);

  const d = await c.eval(MEASURE);
  console.log('   desktop measure :', JSON.stringify(d));
  ok('shell desktop: content sits in the 1180 grid, not the window', d.widest <= 1180 && d.widest > 700, `widest card ${d.widest}px of ${d.vw}px`);
  ok('shell desktop: the phone tab bar is gone', d.bottomNav === 0, `${d.bottomNav} visible nav element(s)`);
  ok('chat desktop: conversations and conversation are side by side', !!d.composer && d.composer.x > 300, d.composer ? `composer at x=${d.composer.x}` : 'no composer');
  ok('chat desktop: the conversation uses the window height', !!d.composerPane && d.composerPane.h > 400, d.composerPane ? `pane ${d.composerPane.w}x${d.composerPane.h}` : 'no pane');
  ok('chat desktop: composer is a readable width', !!d.composer && d.composer.w > 300 && d.composer.w < 1000, d.composer ? `${d.composer.w}px` : 'no composer');

  // Send for real: the button, the POST, the re-render.
  const filled = await c.eval(fillComposer(MARK));
  await sleep(200);
  const clicked = await c.eval(clickSend);
  ok('chat: composer accepts text and SEND is enabled', filled.filled === true && clicked.clicked === true, JSON.stringify({ filled, clicked }));

  let appeared = false;
  for (let i = 0; i < 24 && !appeared; i++) { await sleep(300); appeared = await c.eval(hasMark); }
  ok('chat: the sent message renders in the thread', appeared, appeared ? MARK : 'not on screen after 7s');

  await shot(c, '/tmp/shot_chat_desktop.png');
  fs.writeFileSync('/tmp/shot_chat_desktop.txt', `url=${chatUrl}\n${JSON.stringify(d, null, 1)}\n${d.text}\n`);

  // ------------------------------------------------- another MvpShell page, same width
  await c.goto(`${BASE}/world`, 3000);
  await sleep(900);
  const w = await c.eval(MEASURE);
  console.log('   /world measure  :', JSON.stringify(w));
  await shot(c, '/tmp/shot_world_desktop.png');

  // ---------------------------------------------------------------- /chat on a phone
  await setViewport(c, 390, 844);
  await c.goto(chatUrl, 3000);
  await waitFor(c, COMPOSER_READY);
  const m = await c.eval(MEASURE);
  console.log('   mobile measure  :', JSON.stringify(m));
  ok('chat mobile: phone layout still fills the width', m.widest > m.vw - 60, `widest ${m.widest}px of ${m.vw}px`);
  ok('chat mobile: still one column (composer under the thread)', !!m.composer && m.composer.x < 40, m.composer ? `composer at x=${m.composer.x}` : 'no composer');
  ok('chat mobile: the phone tab bar is there', m.bottomNav > 0, `${m.bottomNav} visible nav element(s)`);
  await shot(c, '/tmp/shot_chat_mobile.png');

  // ------------------------- the other routes that share the shell, at both widths
  // The container change touches every MvpShell page, so they all get visited rather than
  // assuming they inherit it safely. Errors are read from the CDP exception stream, which
  // catches the "renders but throws" case a width measurement alone would miss.
  const HOSTS = ['/home', '/feed', '/quests', '/store', '/cart', '/orders', '/settings', '/world'];
  const SHELL_WIDTH = `(() => {
    const cards = [...document.querySelectorAll('#__next div')].filter(el => {
      const s = getComputedStyle(el);
      return s.borderTopStyle === 'solid' && s.borderTopColor === 'rgba(171, 212, 158, 0.15)' && parseFloat(s.borderTopWidth) === 1;
    }).map(el => Math.round(el.getBoundingClientRect().width));
    return { widest: cards.length ? Math.max(...cards) : 0, text: document.body.innerText.replace(/\\n+/g, ' | ').slice(0, 80) };
  })()`;

  for (const width of [1440, 390]) {
    await setViewport(c, width, width < 600 ? 844 : 900);
    for (const host of HOSTS) {
      c.freshErrors();
      await c.goto(BASE + host, 2200);
      const errs = c.freshErrors();
      const v = await c.eval(SHELL_WIDTH);
      const fits = width >= 1024 ? v.widest <= 1180 : v.widest === 0 || v.widest > width - 60;
      ok(`shell ${width}px: ${host} renders clean and sized`, errs.length === 0 && fits, errs.length ? String(errs[0]).slice(0, 120) : `${v.widest}px — ${v.text}`);
    }
  }

  // ------------------------------------------- the persisted store carries no password
  // Written as a legacy device would have it, then read back after the app has loaded,
  // rehydrated and persisted again.
  await setViewport(c, 1440, 900);
  await c.goto(BASE + '/', 2500);
  await c.eval(`localStorage.setItem('persist:root', JSON.stringify({
    registerSlice: JSON.stringify({ username: 'legacy-user', email: 'legacy@example.com', password: 'plaintext-from-v0', isLoggedIn: true }),
    _persist: JSON.stringify({ version: 0, rehydrated: true }),
  }))`);
  await c.goto(BASE + '/', 3500);
  await sleep(1500);
  const stored = await c.eval(`(() => {
    const raw = localStorage.getItem('persist:root');
    if (!raw) return { raw: null };
    const root = JSON.parse(raw);
    const slice = root.registerSlice ? JSON.parse(root.registerSlice) : null;
    return { raw, slice, version: root._persist ? JSON.parse(root._persist).version : null };
  })()`);
  console.log('   stored slice    :', JSON.stringify(stored.slice));
  ok('storage: persisted slice has no password key', !!stored.slice && !('password' in stored.slice), JSON.stringify(Object.keys(stored.slice || {})));
  ok('storage: the migration keeps the rest of the slice', !!stored.slice && stored.slice.username === 'legacy-user', JSON.stringify(stored.slice));
  ok('storage: the stored blob is version 1', stored.version === 1, `version=${stored.version}`);
  ok('storage: no plaintext password anywhere in localStorage', !String(stored.raw).includes('plaintext-from-v0'), 'legacy string gone');

  // Leave the slice true to the signed-in session. The legacy blob above is deliberately
  // fake, and a store left holding it makes the next run start from a user that does not
  // exist — which surfaces as "Could not load profile" on /home.
  await c.eval(`localStorage.setItem('persist:root', JSON.stringify({
    registerSlice: JSON.stringify({ username: 'lcj_seed_admin', email: ${JSON.stringify(EMAIL)}, isLoggedIn: true }),
    _persist: JSON.stringify({ version: 1, rehydrated: true }),
  }))`);
  const restored = await c.eval(`JSON.parse(JSON.parse(localStorage.getItem('persist:root')).registerSlice).username`);
  ok('storage: the probe leaves a truthful slice behind', restored === 'lcj_seed_admin', `username=${restored}`);

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);

  // The probe writes a real message; take it back out so repeated runs do not fill the
  // demo thread. Scoped to this run's exact text.
  try {
    // The backend lives beside this repo; override with BACKEND_DIR if it does not.
    const BACKEND = process.env.BACKEND_DIR || require('path').resolve(__dirname, '../../original-backend');
    require(BACKEND + '/node_modules/dotenv').config({ path: BACKEND + '/.env' });
    const mongoose = require(BACKEND + '/node_modules/mongoose');
    const { Message } = require(BACKEND + '/src/models/message');
    await mongoose.connect(process.env.MONGO_URI || process.env.DB_URI || process.env.DATABASE_URL);
    const del = await Message.deleteMany({ content: MARK });
    console.log(`cleanup: removed ${del.deletedCount} probe message(s)`);
    await mongoose.disconnect();
  } catch (err) {
    console.log('cleanup: could not reach the database —', err.message);
  }

  c.close();
  process.exit(failed.length ? 1 : 0);
})().catch((err) => { console.error('probe crashed:', err); process.exit(2); });


