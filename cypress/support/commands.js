// Custom commands for the StayHub E2E suite.
// These talk to the API directly (fast, stable) for setup/teardown, and set up
// authenticated browser sessions for UI specs.

import { storedUser, tileLabel } from './utils';

const api = () => Cypress.env('apiUrl');

/** Navigate the react-calendar forward until its header shows "Month YYYY". */
Cypress.Commands.add('calendarGoToMonth', (label) => {
  const step = () =>
    cy
      .get('.react-calendar__navigation__label')
      .invoke('text')
      .then((txt) => {
        if (txt.trim() !== label) {
          cy.get('.react-calendar__navigation__next-button').click();
          step();
        }
      });
  step();
});

/** Yield the react-calendar tile button for a given Date. */
Cypress.Commands.add('calendarTile', (date) =>
  cy
    .get(`.react-calendar__tile abbr[aria-label="${tileLabel(date)}"]`)
    .parents('button.react-calendar__tile')
    .first()
);

/** Log in an existing user; yields the API `data` ({ token, user }). */
Cypress.Commands.add('apiLogin', (email, password) =>
  cy
    .request('POST', `${api()}/auth/login`, { email, password })
    .then((res) => {
      expect(res.status, 'login status').to.eq(200);
      expect(res.body?.data?.token, 'login token').to.be.a('string');
      return res.body.data;
    })
);

/**
 * Register a fresh, unique user and yield `{ email, password, token, user }`.
 * Falls back to logging in if the email somehow already exists.
 */
Cypress.Commands.add('registerUser', (overrides = {}) => {
  const uniq = `${Date.now()}${Cypress._.random(0, 1e6)}`;
  const email = overrides.email || `cy_${uniq}@stayhub.test`;
  const password = overrides.password || 'Test1234!';
  return cy
    .request({
      method: 'POST',
      url: `${api()}/auth/register`,
      body: { email, password, firstName: 'Cypress', lastName: 'Tester' },
      failOnStatusCode: false,
    })
    .then((res) => {
      if (res.status === 201 && res.body?.data?.token) {
        return { email, password, token: res.body.data.token, user: res.body.data.user };
      }
      return cy.apiLogin(email, password).then((data) => ({
        email,
        password,
        token: data.token,
        user: data.user,
      }));
    });
});

/** Create a booking; yields `{ status, body, data }` (data has bookingReference, numberOfNights, ...). */
Cypress.Commands.add('bookRoom', (token, { propertyId, roomId, checkIn, checkOut, guests = 1 }) =>
  cy
    .request({
      method: 'POST',
      url: `${api()}/properties/${propertyId}/rooms/${roomId}/book`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        checkInDate: checkIn,
        checkOutDate: checkOut,
        numberOfGuests: guests,
        termsAccepted: true,
      },
      failOnStatusCode: false,
    })
    .then((res) => ({ status: res.status, body: res.body, data: res.body?.data }))
);

/** Fetch the availability map for a room; yields `{ 'yyyy-MM-dd': {status,...} }`. */
Cypress.Commands.add('roomAvailability', (token, { propertyId, roomId, start, end }) =>
  cy
    .request({
      method: 'GET',
      url: `${api()}/properties/${propertyId}/rooms/${roomId}/availability`,
      headers: { Authorization: `Bearer ${token}` },
      qs: { startDate: start, endDate: end },
    })
    .then((res) => {
      expect(res.status, 'availability status').to.eq(200);
      return res.body.data.requested_room.availability;
    })
);

/** Create a property owned by the token's user; yields the new property id. */
Cypress.Commands.add('createProperty', (token, overrides = {}) =>
  cy
    .request({
      method: 'POST',
      url: `${api()}/properties`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        name: 'CY Test Property',
        description: 'Created by the E2E suite',
        street: 'Strada Test 1',
        city: 'Bucharest',
        state: 'Bucharest',
        country: 'Romania',
        postal_code: '010101',
        latitude: 44.4323,
        longitude: 26.1063,
        property_type: 'hotel',
        guests: 4,
        bedrooms: 1,
        beds: 1,
        bathrooms: 1,
        check_in_time: '15:00',
        check_out_time: '11:00',
        cancellation_policy: 'flexible',
        pet_policy: 'not_allowed',
        event_policy: 'not_allowed',
        min_stay: 1,
        max_stay: 30,
        star_rating: 3,
        ...overrides,
      },
    })
    .then((res) => {
      expect(res.status, 'create property').to.be.oneOf([200, 201]);
      return res.body.data.id;
    })
);

/** Create a room on a property; yields the new room id. */
Cypress.Commands.add('createRoom', (token, propertyId, overrides = {}) =>
  cy
    .request({
      method: 'POST',
      url: `${api()}/properties/${propertyId}/rooms`,
      headers: { Authorization: `Bearer ${token}` },
      body: {
        name: 'CY Room',
        room_type: 'Standard Room',
        max_occupancy: 4,
        price_per_night: 100,
        ...overrides,
      },
    })
    .then((res) => {
      expect(res.status, 'create room').to.eq(200);
      return res.body.data.roomId;
    })
);

/** Set availability records (e.g. mark dates as maintenance/blocked). */
Cypress.Commands.add('setRoomAvailability', (token, { propertyId, roomId, updates }) =>
  cy
    .request({
      method: 'POST',
      url: `${api()}/properties/${propertyId}/rooms/${roomId}/availability`,
      headers: { Authorization: `Bearer ${token}` },
      body: { updates },
    })
    .then((res) => {
      expect(res.status, 'set availability').to.eq(200);
      return res.body;
    })
);

/** Update a property (PUT). */
Cypress.Commands.add('updateProperty', (token, propertyId, patch) =>
  cy.request({
    method: 'PUT',
    url: `${api()}/properties/${propertyId}`,
    headers: { Authorization: `Bearer ${token}` },
    body: patch,
    failOnStatusCode: false,
  })
);

/**
 * Register a user and provision a property + bookable room they own.
 * Yields `{ token, user, propertyId, roomId }`. This makes specs independent of
 * any seed data, so the suite runs against an empty database (i.e. in CI).
 */
Cypress.Commands.add('ensureBookableRoom', () =>
  cy.registerUser().then((u) =>
    cy.createProperty(u.token).then((propertyId) =>
      cy.createRoom(u.token, propertyId).then((roomId) => ({
        token: u.token,
        user: u.user,
        propertyId,
        roomId,
      }))
    )
  )
);

/** Cancel a booking (used for teardown). Never fails the test on its own. */
Cypress.Commands.add('cancelBooking', (token, bookingId) => {
  if (!bookingId) return;
  cy.request({
    method: 'POST',
    url: `${api()}/bookings/${bookingId}/cancel`,
    headers: { Authorization: `Bearer ${token}` },
    failOnStatusCode: false,
  });
});

/**
 * Visit a page as an authenticated user by pre-seeding localStorage before the
 * app boots. `role` sets the derived host/admin/guest flags the route guards read.
 */
Cypress.Commands.add('visitAs', (url, { token, user, role } = {}) => {
  cy.visit(url, {
    onBeforeLoad(win) {
      win.localStorage.setItem('token', token);
      win.localStorage.setItem('user', JSON.stringify(storedUser(user, role)));
    },
  });
});
