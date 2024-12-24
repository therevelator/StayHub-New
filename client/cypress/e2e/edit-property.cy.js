/// <reference types="cypress" />

describe('Edit Property Flow', () => {
  beforeEach(() => {
    // Login first
    cy.visit('/login');
    cy.intercept('POST', '/api/auth/login').as('loginRequest');
    cy.get('input[name="email"]').type('admin@123.com');
    cy.get('input[name="password"]').type('L3v75th5n!');
    cy.get('button[type="submit"]').click();
    cy.wait('@loginRequest');
    
    // Navigate to admin properties
    cy.visit('/admin/properties');
    
    // Click the first edit button
    cy.contains('button', 'Edit').first().click();
  });

  it('should edit all property details and save successfully', () => {
    // Intercept the property fetch request
    cy.intercept('GET', '/api/properties/*').as('getProperty');
    cy.wait('@getProperty');

    // Basic Info
    cy.get('input[name="name"]').should('be.visible').clear().type('Updated Test Property');
    cy.get('textarea[name="description"]').clear().type('Updated description for testing');
    cy.get('select').contains('option', 'Hotel').parent().select('hotel');
    cy.contains('button', 'Next').click();

    // Location
    cy.get('input[name="street"]').clear().type('Updated Street 123');
    cy.get('input[name="city"]').clear().type('Updated City');
    cy.get('input[name="state"]').clear().type('Updated State');
    cy.get('input[name="country"]').clear().type('Updated Country');
    cy.get('input[name="postal_code"]').clear().type('12345');
    cy.contains('button', 'Next').click();

    // Rooms
    cy.contains('button', 'Add Room').click();
    cy.get('input[name="name"]').clear().type('Updated Room');
    cy.get('input[name="room_size"]').clear().type('40');
    cy.get('input[name="floor_level"]').clear().type('3');
    cy.contains('button', 'Next').click();

    // Beds
    cy.contains('button', 'Add Bed').click();
    cy.get('select').first().select('Double Bed');
    cy.get('input[type="number"]').first().clear().type('2');
    cy.contains('button', 'Next').click();

    // Photos
    cy.contains('button', 'Add Photo URL').click();
    cy.get('input[type="url"]').first().clear().type('https://example.com/updated-image.jpg');
    cy.get('input').last().clear().type('Updated room view');
    cy.contains('button', 'Next').click();

    // Rules
    cy.get('input').first().clear().type('Updated pet policy');
    cy.get('input').last().clear().type('Updated event policy');
    cy.contains('button', 'Next').click();

    // Submit and verify
    cy.intercept('PUT', '/api/properties/*').as('updateProperty');
    cy.contains('button', 'Save Changes').click();
    cy.wait('@updateProperty').its('response.statusCode').should('eq', 200);

    // Verify redirect and success message
    cy.url().should('include', '/admin/properties');
    cy.contains('Property updated successfully').should('be.visible');
  });

  it('should validate required fields', () => {
    cy.intercept('GET', '/api/properties/*').as('getProperty');
    cy.wait('@getProperty');

    // Clear required fields
    cy.get('input[name="name"]').clear();
    cy.get('textarea[name="description"]').clear();
    
    // Try to proceed
    cy.contains('button', 'Next').click();
    
    // Verify validation messages
    cy.contains('Name is required').should('be.visible');
    cy.contains('Description is required').should('be.visible');
  });
}); 