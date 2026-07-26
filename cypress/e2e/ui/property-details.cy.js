// Property details page renders for an authenticated visitor, with images that
// resolve (own photo or Pexels fallback) and the "Available Rooms" section.
// Self-provisions its own property (no seed data).

describe('UI · Property details', () => {
  it('renders the hero, images and the Available Rooms section', () => {
    cy.ensureBookableRoom().then((ctx) => {
      cy.visitAs(`/property/${ctx.propertyId}`, { token: ctx.token, user: ctx.user });

      cy.get('.hero-title', { timeout: 15000 })
        .should('be.visible')
        .invoke('text')
        .should('have.length.greaterThan', 0);

      // Hero image resolves to a real URL — never an empty placeholder.
      cy.get('.hero-background').should('have.attr', 'src').and('match', /^https?:\/\//);

      // Section heading is "Available Rooms" (not "Accommodations").
      cy.contains('.rooms-header h2', 'Available Rooms').should('be.visible');

      // Every room card has a resolving image.
      cy.get('.room-image').first().should('have.attr', 'src').and('match', /^https?:\/\//);
    });
  });
});
