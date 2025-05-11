// cypress/support/commands.ts
import '@testing-library/cypress/add-commands';

// Custom command to login and create a session
// Import the i18n utils
import { findByText, getTextSelector } from './i18n-utils';

// Custom command to login and create a session
Cypress.Commands.add('login', (username = 'testuser', password = 'password', language = 'en') => {
  // Create a session for the logged-in user
  cy.session([username, password, language], () => {
    // First visit the login page
    cy.visit('/auth/login');
    
    // Set the language before login
    cy.contains('button', language.toUpperCase()).click();
    
    // Enter credentials
    cy.get('input[id="username"]').type(username);
    cy.get('input[id="password"]').type(password);
    
    // Click the sign in button using our language-aware selector
    cy.getButtonByText('signIn').click();
    
    // Wait for login to complete
    cy.wait(1000); // Adjust timing as needed
    
    // Validate the login was successful - URL is language-agnostic
    cy.url().should('include', '/dashboard');
    
    // Set up any localStorage items needed for tests
    cy.window().then((win) => {
      win.localStorage.setItem('accessToken', 'fake-token-for-testing');
      win.localStorage.setItem('x-selected-farm-id', '1');
      win.localStorage.setItem('language', language);
    });
  }, {
    cacheAcrossSpecs: true,
    validate() {
      // Check if the authentication is still valid
      cy.window().then(win => {
        return !!win.localStorage.getItem('accessToken');
      });
    }
  });
  
  // Navigate to dashboard or other page after login
  cy.visit('/dashboard');
});

// Custom command to check if user is logged in
Cypress.Commands.add('isLoggedIn', () => {
  // Check if user is redirected to dashboard
  cy.url().should('include', '/dashboard');
  // Check if the dashboard content is visible
  cy.contains('Dashboard').should('be.visible');
});

// Custom command to stub API calls
Cypress.Commands.add('stubBackendApi', () => {
  cy.intercept('GET', `${Cypress.env('apiUrl')}/users/me`, {
    statusCode: 200,
    body: {
      id: '123',
      username: 'testuser',
      email: 'test@example.com',
      farms: [
        { 
          farmId: 1, 
          farmName: 'Test Farm',
          role: 'OWNER'
        }
      ]
    }
  }).as('getUserProfile');
  
  cy.intercept('GET', `${Cypress.env('apiUrl')}/users/farms`, {
    statusCode: 200,
    body: [
      { 
        id: 1, 
        name: 'Test Farm',
        ownerId: '123'
      }
    ]
  }).as('getUserFarms');
});

// Add TypeScript definition
declare global {
  namespace Cypress {
    interface Chainable {
      /**
       * Custom command to login with username and password
       * @example cy.login('testuser', 'password')
       */
      login(username?: string, password?: string, language?: 'en' | 'lt'): Chainable<Element>;

      /**
       * Custom command to check if user is logged in
       * @example cy.isLoggedIn()
       */
      isLoggedIn(): Chainable<Element>;

      /**
       * Custom command to stub backend API calls
       * @example cy.stubBackendApi()
       */
      stubBackendApi(): Chainable<Element>;
      
      /**
       * Custom command to preserve session between tests
       * @example cy.preserveSession()
       */
      preserveSession(): Chainable<Element>;
    }
  }
}