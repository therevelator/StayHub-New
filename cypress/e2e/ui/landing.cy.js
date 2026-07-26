// Landing page — smoke test for the redesigned hero + search.

describe('UI · Landing page', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('renders the hero and search bar', () => {
    cy.contains('perfect stay', { matchCase: false }).should('be.visible');
    cy.get('.lp-hero').should('exist');
    // Search card fields.
    cy.get('.lp-search__card input[placeholder="Anywhere"]').should('exist');
    cy.get('.lp-search__card button[type="submit"]').should('contain.text', 'Search');
    // Quick filter chips.
    cy.contains('.lp-chip', 'All stays').should('be.visible');
  });

  it('shows curated destinations for the country', () => {
    cy.contains('Popular destinations').should('exist');
    // At least one destination card image is rendered.
    cy.get('img[alt]').its('length').should('be.greaterThan', 0);
  });

  it('lets a user run a search from the hero', () => {
    cy.get('.lp-search__card input[placeholder="Anywhere"]').type('Bucharest, Romania');
    cy.get('.lp-search__card button[type="submit"]').click();
    // Either results or a graceful empty-state appear — never a crash.
    cy.contains(/Available stays|No properties|available stays|Search a destination/i, {
      timeout: 15000,
    }).should('exist');
  });
});
