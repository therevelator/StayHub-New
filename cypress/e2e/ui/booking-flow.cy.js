// Full booking flow through the UI — the end-to-end happy path that exercises
// the night count, the calendar, and the booking reference in one go.
import { addDays, monthLabel } from '../../support/utils';

const base = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + 4, 12); // its own isolated window
  return d;
})();

describe('UI · Booking flow (end-to-end)', () => {
  let ctx;

  beforeEach(() => {
    cy.ensureBookableRoom().then((c) => {
      ctx = c;
    });
  });

  afterEach(() => {
    // Cancel whatever this run booked so re-runs stay clean.
    cy.request({
      method: 'GET',
      url: `${Cypress.env('apiUrl')}/bookings/guest`,
      headers: { Authorization: `Bearer ${ctx.token}` },
      failOnStatusCode: false,
    }).then((res) => {
      const list = res.body?.data || res.body || [];
      (Array.isArray(list) ? list : []).forEach((b) => cy.cancelBooking(ctx.token, b.id));
    });
  });

  it('books a room and confirms with a readable reference', () => {
    const roomUrl = `/property/${ctx.propertyId}/room/${ctx.roomId}`;
    cy.visitAs(roomUrl, { token: ctx.token, user: ctx.user, role: 'guest' });

    cy.get('.react-calendar', { timeout: 15000 }).should('exist');
    cy.calendarGoToMonth(monthLabel(base));

    // Select a 2-night stay.
    cy.calendarTile(base).click();
    cy.calendarTile(addDays(base, 2)).click();

    // The night count must be correct before we commit.
    cy.get('.price-breakdown').invoke('text').should('match', /×\s*2\s*nights/);

    // Accept terms and book.
    cy.get('.terms-checkbox input[type="checkbox"]').check({ force: true });
    cy.get('.book-button').should('not.be.disabled').click();

    // Confirmation dialog with a phone-friendly reference.
    cy.get('.swal2-title', { timeout: 15000 }).should('contain.text', 'Booking Confirmed');
    cy.get('.swal2-html-container')
      .invoke('text')
      .should('match', /SH-[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}/);
  });
});
