describe('Filter workspaces', () => {
  const mockWorkspaces = {
    meta: {
      count: 3,
      limit: 100,
      offset: 0,
    },
    data: [
      {
        name: 'Root Workspace',
        id: '01938960-94c7-79e3-aecb-549ad25003b8',
        parent_id: null,
        description: null,
        created: '2024-12-02T21:57:08.423927Z',
        modified: '2024-12-02T21:57:08.504809Z',
        type: 'root',
      },
      {
        name: 'Default Workspace',
        id: '01939c7c-e19a-7f60-a38a-1937cbd55f0c',
        parent_id: '01938960-94c7-79e3-aecb-549ad25003b8',
        description: null,
        created: '2024-12-06T15:00:50.202053Z',
        modified: '2024-12-06T15:00:50.213196Z',
        type: 'default',
      },
      {
        name: 'xyc',
        id: '0193d8ee-06d5-76a3-af0b-2b002431016d',
        parent_id: '01939c7c-e19a-7f60-a38a-1937cbd55f0c',
        description: null,
        created: '2024-12-18T08:41:38.261872Z',
        modified: '2024-12-18T08:41:38.271103Z',
        type: 'standard',
      },
    ],
  };

  beforeEach(() => {
    cy.login();

    // mock the workspaces
    cy.intercept('GET', '**/api/rbac/v2/workspaces/*', {
      statusCode: 200,
      body: mockWorkspaces,
    }).as('getWorkspaces');

    cy.visit('/iam/access-management/workspaces');
    cy.wait('@getWorkspaces', { timeout: 30000 });

    // check if Workspaces heading exists on the page
    cy.contains('Workspaces').should('exist');

    // expand tree
    cy.get('[aria-label="Expand row 0"]').click();
    cy.get('[aria-label="Expand row 1"]').click();
  });

  it('should not let user edit or delete root workspace', () => {
    // click the menu button on the root workspace and ensure edit and delete are disabled
    cy.contains('div', 'Root Workspace')
      .parents('tr')
      .find('button[aria-label="Kebab toggle"]').click();
    cy.get('[aria-label="edit workspace Root Workspace"]').parents('li').should('have.class', 'pf-m-disabled');
    cy.get('[aria-label="delete workspace Root Workspace"]').parents('li').should('have.class', 'pf-m-disabled');
    cy.get('[aria-label="move workspace Root Workspace"]').parents('li').should('have.class', 'pf-m-disabled');
  });

  it('should let user edit but not delete a default workspace', () => {
    cy.contains('div', 'Default Workspace')
      .parents('tr')
      .find('button[aria-label="Kebab toggle"]').click();
    cy.get('[aria-label="edit workspace Default Workspace"]').parents('li').should('not.have.class', 'pf-m-disabled');
    cy.get('[aria-label="delete workspace Default Workspace"]').parents('li').should('have.class', 'pf-m-disabled');
    cy.get('[aria-label="move workspace Default Workspace"]').parents('li').should('have.class', 'pf-m-disabled');
  });

  it('should let user edit and delete a standard workspace', () => {
    cy.contains('div', 'xyc')
      .parents('tr')
      .find('button[aria-label="Kebab toggle"]').click();
      cy.get('[aria-label="edit workspace xyc"]').parents('li').should('not.have.class', 'pf-m-disabled');
    cy.get('[aria-label="delete workspace xyc"]').parents('li').should('not.have.class', 'pf-m-disabled');
    cy.get('[aria-label="move workspace xyc"]').parents('li').should('not.have.class', 'pf-m-disabled');
  });
});
