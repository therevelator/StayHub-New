// Header states and protected-route guards.

describe('UI · Navigation & route guards', () => {
  it('shows "Sign In" in the header when logged out', () => {
    cy.visit('/', { onBeforeLoad: (win) => win.localStorage.clear() });
    cy.contains('Sign In').should('be.visible');
  });

  it('shows "Sign Out" in the header when logged in', () => {
    cy.registerUser().then((u) => {
      cy.visitAs('/', { token: u.token, user: u.user });
      cy.contains('Sign Out').should('be.visible');
    });
  });

  it('redirects a logged-out user from /trips to login', () => {
    cy.visit('/trips', { onBeforeLoad: (win) => win.localStorage.clear() });
    cy.location('pathname').should('eq', '/login');
  });

  it('redirects a logged-out user from /myreservations to login', () => {
    cy.visit('/myreservations', { onBeforeLoad: (win) => win.localStorage.clear() });
    cy.location('pathname').should('eq', '/login');
  });
});
