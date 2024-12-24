describe('List Property Flow', () => {
  beforeEach(() => {
    // First login before testing property listing
    cy.visit('http://localhost:3000/login');

    // Intercept the login request
    cy.intercept('POST', '/api/auth/login').as('loginRequest');

    // Fill in login credentials
    cy.get('input[name="email"]').type('admin@123.com');
    cy.get('input[name="password"]').type('L3v75th5n!');
    
    // Submit login form
    cy.get('button[type="submit"]').click();

    // Wait for login request to complete
    cy.wait('@loginRequest');

    // Verify successful login (adjust based on your app's behavior)
    cy.url().should('not.include', '/login');

    // Now navigate to list property page
    cy.visit('http://localhost:3000/list-property');
  });

  it('Fills out the property listing form and submits', () => {
    // Intercept the API call that loads property types
    cy.intercept('GET', '/api/property-types').as('getPropertyTypes');

    // Fill in basic property details
    cy.get('input[name="name"]').type('Bucharest Inn 123');
    cy.get('textarea[name="description"]').type('Luxurious hotel in the heart of Bucharest with modern amenities and stunning city views');

    // Click the Next button to proceed to the next step
    cy.get('button[type="button"]').contains('Next').click();

    // Continue filling out the rest of the form...
    cy.get('input[name="street"]').type('Strada Victoriei 25');
    cy.get('input[name="city"]').type('Bucharest');
    cy.get('input[name="state"]').type('Sector 1');
    cy.get('input[name="country"]').type('Romania');
    cy.get('input[name="postal_code"]').type('010063');
    cy.get('button[type="button"]').contains('Next').click();

    // Add room details
    cy.get('button[type="button"]').contains('Add Room').click();

    cy.get('input[name="name"]').type('Deluxe Room');
    cy.get('input[name="room_size"]').type('30');
    cy.get('input[name="floor_level"]').type('2');
    cy.get('button[type="submit"]').contains('Next').click();

    cy.get('button[type="button"]').contains('Add Bed').click();
    cy.get('button[type="submit"]').contains('Next').click();
    cy.get('button[type="submit"]').contains('Next').click();

    // Fill in pricing details
    cy.get('input[name="base_price"]').type('100');
    cy.get('input[name="price_per_night"]').type('20');
    cy.get('button[type="submit"]').contains('Save').click();

    cy.get('button[type="button"]').contains('Next').click();
    cy.get('button[type="button"]').contains('Next').click();
    cy.get('button[type="button"]').contains('Create Property').click();

    // Verify success message or redirection
    cy.url().should('include', 'admin/properties');
  });
}); 