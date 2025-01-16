describe('Workspaces page', () => {
  it('Displays create workspace button', () => {
    cy.login();

    cy.intercept('GET', '**/api/rbac/v2/workspaces/*', {
      statusCode: 200,
      body: { data: [], meta: {} },
    }).as('getWorkspaces');

    cy.visit('/iam/access-management/workspaces');
    cy.wait('@getWorkspaces', { timeout: 30000 });

    // check if Workspaces heading exists on the page
    cy.contains('Workspaces').should('exist');

    cy.get('button[data-ouia-component-id="create-workspace-button"]').should('exist');
  });

  it('Opens the create workspace wizard', () => {
    cy.login();

    cy.intercept('GET', '**/api/rbac/v2/workspaces/*', {
      statusCode: 200,
      body: { data: [], meta: {} },
    }).as('getWorkspaces');

    cy.visit('/iam/access-management/workspaces');
    cy.wait('@getWorkspaces', { timeout: 30000 });

    cy.contains('Workspaces').should('exist');

    cy.get('button[data-ouia-component-id="create-workspace-button"]').click();

    cy.contains('Create new workspace').should('be.visible');
    cy.contains('Workspace name').should('be.visible');
    cy.contains('Workspace description').should('be.visible');
  });

  it('Closes the create workspace wizard on cancel', () => {
    cy.login();

    cy.intercept('GET', '**/api/rbac/v2/workspaces/*', {
      statusCode: 200,
      body: { data: [], meta: {} },
    }).as('getWorkspaces');

    cy.visit('/iam/access-management/workspaces');
    cy.wait('@getWorkspaces', { timeout: 30000 });

    cy.contains('Workspaces').should('exist');

    cy.get('button[data-ouia-component-id="create-workspace-button"]').click();

    cy.get('div[data-ouia-component-id="create-workspace-wizard"]').should('exist');

    cy.contains('Cancel').click();

    cy.get('div[data-ouia-component-id="create-workspace-wizard"]').should('not.exist');
  });
});
