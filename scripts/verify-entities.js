// scripts/verify-entities.js — the entity list and profile surfaces (attendees, talents,
// exhibitors) at desktop and phone widths, plus the destination of every action button.
//
// Checks that each entity surface renders a desktop layout, that CONTACT / VIEW PORTFOLIO /
// VIEW PROFILE / MESSAGE all lead somewhere real, and that the phone layout is unchanged.
// Screenshots land in /tmp/shot_*.png for eyeballing.
//
// Run:  node scripts/verify-entities.js        (see scripts/README.md for prerequisites)
const fs = require('fs');
const { newTab, sleep } = require('./cdp');

const BASE = 'http://localhost:3003';
// The seeded demo event. Override for another event: EVENT_ID=<id> node scripts/verify-entities.js
const EVENT = process.env.EVENT_ID || '6a1986e07fe26b4dfa2f882a';
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
  await client.send('Emulation.setDeviceMetricsOverride', {
    width, height, deviceScaleFactor: 1, mobile: width < 600,
  });
}

// Reads the overlay currently on screen: <a> destinations and <button> labels.
const MODAL_PROBE = `(() => {
  const fixedAncestor = (el) => {
    for (let n = el; n; n = n.parentElement) {
      const s = getComputedStyle(n);
      if (s.position === 'fixed' && Number(s.zIndex) >= 9000) return true;
    }
    return false;
  };
  const measure = (el, label, extra) => ({
    label,
    w: Math.round(el.getBoundingClientRect().width),
    h: Math.round(el.getBoundingClientRect().height),
    ...extra,
  });
  const links = [...document.querySelectorAll('a')]
    .filter(a => fixedAncestor(a) && a.getBoundingClientRect().width > 0)
    .map(a => measure(a, a.textContent.trim(), { href: a.getAttribute('href'), target: a.getAttribute('target') }));
  const buttons = [...document.querySelectorAll('button')]
    .filter(b => fixedAncestor(b) && b.getBoundingClientRect().width > 0 && b.textContent.trim())
    .map(b => measure(b, b.textContent.trim(), {}));
  // Everything clickable that the profile offers, anchors included — CONTACT and VIEW
  // PORTFOLIO are real links, MESSAGE and VIEW PROFILE are buttons.
  const actions = [...buttons, ...links].filter(a => a.label);
  const dialog = document.querySelector('[role="dialog"]');
  const text = dialog ? dialog.innerText : document.body.innerText;
  return {
    dialog: !!dialog,
    dialogWidth: dialog ? Math.round(dialog.getBoundingClientRect().width) : null,
    dialogHeight: dialog ? Math.round(dialog.getBoundingClientRect().height) : null,
    modalText: text,
    hasUndefined: /undefined|NaN/.test(text),
    links, buttons, actions,
    vw: window.innerWidth,
  };
})()`;

// The list/grid container inside an entity section.
const SECTION_PROBE = (title) => `(() => {
  const header = [...document.querySelectorAll('div,span')]
    .find(el => el.children.length === 0 && el.textContent.trim().startsWith(${JSON.stringify(title)}));
  if (!header) return { found: false };
  let node = header.parentElement;
  for (let i = 0; i < 5 && node; i++) {
    const row = [...node.querySelectorAll('div')].find(d => {
      const s = getComputedStyle(d);
      return (s.display === 'grid' || (s.display === 'flex' && s.overflowX === 'auto')) && d.children.length > 0;
    });
    if (row) {
      const kids = [...row.children];
      return {
        found: true,
        display: getComputedStyle(row).display,
        overflowX: getComputedStyle(row).overflowX,
        columns: getComputedStyle(row).gridTemplateColumns,
        cardWidths: kids.map(k => Math.round(k.getBoundingClientRect().width)).slice(0, 6),
        rowsTop: kids.map(k => Math.round(k.getBoundingClientRect().top)).filter((v, i, a) => a.indexOf(v) === i).length,
      };
    }
    node = node.parentElement;
  }
  return { found: false };
})()`;

const OVERFLOW_PROBE = `(() => ({
  scrollWidth: document.documentElement.scrollWidth,
  clientWidth: document.documentElement.clientWidth,
  bodyText: document.body.innerText,
}))()`;

