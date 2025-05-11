// cypress/e2e/02-login.cy.ts
describe('User Login', () => {
  let userCredentials: { username: string; password: string; };

  before(() => {
    // Load credentials from previous test
    cy.fixture('user-credentials.json').then((credentials) => {
      userCredentials = credentials;
    });
  });

  beforeEach(() => {
    // Visit the login page
    cy.visit('/auth/login');
  });

  it('should login with registered user successfully', () => {
    // Don't mock the login API - use the real endpoint
    cy.intercept('POST', '/auth/signin').as('loginRequest');

    // Fill out login form with previously registered user
    cy.get('input[id="username"]').type(userCredentials.username);
    cy.get('input[id="password"]').type(userCredentials.password);
    
    // Submit login form using regex for both English and Lithuanian
    cy.contains('button', /Sign In|Prisijungti/).click();
    
    // Wait for login request to complete
    cy.wait('@loginRequest').then((interception) => {
      // Verify the response has a status code of 200
      expect(interception.response?.statusCode).to.eq(201);
      
      // Verify the token was received
      expect(interception.response?.body).to.have.property('access_token');
    });
    
    // For a first-time user, should be redirected to create farm page
    // Note: If the user already has a farm, this will need to change to dashboard
    cy.url().should('include', '/create-farm');
  });
});