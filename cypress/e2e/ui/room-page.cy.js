// Room page UI — guards the auth prompt, the calendar back-to-back rendering,
// and the night-count display. Self-provisions its own room (no seed data).
import { fmt, addDays, monthLabel, tileLabel } from '../../support/utils';

// 10th of the month, three months out — an isolated window whose days sit in a
// single calendar month so tile lookups are unambiguous.
const base = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + 3, 10);
  return d;
})();

// Navigate the react-calendar to a given "Month YYYY" label.
function goToMonth(label) {
  cy.get('.react-calendar__navigation__label')
    .invoke('text')
    .then((txt) => {
      if (txt.trim() !== label) {
        cy.get('.react-calendar__navigation__next-button').click();
        goToMonth(label);
      }
    });
}

// The calendar tile button for a given Date.
function tile(date) {
  return cy
    .get(`.react-calendar__tile abbr[aria-label="${tileLabel(date)}"]`)
    .parents('button.react-calendar__tile')
    .first();
}

describe('UI · Room page', () => {
  let ctx; // { token, user, propertyId, roomId }
  let roomUrl;

  before(() => {
    cy.ensureBookableRoom().then((c) => {
      ctx = c;
      roomUrl = `/property/${c.propertyId}/room/${c.roomId}`;
    });
  });

  it('asks a logged-out visitor to log in (with a link back)', () => {
    cy.visit(roomUrl, {
      onBeforeLoad(win) {
        win.localStorage.removeItem('token');
        win.localStorage.removeItem('user');
      },
    });

    cy.get('.swal2-title', { timeout: 15000 }).should('contain.text', 'log in');
    cy.get('.swal2-confirm').click();
    cy.url().should('include', '/login');
    cy.url().should('include', 'returnUrl');
  });

  describe('when authenticated', () => {
    let created;

    beforeEach(() => {
      created = [];
      // Two back-to-back bookings so the middle day (base+1) is a check-out AND
      // a check-in -> its night is occupied -> must be fully blocked.
      cy.bookRoom(ctx.token, {
        propertyId: ctx.propertyId,
        roomId: ctx.roomId,
        checkIn: fmt(base),
        checkOut: fmt(addDays(base, 1)),
      }).then((r) => created.push(r.data.bookingId));
      cy.bookRoom(ctx.token, {
        propertyId: ctx.propertyId,
        roomId: ctx.roomId,
        checkIn: fmt(addDays(base, 1)),
        checkOut: fmt(addDays(base, 2)),
      }).then((r) => created.push(r.data.bookingId));
    });

    afterEach(() => {
      created.forEach((id) => cy.cancelBooking(ctx.token, id));
    });

    it('shows back-to-back days as fully booked and the check-out day as selectable', () => {
      cy.visitAs(roomUrl, { token: ctx.token, user: ctx.user, role: 'guest' });

      cy.get('.react-calendar', { timeout: 15000 }).should('exist');
      goToMonth(monthLabel(base));

      // base+1: both nights taken -> solid red / not selectable.
      tile(addDays(base, 1)).should('have.class', 'tile-booked-full');
      // base+2: night free, previous night taken -> check-in only (half).
      tile(addDays(base, 2)).should('have.class', 'tile-booked-end');
    });

    it('counts a single selected night as 1 (not 0)', () => {
      cy.visitAs(roomUrl, { token: ctx.token, user: ctx.user, role: 'guest' });

      cy.get('.react-calendar', { timeout: 15000 }).should('exist');
      goToMonth(monthLabel(base));

      // Two clearly-free consecutive days, away from the booked window.
      tile(addDays(base, 10)).click();
      tile(addDays(base, 11)).click();

      cy.get('.price-breakdown')
        .invoke('text')
        .should('match', /×\s*1\s*nights/); // "× 1 nights"
    });
  });
});
