// cypress/e2e/05-create-task.cy.ts
describe('Task Creation', () => {
  beforeEach(() => {
    // We'll use the credentials and farm/field info from previous tests
    cy.fixture('user-credentials.json').then((credentials) => {
      cy.fixture('farm-info.json').then((farmInfo) => {
        cy.fixture('field-info.json').then((fieldInfo) => {
          // Login first
          cy.visit('/auth/login');
          cy.get('input[id="username"]').type(credentials.username);
          cy.get('input[id="password"]').type(credentials.password);
          cy.contains('button', /Sign In|Prisijungti/).click();
          
          // Wait to be redirected to dashboard
          cy.url().should('include', '/dashboard');
          
          // Now navigate to create task page
          cy.visit('/create-task');
        });
      });
    });
  });

  it('should create a new task successfully', () => {
    // Don't mock the task creation API
    cy.intercept('POST', '/tasks').as('createTask');

    // Select task type (first option)
    cy.get('.p-dropdown').eq(0).click();
    cy.get('.p-dropdown-item').first().click();
    
    // Enter description
    cy.get('textarea.p-inputtextarea').type('This is a test task description');
    
    // Select task status (Pending)
    cy.get('.p-dropdown').eq(1).click();
    cy.contains('.p-dropdown-item', /Pending|Suplanuotos/).click();
    
    // Select field
    cy.get('.p-dropdown').eq(2).click();
    cy.get('.p-dropdown-item').first().click();
    
    // Select season
    cy.get('.p-dropdown').eq(3).click();
    cy.get('.p-dropdown-item').first().click();
    
    // Select due date (tomorrow)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const formattedDate = tomorrow.toISOString().split('T')[0]; // YYYY-MM-DD
    
    cy.get('.p-calendar input').type(formattedDate);
    
    // Select equipment
    cy.get('.p-multiselect').click();
    cy.get('.p-multiselect-item').first().click();
    cy.get('body').click(); // Click outside to close dropdown
    
    // Submit the form using regex for both English and Lithuanian
    cy.contains('button', /Create Task|Sukurti užduotį/).click();
    
    // Wait for API request to complete
    cy.wait('@createTask').then((interception) => {
      expect(interception.response?.statusCode).to.eq(200);
      
      // Store task ID for potential future tests
      const taskId = interception.response?.body.id;
      cy.writeFile('cypress/fixtures/task-info.json', {
        id: taskId,
        description: 'This is a test task description'
      });
    });
    
    // Verify success message using regex for both languages
    cy.contains(/Task created successfully|Užduotis sėkmingai sukurta/).should('be.visible');
  });
});