const tapCard = (name) => `(() => {
  const c = [...document.querySelectorAll('button')].find(b => b.textContent.trim().startsWith(${JSON.stringify(name)}));
  if (!c) return false;
  c.click();
  return true;
})()`;

module.exports = { ok, shot, setViewport, MODAL_PROBE, SECTION_PROBE, OVERFLOW_PROBE, tapCard, results, BASE, EVENT, sleep, newTab };

(async () => {
  const client = await newTab('about:blank');
  await client.send('Page.enable');
  await client.send('Runtime.enable');

  // ── Desktop (1440): event page ─────────────────────────────────────────────
  await setViewport(client, 1440, 900);
  await client.goto(`${BASE}/events/${EVENT}`, 4500);
  const first = await client.eval(OVERFLOW_PROBE);
  ok('event page: no horizontal overflow at 1440', first.scrollWidth <= first.clientWidth + 2, `scrollWidth=${first.scrollWidth} clientWidth=${first.clientWidth}`);
  ok('event page: header shows the event title', first.bodyText.includes('Lucid Jungles: The Gathering'), '');
  ok('event page: no hardcoded "Event Name" placeholder', !first.bodyText.includes('Event Name'), '');

  for (const [title, label] of [["Who's Coming?", 'attendees'], ['Featured Talent', 'talent'], ['Exhibitors', 'exhibitors']]) {
    const s = await client.eval(SECTION_PROBE(title));
    ok(`event page: ${label} section is a grid at 1440`, s.found && s.display === 'grid', `display=${s.display} columns=${s.columns}`);
    ok(`event page: ${label} cards share a row at 1440`, s.found && s.rowsTop <= 2, `distinct rows=${s.rowsTop} widths=${(s.cardWidths || []).join(',')}`);
  }
  await shot(client, '/tmp/shot_ev_desktop.png');

  // ── Desktop (1440): entity list ────────────────────────────────────────────
  await client.goto(`${BASE}/events/${EVENT}/entities?tab=TALENTS`, 3500);
  const tabs = await client.eval(`(() => {
    const btns = [...document.querySelectorAll('button')].filter(b => ['ATTENDEES','TALENT','EXHIBITORS'].some(t => b.textContent.toUpperCase().startsWith(t)));
    return { count: btns.length, total: btns.reduce((a, b) => a + b.getBoundingClientRect().width, 0), vw: window.innerWidth };
  })()`);
  ok('entities list: tabs are a control, not full-window thirds', tabs.count === 3 && tabs.total < tabs.vw * 0.7, `total=${Math.round(tabs.total)} of ${tabs.vw}`);
  const grid = await client.eval(`(() => {
    const cell = [...document.querySelectorAll('button')].find(b => b.getAttribute('title'));
    const row = cell && cell.parentElement;
    const kids = row ? [...row.children] : [];
    return {
      cols: row ? getComputedStyle(row).gridTemplateColumns : '',
      cellWidth: cell ? Math.round(cell.getBoundingClientRect().width) : 0,
      rows: kids.map(k => Math.round(k.getBoundingClientRect().top)).filter((v, i, a) => a.indexOf(v) === i).length,
      cells: kids.length,
    };
  })()`);
  ok('entities list: grid is multi-column on desktop', grid.cellWidth > 120 && grid.cellWidth < 340, `cell=${grid.cellWidth}px rows=${grid.rows} of ${grid.cells} cols=${grid.cols}`);
  await shot(client, '/tmp/shot_entities_desktop.png');

  // ── Talent profile ─────────────────────────────────────────────────────────
  await client.eval(tapCard('Psyu'));
  await sleep(1400);
  const talent = await client.eval(MODAL_PROBE);
  ok('talent profile: renders as a desktop dialog', talent.dialog && talent.dialogWidth > 800 && talent.dialogWidth < talent.vw, `dialog=${talent.dialogWidth}px in a ${talent.vw}px viewport`);
  ok('talent profile: no invented tag row', !/INNOVATION|CREATIVE NETWORKING/.test(talent.modalText), '');
  ok('talent profile: no "undefined" in content', !talent.hasUndefined, '');
  const talentContact = (talent.links || []).find(l => l.label === 'CONTACT');
  ok('talent CONTACT leads to a mailto', !!talentContact && String(talentContact.href).startsWith('mailto:'), talentContact ? talentContact.href : 'no CONTACT link');
  ok('talent profile: actions sit in a desktop row', (talent.actions || []).length >= 1 && talent.actions.every(a => a.h < 60 && a.w >= 150), JSON.stringify(talent.actions));
  await shot(client, '/tmp/shot_modal_talent_desktop.png');

  await client.send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(700);
  const closed = await client.eval(`(() => !document.querySelector('[role="dialog"]'))()`);
  ok('talent profile: Escape closes the dialog', closed === true, '');


  // ── Exhibitor profile ──────────────────────────────────────────────────────
  await client.goto(`${BASE}/events/${EVENT}/entities?tab=EXHIBITORS`, 3000);
  await client.eval(tapCard('Kura'));
  await sleep(1400);
  const ex = await client.eval(MODAL_PROBE);
  const portfolio = (ex.links || []).find(l => l.label === 'VIEW PORTFOLIO');
  const exContact = (ex.links || []).find(l => l.label === 'CONTACT');
  ok('exhibitor profile: dialog on desktop', ex.dialog && ex.dialogWidth > 800, `dialog=${ex.dialogWidth}px`);
  ok('exhibitor VIEW PORTFOLIO leads to the exhibitor site', !!portfolio && /^https?:\/\//.test(portfolio.href) && portfolio.target === '_blank', portfolio ? `${portfolio.href} target=${portfolio.target}` : 'no VIEW PORTFOLIO link');
  ok('exhibitor CONTACT leads to a mailto', !!exContact && String(exContact.href).startsWith('mailto:'), exContact ? exContact.href : 'no CONTACT link');
  ok('exhibitor profile: no "₦undefined" price row', !ex.hasUndefined, /undefined/i.test(ex.modalText) ? 'found "undefined"' : 'clean');
  ok('exhibitor profile: CONTACT and VIEW PORTFOLIO share one row',
    (ex.actions || []).length === 2 && new Set((ex.actions || []).map(a => a.h)).size === 1,
    JSON.stringify(ex.actions));
  await shot(client, '/tmp/shot_modal_exhibitor_desktop.png');
  await client.eval(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'Close'); if (b) b.click(); return !!b; })()`);
  await sleep(600);

  // ── Attendee with and without an account ───────────────────────────────────
  await client.goto(`${BASE}/events/${EVENT}/entities?tab=ATTENDEES`, 3000);
  await client.eval(tapCard('Bonzo'));
  await sleep(1600);
  const att = await client.eval(MODAL_PROBE);
  const msg = (att.buttons || []).find(b => b.label.startsWith('MESSAGE'));
  ok('attendee with an account offers MESSAGE', !!msg, JSON.stringify((att.buttons || []).map(b => b.label)));
  ok('attendee with an account: two actions share one desktop row',
    (att.actions || []).length === 2 && new Set(att.actions.map(a => a.h)).size === 1,
    JSON.stringify(att.actions));
  await shot(client, '/tmp/shot_modal_attendee_desktop.png');

  // VIEW PROFILE must resolve to a username the /profile/<username> route can serve — it used
  // to push the raw ObjectId and land on "Profile not found".
  const viewProfile = (att.buttons || []).find(b => b.label === 'VIEW PROFILE');
  if (viewProfile) {
    const before = await client.eval('location.pathname');
    await client.eval(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim() === 'VIEW PROFILE'); if (b) b.click(); return !!b; })()`);
    // The lookup resolves the id to a username before routing, so poll rather than guess a
    // single delay — a fixed wait made this check the flakiest thing in the run.
    let url = before;
    for (let i = 0; i < 12 && url === before; i += 1) {
      await sleep(700);
      url = await client.eval('location.pathname');
    }
    const profileOk = await client.eval(`(() => !/Profile not found/i.test(document.body.innerText))()`);
    ok('VIEW PROFILE leads to a real profile, not "Profile not found"', url.startsWith('/profile/') && url !== '/profile/' && profileOk, `${url} notFoundRendered=${!profileOk}`);
    await client.goto(`${BASE}/events/${EVENT}/entities?tab=ATTENDEES`, 2500);
    await client.eval(tapCard('Bonzo'));
    await sleep(1500);
  }
  if (msg) {
    await client.eval(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.textContent.trim().startsWith('MESSAGE')); if (b) b.click(); return !!b; })()`);
    await sleep(3000);
    const url = await client.eval('location.pathname + location.search');
    ok('MESSAGE lands on a conversation (or the sign-in gate)', url.startsWith('/chat') || url.startsWith('/signin'), url);
  }
  await client.goto(`${BASE}/events/${EVENT}/entities?tab=ATTENDEES`, 2500);
  await client.eval(tapCard('Xi'));
  await sleep(1400);
  const att2 = await client.eval(MODAL_PROBE);
  ok('attendee without an account explains itself instead of dead buttons',
    (att2.actions || []).length === 0 && /no lucid jungles account is linked/i.test(att2.modalText),
    `actions=${(att2.actions || []).map(b => b.label).join('|')} dialog=${att2.dialog} text="${(att2.modalText || '').replace(/\n/g, ' / ').slice(0, 160)}"`);
  await client.eval(`(() => { const b = [...document.querySelectorAll('button')].find(x => x.getAttribute('aria-label') === 'Close'); if (b) b.click(); return !!b; })()`);

  // ── Phone width: the sheet must still be a sheet ───────────────────────────
  await setViewport(client, 390, 844);
  await client.goto(`${BASE}/events/${EVENT}/entities?tab=TALENTS`, 3000);
  await client.eval(tapCard('Psyu'));
  await sleep(1400);
  const mob = await client.eval(MODAL_PROBE);
  ok('phone: profile is a full-screen sheet, not a dialog', mob.dialog === false && mob.dialogWidth === null, '');
  ok('phone: action targets are full-width and tappable', (mob.actions || []).length > 0 && mob.actions.every(a => a.w > 300 && a.h >= 44), JSON.stringify(mob.actions));
  ok('phone: actions stack in one column', new Set((mob.actions || []).map(a => a.w)).size <= 2, JSON.stringify((mob.actions || []).map(a => `${a.label}:${a.w}x${a.h}`)));
  const mobContact = (mob.links || []).find(l => l.label === 'CONTACT');
  ok('phone: CONTACT still reaches a mailto', !!mobContact && String(mobContact.href).startsWith('mailto:'), mobContact ? mobContact.href : 'no CONTACT link');
  await shot(client, '/tmp/shot_modal_talent_mobile.png');
  await client.goto(`${BASE}/events/${EVENT}/entities?tab=EXHIBITORS`, 2500);
  await shot(client, '/tmp/shot_entities_mobile.png');
  await client.goto(`${BASE}/events/${EVENT}`, 3500);
  const mobPage = await client.eval(OVERFLOW_PROBE);
  const mobSection = await client.eval(SECTION_PROBE("Who's Coming?"));
  ok('phone: event page keeps its horizontal scroller', mobSection.found && mobSection.overflowX === 'auto', `display=${mobSection.display} overflowX=${mobSection.overflowX}`);
  ok('phone: no horizontal page overflow', mobPage.scrollWidth <= mobPage.clientWidth + 2, `scrollWidth=${mobPage.scrollWidth}`);
  await shot(client, '/tmp/shot_ev_mobile.png');

  const errors = client.freshErrors();
  ok('no runtime exceptions during the run', errors.length === 0, errors.slice(0, 3).join(' | '));
  const consoleErrors = client.logs.filter(l => l.startsWith('[error]'));
  ok('no console errors during the run', consoleErrors.length === 0, consoleErrors.slice(0, 3).join(' | '));

  const failed = results.filter(r => !r.pass);
  console.log(`\n${results.length - failed.length}/${results.length} checks passed`);
  console.log('screenshots: shot_ev_desktop.png shot_entities_desktop.png shot_modal_talent_desktop.png shot_modal_exhibitor_desktop.png shot_modal_attendee_desktop.png shot_modal_talent_mobile.png shot_entities_mobile.png shot_ev_mobile.png');
  client.close();
  process.exit(failed.length ? 1 : 0);
})().catch((e) => { console.error('PROBE ERROR', e); process.exit(2); });

