describe('Field Creation', () => {
  const fieldName = `Test Field ${Date.now().toString().slice(-5)}`;
  
  beforeEach(() => {
    // We'll use the credentials and farm info from previous tests
    cy.fixture('user-credentials.json').then((credentials) => {
      cy.fixture('farm-info.json').then((farmInfo) => {
        // Login first
        cy.visit('/auth/login');
        cy.get('input[id="username"]').type(credentials.username);
        cy.get('input[id="password"]').type(credentials.password);
        cy.contains('button', /Sign In|Prisijungti/).click();
        
        // Should be taken to dashboard (since we already have a farm)
        cy.url().should('include', '/dashboard');
        
        // Now navigate to create field page
        cy.visit('/create-field');
      });
    });
  });

  it('should create a new field successfully', () => {
    // Don't mock the field creation API
    cy.intercept('POST', '/fields').as('createField');
    
    // Fill out the field form
    cy.get('input[placeholder*="field name"]').type(fieldName);
    
    // Select crop type (first option)
    cy.get('.p-dropdown').first().click();
    cy.get('.p-dropdown-item').first().click();
    
    // Since drawing on the map is complicated to test, we'll simulate that the boundary has been drawn
    // by setting test values directly in the form fields
    cy.window().then(win => {
      // Simulate mock boundary data that would normally come from drawing on the map
      const mockBoundary = {
        type: "Feature",
        geometry: {
          type: "Polygon",
          coordinates: [[[23.8813, 55.1694], [23.8913, 55.1694], [23.8913, 55.1794], [23.8813, 55.1794], [23.8813, 55.1694]]]
        }
      };
      
      // Use the app's functions to set the boundary
      win.eval(`
        const event = new CustomEvent('test:setBoundary', { 
          detail: {
            boundary: ${JSON.stringify(mockBoundary)},
            area: "10.50", 
            perimeter: "1450.00"
          }
        });
        document.dispatchEvent(event);
      `);
    });
    
    // Now submit the form using regex for both English and Lithuanian
    cy.contains('button', /Create Field|Sukurti Lauką/).click();
    
    // Wait for API request to complete
    cy.wait('@createField').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      
      // Store field ID for later tests
      const fieldId = interception.response?.body.id;
      cy.writeFile('cypress/fixtures/field-info.json', {
        id: fieldId,
        name: fieldName
      });
    });
    
    // Verify success message using regex for both languages
    cy.contains(/Field created successfully|Laukas sėkmingai sukurtas/).should('be.visible');
    
    // Should be redirected to fields page
    cy.url().should('include', '/fields');
  });
});