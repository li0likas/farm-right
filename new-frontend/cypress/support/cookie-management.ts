// Helper functions for cookie management in Cypress 12+

/**
 * Sets up important cookies that should be preserved between tests
 */
export const setupImportantCookies = () => {
  // Set important cookies that should persist
  cy.setCookie('accessToken', 'fake-token-for-testing');
  cy.setCookie('language', 'en');
  cy.setCookie('x-selected-farm-id', '1');
};

/**
 * A beforeEach hook that ensures important cookies are preserved
 * Usage: in your test files' beforeEach: preserveImportantCookies()
 */
export const preserveImportantCookies = () => {
  // Get the cookies we care about
  cy.getCookie('accessToken').then(cookie => {
    if (!cookie) {
      // If the cookie doesn't exist, set it
      cy.setCookie('accessToken', 'fake-token-for-testing');
    }
  });
  
  cy.getCookie('language').then(cookie => {
    if (!cookie) {
      // If the cookie doesn't exist, set it
      cy.setCookie('language', 'en');
    }
  });
  
  cy.getCookie('x-selected-farm-id').then(cookie => {
    if (!cookie) {
      // If the cookie doesn't exist, set it
      cy.setCookie('x-selected-farm-id', '1');
    }
  });
};