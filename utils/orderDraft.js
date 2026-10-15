// utils/orderDraft.js
//
// One purchase spans four screens — select, details, pay, receipt — and the receipt has
// to survive a refresh. Rather than growing the cart through ever-longer query strings,
// every stage reads and writes one draft in sessionStorage, keyed by event. Session
// scope means a draft cannot leak between accounts on a shared device, and it is gone
// when the tab closes.

const keyFor = (eventId) => `lj:order:${eventId}`;

export function readDraft(eventId) {
  if (typeof window === 'undefined' || !eventId) return {};
  try {
    return JSON.parse(window.sessionStorage.getItem(keyFor(eventId)) || '{}') || {};
  } catch {
    return {};
  }
}

export function saveDraft(eventId, patch) {
  if (typeof window === 'undefined' || !eventId) return {};
  const next = { ...readDraft(eventId), ...patch, updatedAt: Date.now() };
  try {
    window.sessionStorage.setItem(keyFor(eventId), JSON.stringify(next));
  } catch {
    /* private mode / quota — the flow still works, it just cannot be resumed */
  }
  return next;
}

export function clearDraft(eventId) {
  if (typeof window === 'undefined' || !eventId) return;
  try {
    window.sessionStorage.removeItem(keyFor(eventId));
  } catch {
    /* nothing to do */
  }
}

// Selected tiers → priced lines. Quantities are clamped to what is still available, so a
// draft left open while tickets sell out cannot oversell on the way back in.
export function buildLines(tickets = [], selections = {}) {
  return tickets
    .map((t) => {
      const id = t._id || t.id;
      const price = Number(t.price) || 0;
      const hasStock = typeof t.quantity === 'number';
      const available = hasStock ? Math.max(0, t.quantity - (t.sold || 0)) : null;
      const wanted = Number(selections[id]) || 0;
      const qty = available === null ? wanted : Math.min(wanted, available);
      return { id, name: t.name || t.type || 'Ticket', price, qty, subtotal: qty * price, available };
    })
    .filter((l) => l.qty > 0);
}

export const totalOf = (lines = []) => lines.reduce((sum, l) => sum + l.subtotal, 0);
export const isFree = (lines = []) => totalOf(lines) === 0;

export const money = (amount) => `₦${Number(amount || 0).toLocaleString('en-NG')}`;

// The three committed steps of the purchase. Shared so the stepper and the pages cannot
// disagree about where a user is.
export const STEPS = ['TICKETS', 'DETAILS', 'PAYMENT'];

export function orderPath(step, eventId) {
  if (step === 1) return `/events/${eventId}/tickets`;
  if (step === 2) return `/events/${eventId}/checkout`;
  return `/events/${eventId}/payment`;
}

// Returning to a half-finished purchase after signing in is the whole point of the gate,
// so carry the destination with us.
export const signinHref = (path) => `/signin?next=${encodeURIComponent(path)}`;

export function buyerFrom(user) {
  return { name: user?.username || '', email: user?.email || '', phone: '' };
}
