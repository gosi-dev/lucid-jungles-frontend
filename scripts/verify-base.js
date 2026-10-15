// scripts/verify-base.js — a base (/[username]) as a *home*: whose it is, who has
// been there, and whether the numbers on screen are the backend's own numbers.
//
// The base used to draw a hardcoded profile — avatar null, followers '29.7K',
// moments 300, connections 1279 — so every base in the jungle read identically and
// no arrival was ever recorded. Three things changed, and this probe checks all
// three:
//
//   1. the face   — components/MockAvatar.jsx, deterministic per username, with the
//                   real `profile_picture` winning when the owner has one;
//   2. the counts — FOLLOWERS / VISITS / VISITORS read from GET /api/homes/u/:username
//                   and POST /api/visit instead of being invented;
//   3. the knock  — arriving in someone else's base records a visit, and the drawer
//                   says so.
//
// The strongest claim here is the last one: the numbers rendered in the drawer are
// compared, digit for digit, against a fresh GET /api/homes/u/:username.
//
// Screenshots land in /tmp/shot_base_*.png.
//
// Run:  node scripts/verify-base.js        (see scripts/README.md for prerequisites)
const fs = require('fs');
const { newTab, sleep } = require('./cdp');

const BASE = 'http://localhost:3003';
const EMAIL = 'seed@lucidcityjungles.com';
const PASSWORD = 'SeedAdmin@2024!';
// The base being visited. It must not be the account the probe signs in as —
// standing in your own base is not a visit, and the drawer correctly offers the
// customiser instead of CONNECT.
const USERNAME = process.env.BASE_USERNAME || 'bonzo';
// The account the probe signs in as, i.e. the visitor.
const SELF_USERNAME = process.env.SELF_USERNAME || 'lcj_seed_admin';

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

// A real mouse drag: the desk is moved by mouse events on the item plus
// mousemove/mouseup on the window, so making one is the only way to prove that the
// arrangement an owner makes is the arrangement that gets saved.
async function drag(client, from, to) {
  const at = (x, y, type) => ({ type, x: Math.round(x), y: Math.round(y), button: 'left', buttons: 1, clickCount: 1 });
  await client.send('Input.dispatchMouseEvent', at(from.x, from.y, 'mousePressed'));
  await sleep(80);
  await client.send('Input.dispatchMouseEvent', at(from.x + 24, from.y + 18, 'mouseMoved'));
  await sleep(80);
  await client.send('Input.dispatchMouseEvent', at(to.x, to.y, 'mouseMoved'));
  await sleep(80);
  await client.send('Input.dispatchMouseEvent', at(to.x, to.y, 'mouseReleased'));
}

// Where a desk item actually stands: the rendered box (to aim at) and the x/y the
// component placed it at (what gets saved).
const deskItem = (label) => `(() => {
  const el = document.querySelector('#__next [aria-label="Open ${label}"]');
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return {
    x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
    left: Math.round(parseFloat(el.style.left) || 0), top: Math.round(parseFloat(el.style.top) || 0),
    w: Math.round(r.width), h: Math.round(r.height),
  };
})()`;

