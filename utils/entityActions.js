// utils/entityActions.js
//
// What someone at an event can actually be reached through.
//
// The entity profile used to render a fixed pair of buttons — CONTACT and VIEW
// PORTFOLIO — on every entity regardless of type or data. Neither had a handler, and
// the only wired one (VIEW PROFILE) pushed an ObjectId into the username route, so it
// resolved to "Profile not found". This module derives the actions from the fields the
// platform itself collects, so a rendered button always has somewhere to go:
//
//   attendee.userId                  → in-app message + public profile
//   talent.email                     → mailto           (talent invitation form)
//   exhibitor.email                  → mailto           (vendor invitation form)
//   exhibitor.website                → the exhibitor's own store/portfolio
//   talent.socialLinks               → first usable link in the free-text field
//
// An entity with none of these gets no buttons and an honest line of copy instead of a
// dead end.

// Free text ("instagram.com/x, https://y.io") → the first token that can be opened.
// Returns null rather than guessing a scheme for obvious non-links.
export function firstUrl(value) {
  if (!value || typeof value !== 'string') return null;
  const token = value
    .split(/[\s,;]+/)
    .map(t => t.trim())
    .find(t => /^(https?:\/\/|www\.)/i.test(t) || /^[a-z0-9-]+(\.[a-z0-9-]+)+\/?/i.test(t));
  if (!token) return null;
  return /^https?:\/\//i.test(token) ? token : `https://${token}`;
}

const EXTERNAL_LABEL = {
  ATTENDEE: 'VIEW LINK',
  TALENT: 'VIEW WORK',
  EXHIBITOR: 'VIEW PORTFOLIO',
};

// Actions that need no network call: everything except resolving a username.
export function entityActions(entity = {}, type = 'ATTENDEE') {
  const actions = [];
  const name = entity.name || entity.company || '';
  const email = entity.email || entity.contactEmail;
  const userId = entity.userId ? String(entity.userId) : null;

  if (userId) {
    actions.push({ id: 'message', label: 'MESSAGE', kind: 'message', userId, name });
    actions.push({ id: 'profile', label: 'VIEW PROFILE', kind: 'profile', userId });
  }

  if (email) {
    const subject = encodeURIComponent(name ? `Lucid Jungles — ${name}` : 'Lucid Jungles');
    actions.push({ id: 'contact', label: 'CONTACT', kind: 'mailto', href: `mailto:${email}?subject=${subject}` });
  }

  // Exhibitors sell from their own site; a talent's links are their work.
  const link = type === 'EXHIBITOR' ? (entity.website || firstUrl(entity.socialLinks)) : firstUrl(entity.socialLinks) || entity.website;
  if (link) {
    actions.push({ id: 'external', label: EXTERNAL_LABEL[type] || 'VIEW LINK', kind: 'external', href: link });
  }

  return actions;
}

// Shown in place of the action row when there is nothing to click. Explains the absence
// rather than hiding it — an attendee without an account is a real, common case.
export function entityFallbackLine(entity = {}, type = 'ATTENDEE') {
  if (type === 'ATTENDEE') {
    return 'No Lucid Jungles account is linked to this attendee yet — say hello at the door.';
  }
  if (type === 'TALENT') {
    return 'No contact details were provided with this talent listing.';
  }
  return 'No contact details were provided with this exhibitor listing.';
}
