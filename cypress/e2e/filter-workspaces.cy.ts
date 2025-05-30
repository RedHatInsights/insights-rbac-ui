describe('Filter workspaces', () => {
  const mockWorkspaces = {
    meta: {
      count: 3,
      limit: 10000,
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
        name: 'AAA',
        id: '01939c7c-e19a-7f60-a38a-1937cbd55f0c',
        parent_id: '01938960-94c7-79e3-aecb-549ad25003b8',
        description: null,
        created: '2024-12-06T15:00:50.202053Z',
        modified: '2024-12-06T15:00:50.213196Z',
        type: 'standard',
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

    // check if 'xyc' workspace is visible
    cy.get('[data-ouia-component-id="workspaces-list-tr-2"]').should('exist');
  });

  afterEach(() => {
    // clear filter and return tree to original state
    cy.get('[data-ouia-component-id="DataViewToolbar-clear-all-filters"]').first().click();
    cy.get('[data-ouia-component-id="workspaces-list-tr-2"]').should('exist');
  });

  it('should filter workspaces', () => {
    // filter to hide entire tree and check if 'xyc' workspace is hidden
    cy.get('[data-ouia-component-id="workspace-name-filter"]').type('asdf');
    cy.get('[data-ouia-component-id="workspaces-list-tr-2"]').should('not.exist');
  });

  it('should not show children of filtered workspaces', () => {
    // filter to show 'AAA' workspace and check if 'xyc' is hidden
    cy.get('[data-ouia-component-id="workspace-name-filter"]').type('AAA');
    cy.get('[data-ouia-component-id="workspaces-list-tr-1"]').should('exist');
    cy.get('[data-ouia-component-id="workspaces-list-tr-2"]').should('not.exist');
  });
});
