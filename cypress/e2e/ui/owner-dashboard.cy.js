// Owner dashboard renders for a host at /properties.

describe('UI · Owner dashboard', () => {
  it('shows the "My Properties" heading for a host', () => {
    cy.registerUser().then((u) => {
      cy.visitAs('/properties', { token: u.token, user: u.user, role: 'host' });
      cy.contains('My Properties', { timeout: 15000 }).should('be.visible');
    });
  });

  it('keeps a non-host out of the owner dashboard', () => {
    cy.registerUser().then((u) => {
      // Regular user (no host flag) must be redirected away by the route guard.
      cy.visitAs('/properties', { token: u.token, user: u.user, role: 'guest' });
      cy.location('pathname').should('not.eq', '/properties');
    });
  });
});
