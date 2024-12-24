describe('Property Listing Test', () => {
  it('Fills out the property listing form and submits', () => {
    cy.visit('http://localhost:3000/list-property');

    // Fill property details
    cy.get('.space-y-6 > div:nth-child(1) > .mt-1').click().type('Stoenesti Residence');
    cy.get('.space-y-6 > div:nth-child(2) > .mt-1').type('this is a test');
    cy.get('.grid:nth-child(3) .w-full').type('{downarrow}villa');
    cy.get('.text-white:nth-child(2)').click();

    // Address details
    cy.get('.grid-cols-1 > div > .mt-1').click().type('Strada Principala 47');
    cy.get('.grid:nth-child(2) > div:nth-child(1) > .mt-1').type('Stoenesti');
    cy.get('.grid:nth-child(2) > div:nth-child(2) > .mt-1').type('Arges');
    cy.get('.grid:nth-child(3) > div:nth-child(1) > .mt-1').type('Romania');
    cy.get('.grid:nth-child(3) > div:nth-child(2) > .mt-1').type('117675');
    cy.get('.border-transparent').click();

    // Room details
    cy.get('.mt-8 > .text-white').click();
    cy.get('.border-transparent').click();
    cy.get('#name').click().type('mansarda');
    cy.get('#room_type').click().type('Deluxe Room');
    cy.get('#room_size').click().type('123');
    cy.get('#floor_level').click().type('2');
    cy.get('#description').click().type('test mansarda');
    cy.get('.mt-6 > .text-white').click();
    cy.get('.space-y-8').submit();

    // Bed details
    cy.get('.sm\\3Aw-auto').click();
    cy.get('.flex:nth-child(2) > .flex-1 > .w-full').click().type('Double Bed');
    cy.get('.mt-6 > .text-white').click();
    cy.get('.space-y-8').submit();

    // Additional details
    cy.get('#bathroom_type').click().type('shared');
    cy.get('#view_type').click().type('Mountain View');
    cy.get('#flooring_type').click().type('Hardwood');
    cy.get('.flex:nth-child(3) > .rounded').click();
    cy.get('.flex:nth-child(4) > .rounded').click();
    cy.get('.flex:nth-child(8) > .rounded').click();
    cy.get('#accessibility_features').click().type('accessibility');
    cy.get('#energy_saving_features').type('energysaving');
    cy.get('#amenity_input').type('additional');
    cy.get('.inline-flex > .h-4').click();
    cy.get('.mt-6 > .text-white').click();
    cy.get('.space-y-8').submit();

    // Pricing details
    cy.get('#base_price').click().type('123');
    cy.get('#price_per_night').click().type('{backspace}123');
    cy.get('#cleaning_fee').click().type('12');
    cy.get('#service_fee').click().type('12');
    cy.get('#tax_rate').click().type('19');
    cy.get('#security_deposit').click().type('12');
    cy.get('#cancellation_policy').click().type('moderate');

    // Rules
    cy.get('.hover\\3A bg-primary-700').click();
    cy.get('div:nth-child(3) > .mt-1').click().type('no pets');
    cy.get('div:nth-child(4) > .mt-1').type('no events');
    cy.get('.hover\\3A bg-primary-700').click();
    cy.get('.grid > .inline-flex:nth-child(1) > .rounded').click();
    cy.get('.inline-flex:nth-child(7) > .rounded').click();
    cy.get('.inline-flex:nth-child(6) > .rounded').click();
    cy.get('.hover\\3A bg-primary-700').click();
  });
}); 