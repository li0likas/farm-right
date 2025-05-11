describe('User Registration', () => {
  const username = `testuser${Date.now().toString().slice(-5)}`;
  const email = `${username}@example.com`;
  const password = 'Test123!';

  beforeEach(() => {
    // Visit the registration page
    cy.visit('/auth/signup');
  });

  it('should register a new user successfully', () => {
    // Don't mock the registration API call - use the real endpoint
    cy.intercept('POST', '/auth/signup').as('registerUser');

    // Fill in the registration form
    cy.get('input[id="name"]').type(username);
    cy.get('input[id="email"]').type(email);
    cy.get('input[id="password"]').type(password);
    cy.get('input[id="rePassword"]').type(password);
    
    // Accept terms (checkbox)
    cy.get('input[id="agree"]').check({ force: true });
    
    // Click the registration button using regex for both English and Lithuanian
    cy.contains('button', /Sign Up|Registruotis/).click();
    
    // Wait for the API call to complete
    cy.wait('@registerUser').then((interception) => {
      expect(interception.response?.statusCode).to.eq(201);
    });
    
    // Verify success message is shown (also using regex for both languages)
    cy.contains(/Successful registration|Registracija sėkminga/).should('be.visible');
    
    // Store credentials for later use in login test
    cy.writeFile('cypress/fixtures/user-credentials.json', {
      username,
      email,
      password
    });
  });
});