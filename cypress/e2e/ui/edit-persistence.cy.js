// Every editable form must actually persist its changes after Save.
// Each test edits a field, saves (waiting for the PUT to succeed), reloads the
// page from scratch, and asserts the new value survived the round-trip.

describe('UI · Edit forms persist after save', () => {
  let ctx;

  beforeEach(() => {
    cy.ensureBookableRoom().then((c) => {
      ctx = c;
    });
  });

  const openEdit = () =>
    cy.visitAs(`/properties/${ctx.propertyId}/edit`, {
      token: ctx.token,
      user: ctx.user,
      role: 'host',
    });

  const goTab = (name) => cy.contains('.admin-tab', name).click();

  const saveProperty = () => {
    cy.intercept('PUT', '**/api/properties/*').as('saveProp');
    cy.contains('button', 'Save Changes').click();
    cy.wait('@saveProp').its('response.statusCode').should('eq', 200);
  };

  it('Basic Info — property name persists', () => {
    const value = `Renamed Property ${Date.now()}`;
    openEdit();
    cy.get('#name', { timeout: 15000 }).clear().type(value);
    saveProperty();

    cy.reload();
    cy.get('#name', { timeout: 15000 }).should('have.value', value);
  });

  it('Basic Info — max guests persists', () => {
    openEdit();
    cy.get('#guests', { timeout: 15000 }).clear().type('7');
    saveProperty();

    cy.reload();
    cy.get('#guests', { timeout: 15000 }).should('have.value', '7');
  });

  it('Location — city persists', () => {
    const value = `Testville ${Date.now() % 100000}`;
    openEdit();
    goTab('Location');
    cy.get('#city', { timeout: 15000 }).clear().type(value);
    saveProperty();

    cy.reload();
    goTab('Location');
    cy.get('#city', { timeout: 15000 }).should('have.value', value);
  });

  it('Policies — cancellation policy persists', () => {
    openEdit();
    goTab('Policies');
    cy.get('#cancellation_policy', { timeout: 15000 }).select('strict').should('have.value', 'strict');
    saveProperty();

    cy.reload();
    goTab('Policies');
    cy.get('#cancellation_policy', { timeout: 15000 }).should('have.value', 'strict');
  });

  it('Room — name and price persist', () => {
    const value = `Renamed Room ${Date.now() % 100000}`;
    openEdit();
    goTab('Rooms');

    cy.get('[data-testid^="edit-room-"]', { timeout: 15000 }).first().click();
    cy.get('.admin-modal', { timeout: 15000 }).should('be.visible');
    cy.get('.admin-modal #name').clear().type(value);
    cy.get('.admin-modal #price_per_night').clear().type('175');

    cy.intercept('PUT', '**/rooms/*').as('saveRoom');
    cy.get('.admin-modal').contains('button', 'Update Room').click();
    cy.wait('@saveRoom').its('response.statusCode').should('eq', 200);

    cy.reload();
    goTab('Rooms');
    cy.contains('.admin-room-card__title', value).should('exist');
    cy.contains('.admin-room-card', '$175').should('exist');
  });
});
