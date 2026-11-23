// Login flow through the actual UI form.

describe('UI · Login flow', () => {
  it('logs in via the form and shows the authenticated header', () => {
    cy.registerUser().then(({ email, password }) => {
      cy.visit('/login');
      cy.get('#email').type(email);
      cy.get('#password').type(password);
      cy.contains('button', 'Sign in').click();

      cy.contains('Sign Out', { timeout: 15000 }).should('be.visible');
      cy.location('pathname').should('eq', '/');
    });
  });

  it('shows an error for invalid credentials and stays on /login', () => {
    cy.visit('/login');
    cy.get('#email').type('nobody@stayhub.test');
    cy.get('#password').type('wrong-password');
    cy.contains('button', 'Sign in').click();

    cy.get('.text-red-800', { timeout: 15000 }).should('be.visible');
    cy.location('pathname').should('eq', '/login');
  });

  it('returns the user to ?returnUrl= after logging in', () => {
    cy.registerUser().then(({ email, password }) => {
      cy.visit('/login?returnUrl=%2Ftrips');
      cy.get('#email').type(email);
      cy.get('#password').type(password);
      cy.contains('button', 'Sign in').click();

      cy.location('pathname').should('eq', '/trips');
    });
  });
});
