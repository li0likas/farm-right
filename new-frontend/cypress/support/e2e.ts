// ***********************************************************
// This is the main support file for e2e tests
// ***********************************************************

// Import commands.js
import './commands';

// Configure environment variables
Cypress.env('apiUrl', 'http://localhost:3333');

// Setup session defaults
// In Cypress 12+, we use session instead of Cookies.defaults
Cypress.Commands.add('preserveSession', () => {
  // Define a base session setup that preserves important cookies and localStorage
  cy.session('baseSession', () => {
    // Any setup you need for your authenticated session would go here
    // For example, if you needed to set cookies or localStorage manually:
    cy.window().then((win) => {
      // Example: win.localStorage.setItem('key', 'value');
      // You would customize this based on your app's auth needs
    });
  }, {
    // Session options - what to validate and preserve
    validate: () => {
      // If needed, validate that the session is still active
      return true;
    },
    // cacheAcrossSpecs ensures the session is shared across test files
    cacheAcrossSpecs: true
  });
});

// Handle uncaught exceptions
Cypress.on('uncaught:exception', (err, runnable) => {
  // returning false here prevents Cypress from failing the test
  return false;
});