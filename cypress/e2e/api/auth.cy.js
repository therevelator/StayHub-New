// Auth API — the foundation the rest of the suite depends on.

const api = () => Cypress.env('apiUrl');

describe('API · Authentication', () => {
  it('registers a new user and returns a token', () => {
    cy.registerUser().then(({ token, user, email }) => {
      expect(token, 'jwt token').to.be.a('string').and.have.length.greaterThan(20);
      expect(user).to.have.property('email', email);
    });
  });

  it('logs in with valid credentials', () => {
    cy.registerUser().then(({ email, password }) => {
      cy.apiLogin(email, password).then((data) => {
        expect(data.token).to.be.a('string');
        expect(data.user).to.have.property('email', email);
      });
    });
  });

  it('rejects invalid credentials with 401', () => {
    cy.request({
      method: 'POST',
      url: `${api()}/auth/login`,
      body: { email: 'nobody@stayhub.test', password: 'wrong-password' },
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });

  it('protects authenticated endpoints when no token is sent', () => {
    cy.request({
      method: 'GET',
      url: `${api()}/bookings/guest`,
      failOnStatusCode: false,
    }).then((res) => {
      expect(res.status).to.eq(401);
    });
  });
});
