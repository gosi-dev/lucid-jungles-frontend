// scripts/verify-profile.js — the VIEW PROFILE destination (pages/profile/[username].js)
// at desktop and phone widths, and whether it can be written back to.
//
// The entity profile dialog offers MESSAGE and VIEW PROFILE. MESSAGE lands on /chat (see
// verify-shell.js); this covers the other one: the page a profile action opens, and the
// conversation it should be able to start.
//
// Screenshots land in /tmp/shot_profile_*.png.
//
// Run:  node scripts/verify-profile.js        (see scripts/README.md for prerequisites)
const fs = require('fs');
const { newTab, sleep } = require('./cdp');

const BASE = 'http://localhost:3003';
const EMAIL = 'seed@lucidcityjungles.com';
const PASSWORD = 'SeedAdmin@2024!';
// Somebody else's profile, which is what the entity dialog's VIEW PROFILE opens. It has to
// be an account that is not the signed-in one, or the page correctly offers the edit link
// instead of MESSAGE.
const USERNAME = process.env.PROFILE_USERNAME || 'bonzo';
// The account the probe signs in as.
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

// The page's own pieces, read by role rather than by class: the name is its only h1, the
// avatar is the round element, ABOUT is a labelled block, and an action is a button or link
// whose text is its label.
const LAYOUT = `(() => {
  const box = (el) => el ? { x: Math.round(el.getBoundingClientRect().x), y: Math.round(el.getBoundingClientRect().y), w: Math.round(el.getBoundingClientRect().width), h: Math.round(el.getBoundingClientRect().height) } : null;
  const h1 = document.querySelector('#__next h1');
  const round = [...document.querySelectorAll('#__next div')].find(d => getComputedStyle(d).borderRadius === '50%');
  const labelOf = (text) => [...document.querySelectorAll('#__next p, #__next div')]
    .filter(el => (el.textContent || '').trim().toUpperCase() === text)
    .pop() || null;
  const message = [...document.querySelectorAll('#__next button, #__next a')]
    .find(el => (el.textContent || '').trim().toUpperCase() === 'MESSAGE') || null;
  // The content column: walking up from the name, the outermost ancestor that is still
  // narrower than the window. The page wrapper is full-bleed, so measuring the widest
  // element would just measure the viewport.
  const columnOf = (el) => {
    let node = el, last = el;
    while (node && node.parentElement && node.getBoundingClientRect().width < window.innerWidth - 1) {
      last = node;
      node = node.parentElement;
    }
    return last;
  };
  // XP is on every profile, so the stats row is the second block even without a bio.
  const xp = labelOf('XP');
  return {
    vw: window.innerWidth,
    h1: box(h1),
    nameSize: h1 ? parseFloat(getComputedStyle(h1).fontSize) : null,
    avatar: box(round),
    stats: box(xp ? xp.parentElement : null),
    column: box(columnOf(h1)),
    message: message ? { label: message.textContent.trim(), tag: message.tagName } : null,
    notFound: document.body.innerText.includes('Profile not found'),
    text: document.body.innerText.replace(/\\n+/g, ' | ').slice(0, 200),
  };
})()`;

const clickMessage = `(() => {
  const el = [...document.querySelectorAll('#__next button, #__next a')].find(e => (e.textContent || '').trim().toUpperCase() === 'MESSAGE');
  if (!el) return { clicked: false };
  el.click();
  return { clicked: true };
})()`;

(async () => {
  const c = await newTab('about:blank');
  await setViewport(c, 1440, 900);
  await c.goto(BASE + '/', 2500);
  const signin = await c.eval(`fetch('/api/auth/signin',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:${JSON.stringify(EMAIL)},password:${JSON.stringify(PASSWORD)}})}).then(r=>({status:r.status}))`);
  ok('session: signed in for the profile probe', signin.status === 200, `signin ${signin.status}`);

  // Somebody else's profile, which is what the entity dialog's VIEW PROFILE opens.
  const url = `${BASE}/profile/${USERNAME}`;
  await c.goto(url, 3500);
  await sleep(800);

  const d = await c.eval(LAYOUT);
  console.log('   desktop layout  :', JSON.stringify(d));
  ok('profile: the page renders a profile, not "Profile not found"', !!d.h1 && !d.notFound, d.notFound ? 'not found' : d.text.slice(0, 90));
  ok('profile desktop: content uses the desktop grid, not a phone column', d.column.w > 900 && d.column.w <= 1180, `column ${d.column.w}px of ${d.vw}px`);
  ok('profile desktop: identity and the stats sit side by side', !!d.avatar && !!d.stats && d.stats.x > d.avatar.x + 100, d.stats ? `avatar x=${d.avatar.x} stats x=${d.stats.x}` : 'blocks missing');
  ok('profile desktop: the name is desktop-sized', d.nameSize >= 30, `${d.nameSize}px`);
  ok('profile desktop: the page offers MESSAGE', !!d.message, d.message ? d.message.tag : 'no MESSAGE action');
  await shot(c, '/tmp/shot_profile_desktop.png');

  // MESSAGE is the same loop the entity dialog opens from the other end.
  if (d.message) {
    await c.eval(clickMessage);
    let path = '';
    for (let i = 0; i < 20; i++) {
      await sleep(300);
      path = await c.eval('location.pathname + location.search');
      if (path.startsWith('/chat')) break;
    }
    ok('profile desktop: MESSAGE opens the conversation with this person', path.startsWith('/chat?to='), path);
    await shot(c, '/tmp/shot_profile_message.png');
  }

  // Your own profile is the other branch: an edit link, and nothing to message.
  await c.goto(`${BASE}/profile/${SELF_USERNAME}`, 3000);
  await sleep(800);
  const own = await c.eval(LAYOUT);
  ok('profile: your own profile edits rather than messaging', !own.message && own.text.includes('GO TO YOUR KURA'), own.message ? 'MESSAGE present on own profile' : own.text.slice(0, 60));

  await setViewport(c, 390, 844);
  await c.goto(url, 3000);
  await sleep(1000);
  const m = await c.eval(LAYOUT);
  console.log('   mobile layout   :', JSON.stringify(m));
  ok('profile mobile: still one column, full width', m.column.w > m.vw - 60 && !!m.avatar && !!m.stats && Math.abs(m.stats.x - m.avatar.x) < 60, `column ${m.column.w}px, avatar x=${m.avatar && m.avatar.x}, stats x=${m.stats && m.stats.x}`);
  ok('profile mobile: the name stays phone-sized', m.nameSize <= 30, `${m.nameSize}px`);
  await shot(c, '/tmp/shot_profile_mobile.png');

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  c.close();
  process.exit(failed.length ? 1 : 0);
})().catch((err) => { console.error('probe crashed:', err); process.exit(2); });
