/// <reference types="cypress" />
import { findByText, getTextSelector } from '../support/i18n-utils';

describe('Login Page', () => {
  beforeEach(() => {
    cy.visit('/auth/login');
  });

  it('should display login form', () => {
    // Use language-agnostic selectors
    findByText('welcomeBack').should('be.visible');
    cy.get('input[id="username"]').should('be.visible');
    cy.get('input[id="password"]').should('be.visible');
    cy.getButtonByText('signIn').should('be.visible');
  });

  it('should show validation errors for empty fields', () => {
    // Click sign in button using language-agnostic approach
    cy.getButtonByText('signIn').click();
    
    // Check for validation message
    findByText('emptyFields').should('exist');
  });

  it('should show error for incorrect credentials', () => {
    cy.intercept('POST', '**/auth/signin', {
      statusCode: 401,
      body: {
        message: 'Incorrect credentials'
      }
    }).as('loginAttempt');

    // Enter credentials
    cy.get('input[id="username"]').type('wronguser');
    cy.get('input[id="password"]').type('wrongpassword');
    
    // Click sign in button
    cy.getButtonByText('signIn').click();
    
    cy.wait('@loginAttempt');
    
    // Check for error message
    findByText('incorrectCredentials').should('exist');
  });

  it('should login successfully and redirect to dashboard', () => {
    // Stub backend APIs
    cy.intercept('POST', '**/auth/signin', {
      statusCode: 200,
      body: {
        access_token: 'fake-token',
        farms: [{ farmId: 1, farmName: 'Test Farm' }]
      }
    }).as('loginRequest');
    
    cy.stubBackendApi();

    // Login
    cy.get('input[id="username"]').type('testuser');
    cy.get('input[id="password"]').type('test123');
    cy.getButtonByText('signIn').click();
    
    cy.wait('@loginRequest');
    
    // Should be redirected to dashboard
    cy.url().should('include', '/dashboard');
    
    // Verify dashboard loaded with language-aware text
    findByText('dashboard').should('exist');
  });

  it('should support language switching', () => {
    // Initialize with English
    cy.contains('button', 'EN').click();
    findByText('welcomeBack').should('be.visible');
    cy.getButtonByText('signIn').should('be.visible');
    
    // Test with Lithuanian
    cy.contains('button', 'LT').click();
    
    // The findByText utility will look for the Lithuanian text automatically
    findByText('welcomeBack').should('be.visible');
    cy.getButtonByText('signIn').should('be.visible');
    
    // Switch back to English
    cy.contains('button', 'EN').click();
    findByText('welcomeBack').should('be.visible');
  });
});