// Property lifecycle — a fuller owner flow: create a property, add a room,
// update the property, and verify each step reads back correctly.

const api = () => Cypress.env('apiUrl');

describe('API · Property lifecycle', () => {
  let token;

  beforeEach(() => {
    cy.registerUser().then((u) => {
      token = u.token;
    });
  });

  it('creates a property, adds a room, and updates the property', () => {
    cy.createProperty(token, { name: 'Lifecycle Inn' }).then((propertyId) => {
      // Reads back with the given name.
      cy.request(`${api()}/properties/${propertyId}`).then((res) => {
        expect(res.status).to.eq(200);
        expect(res.body.data).to.have.property('name', 'Lifecycle Inn');
      });

      // Add a room to it.
      cy.createRoom(token, propertyId, { name: 'Suite 1', price_per_night: 150 }).then((roomId) => {
        expect(roomId).to.be.a('number');

        cy.request({
          url: `${api()}/properties/${propertyId}/rooms/${roomId}`,
          headers: { Authorization: `Bearer ${token}` },
        }).then((res) => {
          expect(res.status).to.eq(200);
          expect(res.body.data).to.have.property('name', 'Suite 1');
        });
      });

      // Update the property name and verify it persisted.
      cy.updateProperty(token, propertyId, { name: 'Lifecycle Inn Renamed' }).then((res) => {
        expect(res.status).to.be.oneOf([200, 201]);
      });
      cy.request(`${api()}/properties/${propertyId}`).then((res) => {
        expect(res.body.data).to.have.property('name', 'Lifecycle Inn Renamed');
      });
    });
  });
});
