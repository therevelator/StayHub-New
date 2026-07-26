// Small date helpers shared across specs.

export const pad = (n) => String(n).padStart(2, '0');

/** Format a Date as `yyyy-MM-dd` (what the booking/availability APIs expect). */
export const fmt = (d) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

/** Return a new Date `days` after `base` (does not mutate `base`). */
export const addDays = (base, days) => {
  const d = new Date(base);
  d.setDate(d.getDate() + days);
  return d;
};

/** react-calendar month navigation label, e.g. "August 2026". */
export const monthLabel = (d) =>
  d.toLocaleString('en-US', { month: 'long', year: 'numeric' });

/** react-calendar tile aria-label, e.g. "August 11, 2026". */
export const tileLabel = (d) =>
  d.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });

/**
 * A far-future base date, spread out per-call so parallel specs are unlikely to
 * collide on the same room/nights. Anything created is also cancelled in
 * afterEach, so this is just belt-and-suspenders.
 */
export const futureBase = (extraOffset = 0) => addDays(new Date(), 90 + extraOffset);

/** Build the localStorage `user` object the app expects (with role flags). */
export const storedUser = (user, role) => ({
  ...user,
  role: role ?? user?.role ?? null,
  isAdmin: (role ?? user?.role) === 'admin',
  isGuest: (role ?? user?.role) === 'guest',
  isHost: (role ?? user?.role) === 'host',
});
