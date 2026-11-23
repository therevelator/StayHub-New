// Booking Console flow (design concept 1a), a preview that lives under /console:
// search (/console) -> results (/console/search) -> rooms compare (/stay/:id) -> checkout (/book/:roomId) -> confirmed (/trips/:ref)
import { addDays, fmt } from '../../support/utils';

const base = (() => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setMonth(d.getMonth() + 5, 9); // its own isolated window
  return d;
})();
const checkIn = fmt(base);
const checkOut = fmt(addDays(base, 3)); // 3 nights at 100/night = 300
const trip = `guests=2&checkIn=${checkIn}&checkOut=${checkOut}`;

describe('UI · Booking Console', () => {
  it('search screen states the trip and lands on results', () => {
    // Geocoding is an external service; answer it locally.
    cy.intercept('GET', /nominatim\.openstreetmap\.org\/search/, {
      body: [{ lat: '44.4268', lon: '26.1025', display_name: 'Bucharest, Romania', address: { city: 'Bucharest', country: 'Romania' } }],
    });
    cy.visit('/console', { onBeforeLoad: (win) => win.localStorage.clear() });
    cy.contains('h1', 'Tell us the shape of the trip').should('be.visible');
    cy.contains('button', 'Sign in').should('be.visible');

    cy.contains('button', 'Cut the list').click();
    cy.location('pathname').should('eq', '/console/search');
    cy.location('search').should('include', 'lat=44.4268').and('include', 'guests=2');
    cy.contains('left after your filters', { timeout: 15000 }).should('be.visible');
  });

  describe('with a bookable stay', () => {
    let ctx;

    beforeEach(() => {
      const name = `CY Console ${Date.now()}`;
      cy.registerUser().then((u) =>
        cy.createProperty(u.token, { name }).then((propertyId) =>
          cy.createRoom(u.token, propertyId).then((roomId) => {
            ctx = { token: u.token, user: u.user, propertyId, roomId, name };
          })
        )
      );
    });

    afterEach(() => {
      cy.request({
        method: 'GET',
        url: `${Cypress.env('apiUrl')}/bookings/guest`,
        headers: { Authorization: `Bearer ${ctx.token}` },
        failOnStatusCode: false,
      }).then((res) => {
        const list = res.body?.data || [];
        (Array.isArray(list) ? list : []).forEach((b) => cy.cancelBooking(ctx.token, b.id));
      });
    });

    it('lists the stay with a total for the dates and filters live', () => {
      cy.visit(`/console/search?location=Bucharest%2C+Romania&lat=44.4323&lon=26.1063&radius=5&${trip}`);
      cy.contains('article', ctx.name, { timeout: 15000 }).should('contain.text', '€300');

      // The test property has a flexible policy, so it survives this deal-breaker.
      cy.contains('label', 'Free cancellation').click();
      cy.location('search').should('include', 'f=free-cancel');
      cy.contains('article', ctx.name).should('exist');

      cy.contains('article', ctx.name).click();
      cy.location('pathname').should('eq', `/stay/${ctx.propertyId}`);
      cy.location('search').should('include', `checkIn=${checkIn}`);
    });

    it('asks a signed-out visitor to sign in before booking', () => {
      cy.visit(`/stay/${ctx.propertyId}?${trip}`, { onBeforeLoad: (win) => win.localStorage.clear() });
      cy.contains('button', 'Sign in to book', { timeout: 15000 }).click();
      cy.location('pathname').should('eq', '/login');
      cy.location('search').should('include', 'returnUrl=');
    });

    it('books a room through compare, checkout and confirmation', () => {
      const stayUrl = `/stay/${ctx.propertyId}?${trip}`;
      cy.visitAs(stayUrl, { token: ctx.token, user: ctx.user, role: 'guest' });

      cy.contains('h1', 'One room is free for your dates', { timeout: 15000 }).should('be.visible');
      cy.contains('button', 'Selected').should('exist');
      cy.contains('button', 'Show every line').click();
      cy.contains('3 nights × €100').should('be.visible');

      cy.contains('button', 'Book in 3 fields').click();
      cy.location('pathname').should('eq', `/book/${ctx.roomId}`);
      cy.contains('h1', 'Three fields').should('be.visible');
      cy.get('form input').first().clear().type('Cy Tester');
      cy.contains('button', 'Confirm — €300').click();

      cy.location('pathname', { timeout: 15000 }).should('match', /^\/trips\/SH-[A-HJ-NP-Z2-9]{3}-[A-HJ-NP-Z2-9]{3}$/);
      cy.contains('Confirmed ·').should('be.visible');
      cy.contains('h1', ctx.name).should('be.visible');

      // The room is now taken for those nights.
      cy.visitAs(stayUrl, { token: ctx.token, user: ctx.user, role: 'guest' });
      cy.contains('button', 'Booked for these dates', { timeout: 15000 }).should('be.disabled');
    });
  });
});
