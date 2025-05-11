// Prevent Cypress from failing on uncaught exceptions from the application
Cypress.on('uncaught:exception', (err, runnable) => {
  return false;
});