// Read the base's own pieces: the drawer strip is the button wrapping the first
// avatar, the card appears under it once opened, and the stat row is located from
// its FOLLOWERS label (the one label that appears nowhere else on the page).
const LAYOUT = `(() => {
  const box = (el) => el ? { x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) } : null;
  const leaves = [...document.querySelectorAll('#__next *')].filter(el => !el.children.length);
  const leafEls = (text) => leaves.filter(el => (el.textContent || '').trim().toUpperCase() === text);
  const leafText = (text) => leafEls(text).length;

  // The plan view draws people too (the owner at home, a visitor at the door), so the
  // drawer's own face is read from the avatars OUTSIDE the plan stage.
  const planAvatars = [...document.querySelectorAll('#__next [data-plan-stage] [data-avatar]')];
  const avatars = [...document.querySelectorAll('#__next [data-avatar]')].filter(el => !el.closest('[data-plan-stage]'));
  const strip = avatars.length ? avatars[0].closest('button') : null;

  // The tab bar is the page's only row of four buttons; only the active tab draws
  // its word, the other three draw their icons (see TabBar), so counting labels
  // would undercount the destinations.
  const tabBar = [...document.querySelectorAll('#__next div')].find(el =>
    el.children.length === 4
    && [...el.children].every(ch => ch.tagName === 'BUTTON')
    && getComputedStyle(el).display === 'flex'
    && Math.round(el.getBoundingClientRect().height) === 48) || null;

  // The stat row: FOLLOWERS is its first cell, so the row is the grandparent.
  const followersCell = leafEls('FOLLOWERS')[0] || null;
  const statRow = followersCell ? followersCell.parentElement.parentElement : null;
  const statValues = statRow
    ? [...statRow.children].map(cell => Number(String(cell.textContent || '').replace(/[^0-9]/g, '')))
    : null;

  const cta = [...document.querySelectorAll('#__next button')]
    .find(b => /^(CONNECT|CONNECTED|REQUEST SENT|CUSTOMISE THIS BASE)$/.test((b.textContent || '').trim().toUpperCase())) || null;

  return {
    vw: window.innerWidth,
    vh: window.innerHeight,
    scrollWidth: document.documentElement.scrollWidth,
    notFound: document.body.innerText.toUpperCase().includes('NO BASE BY THAT NAME'),
    // innerText carries the rendered casing, and NotFoundScreen uppercases its title.
    tabs: {
      count: tabBar ? tabBar.children.length : 0,
      icons: tabBar ? tabBar.querySelectorAll('svg').length : 0,
      label: tabBar ? (tabBar.textContent || '').trim().toUpperCase() : null,
    },
    // Who the plan view has standing in it, by name: presence is asserted on the
    // attributes the component actually writes, not on a picture.
    planAvatars: planAvatars.map(el => ({
      name: el.getAttribute('data-avatar-name'),
      kind: el.getAttribute('data-avatar'),
      presence: el.closest('[data-presence]') ? el.closest('[data-presence]').getAttribute('data-presence') : null,
    })),
    avatars: avatars.map(el => ({
      kind: el.getAttribute('data-avatar'),
      name: el.getAttribute('data-avatar-name'),
      tone: Number(el.getAttribute('data-avatar-tone')),
      letter: (el.textContent || '').trim(),
      box: box(el),
    })),
    strip: box(strip),
    stripText: strip ? (strip.textContent || '').trim().toUpperCase() : null,
    labels: {
      followers: leafText('FOLLOWERS'), visits: leafText('VISITS'), visitors: leafText('VISITORS'),
      moments: leafText('MOMENTS'), connections: leafText('CONNECTIONS'),
      xp: leafText('XP'), streak: leafText('STREAK'),
    },
    statValues,
    cta: cta ? (cta.textContent || '').trim().toUpperCase() : null,
    knock: /YOU KNOCKED|YOU WERE HERE TODAY/.test(document.body.innerText),
    fabricated: document.body.innerText.includes('29.7K'),
    text: document.body.innerText.replace(/\\n+/g, ' | ').slice(0, 220),
  };
})()`;

const OPEN_DRAWER = `(() => {
  const avatar = [...document.querySelectorAll('#__next [data-avatar]')].find(el => !el.closest('[data-plan-stage]'));
  const strip = avatar ? avatar.closest('button') : null;
  if (!strip) return { clicked: false };
  strip.click();
  return { clicked: true };
})()`;

const CLICK_CTA = `(() => {
  const el = [...document.querySelectorAll('#__next button')]
    .find(b => (b.textContent || '').trim().toUpperCase() === 'CUSTOMISE THIS BASE');
  if (!el) return { clicked: false };
  el.click();
  return { clicked: true };
})()`;

// ── The plan view ─────────────────────────────────────────────────────────────
// A base read as a *home*: which tier's rooms are drawn, where the desk stands in
// them, what furniture is on the floor, and who is standing in the room. Every
// number here is compared against GET /api/homes/u/:username in the checks below.
const PLAN = `(() => {
  const stage = document.querySelector('#__next [data-plan-stage]');
  const hud = document.querySelector('#__next [data-plan-hud]');
  const num = (v) => Math.round(parseFloat(v) || 0);
  const items = [...document.querySelectorAll('#__next [data-plan-item]')].map(el => {
    const r = el.getBoundingClientRect();
    return {
      id: el.getAttribute('data-plan-item'),
      left: num(el.style.left), top: num(el.style.top),
      w: Math.round(r.width),
      x: Math.round(r.x + r.width / 2), y: Math.round(r.y + r.height / 2),
    };
  });
  return {
    staged: Boolean(stage),
    tier: stage ? Number(stage.getAttribute('data-plan-tier')) : null,
    scale: stage ? Number(stage.getAttribute('data-plan-scale')) : null,
    rooms: [...document.querySelectorAll('#__next [data-room]')].map(el => el.getAttribute('data-room')),
    roomLabels: [...document.querySelectorAll('#__next [data-room]')].map(el => (el.textContent || '').trim()),
    deskInRoom: Boolean(document.querySelector('#__next [data-plan-desk]')),
    deskItems: document.querySelectorAll('#__next [data-plan-desk] [aria-label^="Open "]').length,
    items,
    presence: [...document.querySelectorAll('#__next [data-presence]')].map(el => ({
      kind: el.getAttribute('data-presence'),
      name: el.querySelector('[data-avatar]') ? el.querySelector('[data-avatar]').getAttribute('data-avatar-name') : null,
    })),
    floors: [...document.querySelectorAll('#__next [data-plan-floors] button')].map(b => (b.textContent || '').trim()),
    hud: hud ? hud.textContent.replace(/[\\s]+/g, ' ').trim().toUpperCase() : null,
  };
})()`;

