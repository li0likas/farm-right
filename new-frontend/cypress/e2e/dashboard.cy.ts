/// <reference types="cypress" />
import { findByText } from '../support/i18n-utils';

describe('Dashboard', () => {
  beforeEach(() => {
    // Stub APIs and login
    cy.stubBackendApi();
    
    // Mock localStorage and sessionStorage
    cy.window().then((win) => {
      win.localStorage.setItem('accessToken', 'fake-token');
      win.localStorage.setItem('x-selected-farm-id', '1');
      win.localStorage.setItem('user', JSON.stringify({
        id: '123',
        username: 'testuser',
        email: 'test@example.com',
        farms: [{ farmId: 1, farmName: 'Test Farm', role: 'OWNER' }]
      }));
      
      // Default to English
      win.localStorage.setItem('language', 'en');
    });
    
    // Additional API mocks for dashboard
    cy.intercept('GET', '**/tasks', {
      statusCode: 200,
      body: [
        {
          id: '1',
          title: 'Harvest crops',
          status: { name: 'Pending' },
          field: { name: 'Field 1' },
          type: { name: 'Harvesting' },
          dueDate: '2025-05-20'
        },
        {
          id: '2',
          title: 'Spray pesticides',
          status: { name: 'Completed' },
          field: { name: 'Field 2' },
          type: { name: 'Spraying' },
          completionDate: '2025-05-10'
        }
      ]
    }).as('getTasks');
    
    cy.intercept('GET', '**/fields/total-area', {
      statusCode: 200,
      body: { totalArea: 250.5 }
    }).as('getFieldsArea');
    
    cy.intercept('GET', '**/tasks/stats', {
      statusCode: 200,
      body: { completedTasks: 10, totalTasks: 20 }
    }).as('getTaskStats');

    cy.intercept('GET', '**/ai/farm-summary', {
      statusCode: 200,
      body: { insights: 'AI generated summary of your farm.' }
    }).as('getAiSummary');

    cy.visit('/dashboard');
  });

  it('should display dashboard with key metrics in English', () => {
    // Check main dashboard elements using i18n-aware selectors
    findByText('aiSummary').should('be.visible');
    findByText('taskCompletion').should('be.visible');
    findByText('totalFieldArea').should('be.visible');
    findByText('tasksTimeline').should('be.visible');
    
    // Check task completion percentage
    cy.contains('50%').should('be.visible');
    
    // Check field area
    cy.contains('250.50 ha').should('be.visible');
    
    // Check AI summary
    cy.contains('AI generated summary of your farm.').should('be.visible');
  });

  it('should display tasks in the timeline', () => {
    cy.get('.datatable-responsive').within(() => {
      cy.contains('Harvesting').should('be.visible');
      cy.contains('Spraying').should('be.visible');
      cy.contains('Field 1').should('be.visible');
      cy.contains('Field 2').should('be.visible');
      findByText('pending').should('be.visible');
      findByText('completed').should('be.visible');
    });
  });

  it('should handle language switching', () => {
    // Check English first
    findByText('aiSummary').should('be.visible');
    findByText('taskCompletion').should('be.visible');
    
    // Toggle to Lithuanian
    cy.contains('button', 'LT').click();
    
    // Check Lithuanian text with the same selectors
    findByText('aiSummary').should('be.visible');
    findByText('taskCompletion').should('be.visible');
    
    // Toggle back to English
    cy.contains('button', 'EN').click();
    
    // Check English text again
    findByText('aiSummary').should('be.visible');
  });

  it('should navigate to task details when clicking view button', () => {
    cy.get('button[icon="pi pi-eye"]').first().click();
    cy.url().should('include', '/tasks/1');
  });
});