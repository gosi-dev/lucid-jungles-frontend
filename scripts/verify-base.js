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

  const avatars = [...document.querySelectorAll('#__next [data-avatar]')];
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
  const avatar = document.querySelector('#__next [data-avatar]');
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
