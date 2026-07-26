// Owner routes — guard against the "/owner/... 404" regression.
// Owner pages live under /properties and /dashboard (not /owner/...), and the
// route guard should redirect unauthenticated visitors to login, never 404.

const notRouteMissing = () => {
  // React Router renders "404 Not Found" only when no route matches the URL.
  // (We check this specific text, not generic page errors, to stay precise.)
  cy.contains(/404\s*Not Found/i).should('not.exist');
};

describe('UI · Owner routes', () => {
  it('redirects a logged-out visitor from an owner page to login (no 404)', () => {
    cy.visit('/properties/add', {
      onBeforeLoad(win) {
        win.localStorage.removeItem('token');
        win.localStorage.removeItem('user');
      },
    });
    notRouteMissing();
    cy.url().should('include', '/login');
  });

  it('resolves the add-property route for a host (renders, not a 404)', () => {
    cy.registerUser().then((u) => {
      cy.visitAs('/properties/add', { token: u.token, user: u.user, role: 'host' });
      notRouteMissing();
      cy.url().should('include', '/properties/add');
    });
  });

  it('resolves the owner dashboard route for a host', () => {
    cy.registerUser().then((u) => {
      cy.visitAs('/properties', { token: u.token, user: u.user, role: 'host' });
      notRouteMissing();
      cy.url().should('include', '/properties');
    });
  });
});
