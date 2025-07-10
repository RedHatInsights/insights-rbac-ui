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
    cy.login(true);

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
    cy.get('[data-ouia-component-id="OUIA-Generated-MenuToggle-plain-1"]').first().click();
    cy.get('[data-ouia-component-id="OUIA-Generated-DropdownItem-1"]').should('have.class', 'pf-m-disabled');
    cy.get('[data-ouia-component-id="OUIA-Generated-DropdownItem-2"]').should('have.class', 'pf-m-disabled');
  });

  it('should let user edit but not delete a default workspace', () => {
    // click the menu button on the default workspace and ensure edit is enabled and delete is disabled
    cy.get('[data-ouia-component-id="OUIA-Generated-MenuToggle-plain-2"]').last().click();
    cy.get('[data-ouia-component-id="OUIA-Generated-DropdownItem-1"]').should('not.have.class', 'pf-m-disabled');
    cy.get('[data-ouia-component-id="OUIA-Generated-DropdownItem-2"]').should('have.class', 'pf-m-disabled');
  });

  it('should let user edit and delete a standard workspace', () => {
    // click the menu button on a standard workspace and ensure edit and delete are enabled
    cy.get('[data-ouia-component-id="OUIA-Generated-MenuToggle-plain-3"]').last().click();
    cy.get('[data-ouia-component-id="OUIA-Generated-DropdownItem-1"]').should('not.have.class', 'pf-m-disabled');
    cy.get('[data-ouia-component-id="OUIA-Generated-DropdownItem-2"]').should('not.have.class', 'pf-m-disabled');
  });
});
