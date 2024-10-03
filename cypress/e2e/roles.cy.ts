describe('Roles page', () => {
  const mockRoles = {
    data: [
      {
        uuid: '00000-0000-0000-0000-00000000',
        name: 'Test_1_00000-00000',
        display_name: 'Test 1',
        description: 'Test role1',
        created: '2024-05-17T05:03:15.684013Z',
        modified: '2024-05-17T05:03:15.709410Z',
        policyCount: 2,
        accessCount: 0,
        applications: [],
        system: false,
        platform_default: false,
        admin_default: false,
        external_role_id: null,
        external_tenant: null,
      },
      {
        uuid: '00000-11111-1111-1111-111111',
        name: 'Test_2_00000-00000',
        display_name: 'Test 2',
        description: 'Test role2',
        created: '2024-05-17T05:03:15.684013Z',
        modified: '2024-05-17T05:03:15.709410Z',
        policyCount: 2,
        accessCount: 0,
        applications: [],
        system: false,
        platform_default: false,
        admin_default: false,
        external_role_id: null,
        external_tenant: null,
      },
    ],
    meta: {
      count: 2,
      limit: 20,
      offset: 0,
    },
  };

  beforeEach(() => {
    cy.login(true);

    cy.intercept('GET', '**/api/rbac/v1/roles/*', {
      statusCode: 200,
      body: mockRoles,
    }).as('getRoles');

    cy.visit('/iam/user-access/roles');
    cy.wait('@getRoles', { timeout: 10000 });
  });

  it('should display the Users table and correct data', () => {
    cy.get('[data-ouia-component-id="RolesTable-stack}"]').should('exist');

    mockRoles.data.forEach((role, index) => {
      cy.get(`[data-ouia-component-id^="RolesTable-table-tr-${index}"]`).within(() => {
        cy.get('td').eq(1).should('contain', role.display_name);
        cy.get('td').eq(2).should('contain', role.description);
        cy.get('td').eq(3).should('contain', role.policyCount);
        cy.get('td').eq(4).should('contain', '');
        cy.get('td').eq(5).should('contain', '');
        cy.get('td').eq(6).should('contain', role.modified);
      });
    });
  });
});
