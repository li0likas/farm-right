/// <reference types="cypress" />

declare namespace Cypress {
  interface Chainable {
    /**
     * Custom command to login with username and password
     * @example cy.login('testuser', 'password')
     */
    login(username?: string, password?: string): Chainable<Element>;

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
  }

  // Extend the Cypress namespace to include the Cookies object
  interface CypressStatic {
    Cookies: {
      debug(enabled: boolean): void;
      defaults(options: CookieDefaults): void;
      preserveOnce(...names: string[]): void;
    };
  }

  interface CookieDefaults {
    preserve?: string[];
  }
}