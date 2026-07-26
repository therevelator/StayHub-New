// The "Verify" button on the Location tab must geocode the address and fill in
// the coordinates. Nominatim is stubbed so the test is deterministic/offline.

describe('UI · Verify address (geocoding)', () => {
  let ctx;

  beforeEach(() => {
    cy.ensureBookableRoom().then((c) => {
      ctx = c;
    });
  });

  it('geocodes the entered address and fills the coordinates', () => {
    cy.intercept('GET', 'https://nominatim.openstreetmap.org/search*', {
      statusCode: 200,
      body: [
        {
          lat: '44.4280060',
          lon: '26.1025098',
          display_name: 'Piața Unirii, București, România',
          address: {
            road: 'Piața Unirii',
            city: 'București',
            state: 'București',
            country: 'România',
            postcode: '030167',
          },
        },
      ],
    }).as('geocode');

    cy.visitAs(`/properties/${ctx.propertyId}/edit`, {
      token: ctx.token,
      user: ctx.user,
      role: 'host',
    });

    cy.contains('.admin-tab', 'Location').click();
    cy.get('#street', { timeout: 15000 }).clear().type('Piata Unirii, Bucuresti');
    cy.contains('button', 'Verify').click();

    cy.wait('@geocode');

    // Coordinates + components come back from the (stubbed) geocoder.
    cy.get('#latitude').should('have.value', '44.428006');
    cy.get('#longitude').should('have.value', '26.1025098');
    cy.get('#city').should('have.value', 'București');
  });
});
