describe('Workspaces page', () => {
  const mockWorkspaces = {
    meta: {
      count: 1,
      limit: 10000,
      offset: 0,
    },
    data: [
      {
        name: 'Root Workspace',
        id: 'asd-sda-asd-dsa-asd',
        parent_id: null,
        description: null,
        created: '2024-12-02T21:57:08.423927Z',
        modified: '2024-12-02T21:57:08.504809Z',
        type: 'root',
      },
    ],
  };

  beforeEach(() => {
    cy.login(true);

    // mock the workspaces
    cy.intercept('GET', '**/api/rbac/v2/workspaces/*', {
      statusCode: 200,
      body: mockWorkspaces,
    }).as('getWorkspaces');

    // mock the workspace
    cy.intercept('GET', '**/api/rbac/v2/workspaces/asd-sda-asd-dsa-asd/*', {
      statusCode: 200,
      body: mockWorkspaces.data[0],
    }).as('getWorkspace');
  });

  it('Visit Workspaces page', () => {
    cy.visit('/iam/access-management/workspaces');
    cy.wait('@getWorkspaces', { timeout: 30000 });

    // check if Workspaces heading exists on the page
    cy.contains('Workspaces').should('exist');

    cy.contains('a', 'Root Workspace').click();

    cy.wait('@getWorkspace', { timeout: 30000 });

    cy.contains('Assets').should('be.visible');
    cy.contains('Workspace hierarchy:').should('have.length', 1);
  });
});
