// Maintenance dates must render amber (not bookable) on the booking calendar.
import { fmt, monthLabel } from '../../support/utils';

// 15th of the month, two months out — mid-month and reachable by paging.
const maintDate = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + 2, 15);
  return d;
})();

describe('UI · Room maintenance dates', () => {
  let ctx;

  beforeEach(() => {
    cy.ensureBookableRoom().then((c) => {
      ctx = c;
      cy.setRoomAvailability(ctx.token, {
        propertyId: ctx.propertyId,
        roomId: ctx.roomId,
        updates: [{ date: fmt(maintDate), status: 'maintenance', price: 100 }],
      });
    });
  });

  it('shows a maintenance date in amber and refuses to book it', () => {
    cy.visitAs(`/property/${ctx.propertyId}/room/${ctx.roomId}`, {
      token: ctx.token,
      user: ctx.user,
      role: 'guest',
    });

    cy.get('.react-calendar', { timeout: 15000 }).should('exist');
    cy.calendarGoToMonth(monthLabel(maintDate));

    // Amber maintenance styling, not a booking colour.
    cy.calendarTile(maintDate).should('have.class', 'tile-maintenance');

    // Clicking it is refused with a maintenance message; nothing gets selected.
    cy.calendarTile(maintDate).click();
    cy.get('.swal2-title', { timeout: 10000 }).should('contain.text', 'Maintenance');
    cy.get('.swal2-confirm').click();
    cy.contains('.date-box', 'Check-in').should('contain.text', 'Select date');
  });
});
