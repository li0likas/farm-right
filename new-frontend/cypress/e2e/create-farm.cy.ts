describe('Farm Creation', () => {
  const farmName = `Test Farm ${Date.now().toString().slice(-5)}`;

  beforeEach(() => {
    // We'll use the credentials from the previous tests
    cy.fixture('user-credentials.json').then((credentials) => {
      // Login before creating farm
      cy.visit('/auth/login');
      cy.get('input[id="username"]').type(credentials.username);
      cy.get('input[id="password"]').type(credentials.password);
      cy.contains('button', /Sign In|Prisijungti/).click();
      
      // Wait to be redirected to create farm page
      cy.url().should('include', '/create-farm');
    });
  });

  it('should create a new farm successfully', () => {
    // Don't mock the farm creation API
    cy.intercept('POST', '/farms').as('createFarm');

    // Fill out the farm form
    cy.get('input[id="farmName"]').type(farmName);
    
    // Submit the form using regex for both English and Lithuanian
    cy.contains('button', /Create Farm|Sukurti Ūkį/).click();
    
    // Wait for API request to complete
    cy.wait('@createFarm').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
      
      // Store farm ID for later tests
      const farmId = interception.response?.body.id;
      cy.writeFile('cypress/fixtures/farm-info.json', {
        id: farmId,
        name: farmName
      });
    });
    
    // Verify success message using regex for both languages
    cy.contains(/Farm created successfully|Ūkis sėkmingai sukurtas/).should('be.visible');
    
    // Should be redirected to dashboard
    cy.url().should('include', '/dashboard');
  });
});