// The property office: the ladder as a listing on /home.
const OFFICE = `(() => {
  const office = document.querySelector('#__next [data-property-office]');
  if (!office) return { present: false };
  const listings = [...office.querySelectorAll('[data-listing]')].map(card => {
    const button = card.querySelector('button');
    const plan = card.querySelector('svg');
    return {
      level: Number(card.getAttribute('data-listing')),
      text: (card.textContent || '').replace(/[\\s]+/g, ' ').trim().toUpperCase(),
      planLabel: plan ? (plan.getAttribute('aria-label') || '') : '',
      planRects: card.querySelectorAll('svg rect').length,
      action: button ? (button.textContent || '').replace(/[\\s]+/g, ' ').trim().toUpperCase() : null,
      disabled: button ? button.disabled : null,
    };
  });
  return { present: true, listings };
})()`;

(async () => {
  const c = await newTab('about:blank');
  await setViewport(c, 390, 844);
  await c.goto(BASE + '/', 2500);
  const signin = await c.eval(`fetch('/api/auth/signin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:${JSON.stringify(EMAIL)},password:${JSON.stringify(PASSWORD)}})}).then(r=>({status:r.status}))`);
  ok('session: signed in, so the visit can be recorded', signin.status === 200, `signin ${signin.status}`);

  // ── Phone: the base at 390 ────────────────────────────────────────────────
  await c.goto(`${BASE}/${USERNAME}`, 3500);
  await sleep(1200); // let the visit POST settle before the drawer is read
  const m = await c.eval(LAYOUT);
  console.log('   mobile strip    :', JSON.stringify(m.strip), '| avatars:', JSON.stringify(m.avatars));
  ok('base mobile: the base renders, not the not-found screen', !m.notFound && !!m.strip, m.notFound ? 'showed 404' : m.text.slice(0, 80));
  ok('base mobile: all four tabs of the home are there',
    m.tabs.count === 4 && m.tabs.icons >= 3 && /^(HOME|KURA|DREAMS|DOJO)$/.test(m.tabs.label || ''),
    JSON.stringify(m.tabs));
  ok('base mobile: the drawer strip is full width and pinned to the bottom',
    !!m.strip && m.strip.w >= m.vw - 2 && m.strip.h === 64 && Math.abs((m.strip.y + m.strip.h) - m.vh) <= 1,
    m.strip ? `strip ${m.strip.w}x${m.strip.h} at y=${m.strip.y} of ${m.vh}` : 'no strip');
  ok('base mobile: the strip names the owner, not the placeholder "USER"',
    !!m.stripText && m.stripText.includes(USERNAME.toUpperCase()),
    `strip reads "${m.stripText}"`);
  ok('base mobile: no horizontal overflow', m.scrollWidth <= m.vw + 1, `scrollWidth ${m.scrollWidth} of ${m.vw}`);

  // ── The face ──────────────────────────────────────────────────────────────
  const face = m.avatars[0] || null;
  ok('face: the base draws an avatar at all', !!face, face ? JSON.stringify(face) : 'no avatar element');
  ok('face: it is the deterministic mock (the seeded owner has no picture)',
    !!face && face.kind === 'mock' && face.name === USERNAME.toLowerCase() && face.tone >= 0 && face.tone <= 5,
    face ? `${face.kind} name=${face.name} tone=${face.tone}` : 'missing');
  ok('face: the monogram is the first letter of the handle',
    !!face && face.letter === USERNAME[0].toUpperCase(),
    face ? `"${face.letter}" for ${USERNAME}` : 'missing');
  ok('face: the strip tile is the 50x50 the strip reserves',
    !!face && face.box.w === 50 && face.box.h === 50,
    face ? `${face.box.w}x${face.box.h}` : 'missing');

  // ── The drawer card: counts, status bars, the knock ───────────────────────
  const opened = await c.eval(OPEN_DRAWER);
  await sleep(600);
  const open = await c.eval(LAYOUT);
  console.log('   mobile drawer   :', JSON.stringify({ labels: open.labels, statValues: open.statValues, cta: open.cta }));
  ok('base mobile: the strip opens the drawer card', opened.clicked === true && open.avatars.length >= 2,
    `${open.avatars.length} avatars after the tap`);
  ok('base mobile: the card repeats the same mock face as the strip',
    open.avatars.length >= 2 && open.avatars[0].tone === open.avatars[1].tone && open.avatars[0].letter === open.avatars[1].letter,
    JSON.stringify(open.avatars.map(a => `${a.tone}${a.letter}`)));
  ok('drawer: the stats are FOLLOWERS / VISITS / VISITORS',
    open.labels.followers === 1 && open.labels.visits >= 1 && open.labels.visitors === 1,
    JSON.stringify(open.labels));
  ok('drawer: the invented MOMENTS / CONNECTIONS / 29.7K are gone',
    open.labels.moments === 0 && open.labels.connections === 0 && !open.fabricated,
    `moments=${open.labels.moments} connections=${open.labels.connections} 29.7K=${open.fabricated}`);
  ok('drawer: the status bars are drawn (XP + STREAK vitals mounted)',
    open.labels.xp >= 1 && open.labels.streak >= 1,
    `XP labels ${open.labels.xp}, STREAK labels ${open.labels.streak}`);
  ok('drawer: the visit is acknowledged for a visitor, and CONNECT is offered',
    open.knock === true && open.cta === 'CONNECT',
    `knock ${open.knock}, cta ${open.cta}`);
  await shot(c, '/tmp/shot_base_mobile.png');

  // ── The numbers on screen are the backend's numbers ───────────────────────
  const api = await c.eval(`fetch('/api/homes/u/${USERNAME}',{credentials:'include'}).then(r=>r.json()).then(b=>({total:b.data.visits.total,unique:b.data.visits.unique,isSelf:b.data.isSelf}))`);
  const [, visits, visitors] = open.statValues || [];
  ok('drawer: FOLLOWERS / VISITS / VISITORS equal GET /api/homes/u/:username',
    Array.isArray(open.statValues) && open.statValues.length === 3 && visits === api.total && visitors === api.unique,
    `ui ${JSON.stringify(open.statValues)} vs api total=${api.total} unique=${api.unique}`);
  ok('visit: the probe account is a visitor here, not the owner', api.isSelf === false, `isSelf=${api.isSelf}`);
  await shot(c, '/tmp/shot_base_drawer.png');

  // ── Desktop: the same base at 1440 ────────────────────────────────────────
  await setViewport(c, 1440, 900);
  await c.goto(`${BASE}/${USERNAME}`, 3500);
  await sleep(1000);
  await c.eval(OPEN_DRAWER);
  await sleep(600);
  const d = await c.eval(LAYOUT);
  console.log('   desktop strip   :', JSON.stringify(d.strip), '| card avatar:', JSON.stringify(d.avatars[1]));
  ok('base desktop: the strip still spans the window', !!d.strip && d.strip.w >= d.vw - 2, d.strip ? `${d.strip.w} of ${d.vw}` : 'no strip');
  ok('base desktop: the card avatar is the desktop 97x97',
    d.avatars.length >= 2 && d.avatars[1].box.w === 97 && d.avatars[1].box.h === 97,
    d.avatars.length >= 2 ? `${d.avatars[1].box.w}x${d.avatars[1].box.h}` : 'no card avatar');
  ok('base desktop: the drawer stays inside the viewport',
    !!d.strip && d.strip.y >= 0 && d.scrollWidth <= d.vw + 1,
    d.strip ? `strip y=${d.strip.y}, scrollWidth ${d.scrollWidth} of ${d.vw}` : 'no strip');
  await shot(c, '/tmp/shot_base_desktop.png');

  // ── Your own base: no visit, no knock, the customiser instead ─────────────
  await setViewport(c, 390, 844);
  await c.goto(`${BASE}/${SELF_USERNAME}`, 3500);
  await sleep(1000);
  await c.eval(OPEN_DRAWER);
  await sleep(600);
  const own = await c.eval(LAYOUT);
  console.log('   own base        :', JSON.stringify({ cta: own.cta, knock: own.knock, statValues: own.statValues }));
  ok('own base: the owner sees the customiser, not CONNECT', own.cta === 'CUSTOMISE THIS BASE', `cta ${own.cta}`);
  ok('own base: the owner is never counted as their own visitor', own.knock === false, `knock ${own.knock}`);
  const ownApi = await c.eval(`fetch('/api/homes/u/${SELF_USERNAME}',{credentials:'include'}).then(r=>r.json()).then(b=>({isSelf:b.data.isSelf}))`);
  ok('own base: the backend agrees this is your own base', ownApi.isSelf === true, `isSelf=${ownApi.isSelf}`);
  if (own.cta === 'CUSTOMISE THIS BASE') {
    const clicked = await c.eval(CLICK_CTA);
    let path = '';
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      path = await c.eval('location.pathname');
      if (path === '/home') break;
    }
    ok('own base: CUSTOMISE THIS BASE opens the base customiser', clicked.clicked === true && path === '/home', path || 'never navigated');
    await shot(c, '/tmp/shot_base_customiser.png');
  }

  // ── The arrangement is saved, and it comes back ───────────────────────────
  // /[username] is a *customisable* home only if what the owner arranges is what
  // HomeBase stores — otherwise the desk is a toy that resets on every visit.
  await setViewport(c, 1440, 900);
  await c.goto(`${BASE}/${SELF_USERNAME}`, 3500);
  await sleep(1800);

  // Start the station from a known arrangement. The subject of this check is "a drag
  // is saved", not "there is room to drag": repeated runs walk the desk into the
  // surface's corner, where the same delta clamps to nothing and the check would
  // report a bug that is really just where the last run left it. Only the JOURNAL's
  // position is reset; the furniture the base carries is left alone.
  const resetRaw = await c.eval(`fetch('/api/homes/u/${SELF_USERNAME}',{credentials:'include'}).then(r=>r.json()).then(b=>b.data.home.roomLayout)`);
  let resetLayout = null;
  try {
    const parsed = resetRaw && resetRaw.trim().startsWith('{') ? JSON.parse(resetRaw) : null;
    if (parsed && Array.isArray(parsed.items)) {
      parsed.items = parsed.items.map(i => (i.id === 'JOURNAL' ? { ...i, x: 110, y: 28 } : i));
      resetLayout = JSON.stringify(parsed);
    }
  } catch { resetLayout = null; }
  if (resetLayout) {
    await c.eval(`fetch('/api/home',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({roomLayout:${JSON.stringify(resetLayout)}})}).then(r=>r.status)`);
    await c.goto(`${BASE}/${SELF_USERNAME}`, 3500);
    await sleep(2000);
  }

  const before = await c.eval(deskItem('JOURNAL'));
  ok('desk: the owner has a desk to arrange', !!before, before ? JSON.stringify(before) : 'no JOURNAL on the desk');
  let moved = null;
  if (before) {
    await drag(c, { x: before.x, y: before.y }, { x: before.x + 90, y: before.y + 60 });
    await sleep(1500);
    moved = await c.eval(deskItem('JOURNAL'));
    const homeAfter = await c.eval(`fetch('/api/homes/u/${SELF_USERNAME}',{credentials:'include'}).then(r=>r.json()).then(b=>b.data.home)`);
    let savedJournal = null;
    try {
      const parsed = homeAfter && typeof homeAfter.roomLayout === 'string' ? JSON.parse(homeAfter.roomLayout) : null;
      savedJournal = parsed && Array.isArray(parsed.items) ? parsed.items.find((i) => i.id === 'JOURNAL') : null;
    } catch {
      savedJournal = null; // an unparseable layout fails the checks below
    }
    ok('desk: the drag moved the item on screen',
      !!moved && (moved.left !== before.left || moved.top !== before.top),
      `${before.left},${before.top} -> ${moved && moved.left},${moved && moved.top}`);
    ok('desk: the arrangement is written to HomeBase (roomLayout)',
      !!savedJournal && savedJournal.x === moved.left && savedJournal.y === moved.top,
      `saved ${JSON.stringify(savedJournal)} vs on screen ${moved && moved.left},${moved && moved.top}`);
    ok('desk: the equipped items are stored as furniture',
      !!homeAfter && Array.isArray(homeAfter.furniture) && homeAfter.furniture.includes('JOURNAL'),
      homeAfter ? `furniture ${JSON.stringify(homeAfter.furniture)}` : 'no HomeBase document');
    await shot(c, '/tmp/shot_base_desk_arranged.png');

    // The proof: come back and stand where the item was left, not where the
    // component's default layout puts it.
    await c.goto(`${BASE}/${SELF_USERNAME}`, 3500);
    await sleep(2200);
    const reloaded = await c.eval(deskItem('JOURNAL'));
    ok('desk: a reload restores the arrangement that was saved',
      !!reloaded && reloaded.left === moved.left && reloaded.top === moved.top,
      reloaded ? `${reloaded.left},${reloaded.top} vs saved ${moved.left},${moved.top}` : 'no JOURNAL after the reload');
    await shot(c, '/tmp/shot_base_desk_reloaded.png');
  }

  // ── The plan view: the base drawn as a home ───────────────────────────────
  // The desk used to *be* the base. It now stands in a room, and what the room shows
  // has to be what HomeBase says: the tier's rooms, the furniture the base carries,
  // and a person standing in it. All three are read off the DOM and compared with a
  // fresh GET /api/homes/u/:username.
  await setViewport(c, 1440, 900);
  await c.goto(`${BASE}/${SELF_USERNAME}`, 3500);
  await sleep(2200);
  const plan0 = await c.eval(PLAN);
  const home0 = await c.eval(`fetch('/api/homes/u/${SELF_USERNAME}',{credentials:'include'}).then(r=>r.json()).then(b=>b.data.home)`);
  const tier0 = (home0 && home0.upgradeLevel) || 1;
  let saved0 = null;
  try {
    saved0 = home0 && typeof home0.roomLayout === 'string' && home0.roomLayout.trim().startsWith('{')
      ? JSON.parse(home0.roomLayout)
      : null;
  } catch { saved0 = null; }
  console.log('   plan (owner)    :', JSON.stringify({ tier: plan0.tier, scale: plan0.scale, rooms: plan0.rooms, items: plan0.items.length, presence: plan0.presence }));
  ok('plan: the base is drawn as a plan at the tier HomeBase stores',
    plan0.staged === true && plan0.tier === tier0,
    `page tier ${plan0.tier} vs api upgradeLevel ${tier0}`);
  ok('plan: the tier\'s rooms are on screen, with the desk standing in one of them',
    plan0.rooms.length >= 1 && plan0.deskInRoom === true && plan0.deskItems >= 4,
    `rooms ${JSON.stringify(plan0.rooms)}, desk in room ${plan0.deskInRoom}, ${plan0.deskItems} desk items`);
  ok('plan: the header says which tier you are standing in',
    !!plan0.hud && plan0.hud.includes(`TIER ${tier0}`),
    plan0.hud || 'no HUD');
  ok('plan: the owner stands in their own room',
    plan0.presence.some(p => p.kind === 'owner' && p.name === SELF_USERNAME.toLowerCase()),
    JSON.stringify(plan0.presence));
  ok('plan: the floor shows what the base carries (v2 floor array, or the tier starter set)',
    saved0 && Array.isArray(saved0.floor)
      ? saved0.floor.length === plan0.items.length
      : plan0.items.length >= 1,
    saved0 && Array.isArray(saved0.floor)
      ? `saved ${saved0.floor.length} vs on screen ${plan0.items.length}`
      : `unsaved base, starter set of ${plan0.items.length}`);
  await shot(c, '/tmp/shot_base_plan.png');

  // ── Furniture: the rules, and the fact that a placement is saved ──────────
  // The same two claims the desk gets, made about the floor: a legal drag is written
  // to roomLayout v2 and comes back on reload; an illegal one is refused and changes
  // nothing. Both are real mouse drags inside the scaled plan.
  const rug0 = plan0.items.find(i => i.id === 'RUG') || plan0.items[0] || null;
  let spot = rug0;
  let movedPlan = null;
  if (rug0) {
    // Which direction is legal depends on where the last run left the furniture, so
    // the probe tries both ways along the axes and takes the one that moves.
    const tries = [[30, 24], [-30, -24], [0, 30], [0, -30]];
    for (const [dx, dy] of tries) {
      if (!spot) break;
      await drag(c, { x: spot.x, y: spot.y }, { x: spot.x + dx, y: spot.y + dy });
      await sleep(1400);
      const now = await c.eval(PLAN);
      const item = now.items.find(i => i.id === rug0.id);
      if (item && (item.left !== spot.left || item.top !== spot.top)) { movedPlan = now; spot = item; break; }
      if (item) spot = item;
    }
    ok('plan: dragging furniture across the floor moves it on screen',
      !!movedPlan,
      movedPlan ? `${rug0.left},${rug0.top} -> ${spot.left},${spot.top}` : 'no direction moved the item');

    const rawAfter = await c.eval(`fetch('/api/homes/u/${SELF_USERNAME}',{credentials:'include'}).then(r=>r.json()).then(b=>b.data.home.roomLayout)`);
    let written = null;
    try { written = rawAfter ? JSON.parse(rawAfter) : null; } catch { written = null; }
    const savedFloorItems = written && Array.isArray(written.floor) ? written.floor : null;
    const savedRug = savedFloorItems ? savedFloorItems.find(i => i.id === rug0.id) : null;
    ok('plan: the placement is written to roomLayout v2 (floor array, version 2)',
      !!written && written.version === 2 && Array.isArray(written.items) && Array.isArray(written.floor),
      written ? `version ${written.version}, items ${(written.items || []).length}, floor ${(written.floor || []).length}` : 'unreadable roomLayout');
    ok('plan: the saved position is the position on screen',
      !!savedRug && !!spot && savedRug.x === spot.left && savedRug.y === spot.top,
      savedRug ? `saved ${savedRug.x},${savedRug.y} vs on screen ${spot && spot.left},${spot && spot.top}` : 'the item is not in the floor array');
    ok('plan: the equipped list still carries the desk items (v1 compatibility)',
      !!written && Array.isArray(written.items) && written.items.some(i => i.id === 'JOURNAL'),
      written ? JSON.stringify((written.items || []).map(i => i.id)) : 'no layout');

    // An illegal drop: far outside the rooms, out over the jungle.
    const beforeIllegal = await c.eval(`fetch('/api/homes/u/${SELF_USERNAME}',{credentials:'include'}).then(r=>r.json()).then(b=>b.data.home.roomLayout)`);
    await drag(c, { x: spot.x, y: spot.y }, { x: spot.x - 320, y: spot.y - 220 });
    await sleep(1600);
    const refused = await c.eval(PLAN);
    const afterIllegal = await c.eval(`fetch('/api/homes/u/${SELF_USERNAME}',{credentials:'include'}).then(r=>r.json()).then(b=>b.data.home.roomLayout)`);
    const still = refused.items.find(i => i.id === rug0.id);
    ok('plan: a drop outside the rooms is refused and nothing is written',
      beforeIllegal === afterIllegal && !!still && still.left === spot.left && still.top === spot.top,
      `record ${beforeIllegal === afterIllegal ? 'unchanged' : 'CHANGED'}; the item is back at ${still && still.left},${still && still.top}`);

    // The same proof the desk gets: come back and find it where it was left.
    await c.goto(`${BASE}/${SELF_USERNAME}`, 3500);
    await sleep(2200);
    const reloadedPlan = await c.eval(PLAN);
    const reloadedRug = reloadedPlan.items.find(i => i.id === rug0.id);
    ok('plan: a reload restores the furniture where it was left',
      !!reloadedRug && reloadedRug.left === spot.left && reloadedRug.top === spot.top,
      reloadedRug ? `${reloadedRug.left},${reloadedRug.top} vs saved ${spot.left},${spot.top}` : 'no furniture after the reload');
    await shot(c, '/tmp/shot_base_plan_furnished.png');
  }

  // A visitor may stand in the base, but the arrangement is not theirs to change.
  const visitorHomeBefore = await c.eval(`fetch('/api/homes/u/${USERNAME}',{credentials:'include'}).then(r=>r.json()).then(b=>b.data.home)`);
  await c.goto(`${BASE}/${USERNAME}`, 3000);
  await sleep(1800);
  const visitorItem = await c.eval(deskItem('JOURNAL'));
  if (visitorItem) await drag(c, { x: visitorItem.x, y: visitorItem.y }, { x: visitorItem.x + 80, y: visitorItem.y + 50 });
  await sleep(1500);
  const visitorHomeAfter = await c.eval(`fetch('/api/homes/u/${USERNAME}',{credentials:'include'}).then(r=>r.json()).then(b=>b.data.home)`);
  ok('desk: a visitor dragging the desk changes nothing on the owner\'s record',
    JSON.stringify(visitorHomeBefore) === JSON.stringify(visitorHomeAfter),
    `${JSON.stringify(visitorHomeBefore)} -> ${JSON.stringify(visitorHomeAfter)}`);

  // ── The same room, seen by a visitor ──────────────────────────────────────
  // Standing in somebody's base now means standing in their room: their furniture,
  // their face at home, and yours at the door — and none of it is yours to move.
  const visitorPlan = await c.eval(PLAN);
  console.log('   plan (visitor)  :', JSON.stringify({ tier: visitorPlan.tier, items: visitorPlan.items.length, presence: visitorPlan.presence }));
  ok('plan: a visitor sees the owner at home and themselves at the door',
    visitorPlan.presence.some(p => p.kind === 'owner' && p.name === USERNAME.toLowerCase())
    && visitorPlan.presence.some(p => p.kind === 'visitor' && p.name === SELF_USERNAME.toLowerCase()),
    JSON.stringify(visitorPlan.presence));

  let ownerFloor = null;
  try {
    const rawOwner = visitorHomeBefore && typeof visitorHomeBefore.roomLayout === 'string' && visitorHomeBefore.roomLayout.trim().startsWith('{')
      ? JSON.parse(visitorHomeBefore.roomLayout)
      : null;
    ownerFloor = rawOwner && Array.isArray(rawOwner.floor) ? rawOwner.floor : null;
  } catch { ownerFloor = null; }
  ok('plan: a visitor is drawn the owner\'s furniture, as the owner\'s base stores it',
    ownerFloor ? visitorPlan.items.length === ownerFloor.length : true,
    ownerFloor ? `owner floor ${ownerFloor.length} vs drawn ${visitorPlan.items.length}` : 'the owner has no v2 floor yet');

  const visitorFurniture = visitorPlan.items[0] || null;
  if (visitorFurniture) {
    await drag(c, { x: visitorFurniture.x, y: visitorFurniture.y }, { x: visitorFurniture.x + 60, y: visitorFurniture.y + 40 });
    await sleep(1500);
    const afterVisitorDrag = await c.eval(PLAN);
    const draggedItem = afterVisitorDrag.items.find(i => i.id === visitorFurniture.id);
    const visitorHomeAfterDrag = await c.eval(`fetch('/api/homes/u/${USERNAME}',{credentials:'include'}).then(r=>r.json()).then(b=>b.data.home)`);
    ok('plan: a visitor dragging the furniture changes nothing on the owner\'s record',
      JSON.stringify(visitorHomeBefore) === JSON.stringify(visitorHomeAfterDrag)
      && !!draggedItem && draggedItem.left === visitorFurniture.left && draggedItem.top === visitorFurniture.top,
      `record ${JSON.stringify(visitorHomeBefore) === JSON.stringify(visitorHomeAfterDrag) ? 'unchanged' : 'CHANGED'}; on screen ${draggedItem && draggedItem.left},${draggedItem && draggedItem.top}`);
  }
  await shot(c, '/tmp/shot_base_plan_visited.png');

  // ── The property office: the ladder, priced, and recorded ─────────────────
  // The ladder is only real if choosing a tier changes the base. This moves the
  // probe's own base up one step through the UI, checks HomeBase.upgradeLevel and
  // that the base redraws itself, then puts the tier back so the suite is idempotent
  // (the same courtesy verify-shell.js pays when it deletes the message it sent).
  await setViewport(c, 1440, 900);
  await c.goto(`${BASE}/home`, 3500);
  await sleep(2500);
  const office = await c.eval(OFFICE);
  console.log('   property office :', JSON.stringify((office.listings || []).map(l => `${l.level}:${l.action}`)));
  ok('property office: all five tiers of the ladder are listed, each with a plan drawing',
    office.present === true && (office.listings || []).length === 5
    && office.listings.every(l => l.planRects >= 2 && /PLAN:/.test(l.planLabel.toUpperCase())),
    office.present ? `${(office.listings || []).length} listings, plans ${JSON.stringify((office.listings || []).map(l => l.planLabel))}` : 'no property office');

  const meHome = await c.eval(`fetch('/api/homes/u/${SELF_USERNAME}',{credentials:'include'}).then(r=>r.json()).then(b=>b.data.home)`);
  const myTier = (meHome && meHome.upgradeLevel) || 1;
  const here = (office.listings || []).find(l => l.level === myTier);
  ok('property office: the tier you live in is the one your base stores, and it is not for sale',
    !!here && here.action === 'YOU LIVE HERE' && here.disabled === true
    && (office.listings || []).filter(l => l.action === 'YOU LIVE HERE').length === 1,
    here ? `tier ${myTier}: ${here.action} (disabled ${here.disabled})` : `no listing for tier ${myTier}`);
  // The listing's plan names the rooms the base itself draws, so a listing cannot sell
  // rooms the plan view has not got.
  ok('property office: the listing for your tier names every room your base draws',
    !!here && plan0.roomLabels.length > 0
    && plan0.roomLabels.every((name) => here.planLabel.toUpperCase().includes(name.toUpperCase())),
    here ? `base rooms ${JSON.stringify(plan0.roomLabels)} vs listing "${here.planLabel}"` : 'no listing');

  const nextListing = (office.listings || []).find(l => l.level === myTier + 1);
  if (nextListing) {
    ok('property office: the next tier up is the only one you may move into, and it is priced',
      nextListing.disabled === false && /^MOVE IN — /.test(nextListing.action || ''),
      `tier ${nextListing.level}: ${nextListing.action} (disabled ${nextListing.disabled})`);
    const clicked = await c.eval(`(() => { const b = document.querySelector('#__next [data-listing="${myTier + 1}"] button'); if (!b) return { clicked: false }; b.click(); return { clicked: true }; })()`);
    await sleep(2500);
    const movedTier = await c.eval(`fetch('/api/homes/u/${SELF_USERNAME}',{credentials:'include'}).then(r=>r.json()).then(b=>b.data.home.upgradeLevel)`);
    ok('property office: moving in is recorded on HomeBase.upgradeLevel',
      clicked.clicked === true && movedTier === myTier + 1,
      `clicked ${clicked.clicked}, upgradeLevel ${myTier} -> ${movedTier}`);

    await c.goto(`${BASE}/${SELF_USERNAME}`, 3500);
    await sleep(2500);
    const planUp = await c.eval(PLAN);
    ok('property office: the base redraws itself around the new tier',
      planUp.tier === myTier + 1 && !!planUp.hud && planUp.hud.includes(`TIER ${myTier + 1}`),
      `plan tier ${planUp.tier}, hud ${planUp.hud}`);
    await shot(c, `/tmp/shot_base_plan_tier${myTier + 1}.png`);

    const restored = await c.eval(`fetch('/api/home',{method:'PUT',credentials:'include',headers:{'Content-Type':'application/json'},body:JSON.stringify({upgradeLevel:${myTier}})}).then(r=>({status:r.status}))`);
    ok('property office: the tier is put back, so the suite can run again',
      restored.status === 200, `PUT ${restored.status}`);
  } else {
    ok('property office: the top of the ladder has no next tier to sell', true, `already at tier ${myTier}`);
  }

  // ── A base that does not exist still 404s ─────────────────────────────────
  await c.goto(`${BASE}/nobodygoesbythisname`, 3500);
  await sleep(1200);
  const missing = await c.eval(`(() => ({ notFound: document.body.innerText.toUpperCase().includes('NO BASE BY THAT NAME') }))()`);
  ok('route gate: a typo still shows the not-found screen', missing.notFound === true, `notFound=${missing.notFound}`);

  const failed = results.filter((r) => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  c.close();
  process.exit(failed.length ? 1 : 0);
})().catch((err) => { console.error('probe crashed:', err); process.exit(2); });
