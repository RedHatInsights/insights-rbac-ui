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
        accessCount: 2,
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
        accessCount: 2,
        applications: [],
        system: false,
        platform_default: false,
        admin_default: false,
        external_role_id: null,
        external_tenant: null,
      },
      {
        uuid: '00000-00000-1111-1111-111111',
        name: 'A_Test_00000-00000',
        display_name: 'A Test',
        description: 'Test role A',
        created: '2024-05-17T05:03:15.684013Z',
        modified: '2024-05-17T05:03:15.709410Z',
        policyCount: 2,
        accessCount: 2,
        applications: [],
        system: false,
        platform_default: false,
        admin_default: false,
        external_role_id: null,
        external_tenant: null,
      },
    ],
    meta: {
      count: 3,
      limit: 20,
      offset: 0,
    },
  };

  const sortedRoles = {
    data: [
      {
        uuid: '00000-00000-1111-1111-111111',
        name: 'A_Test_00000-00000',
        display_name: 'A Test',
        description: 'Test role A',
        created: '2024-05-17T05:03:15.684013Z',
        modified: '2024-05-17T05:03:15.709410Z',
        policyCount: 2,
        accessCount: 2,
        applications: [],
        system: false,
        platform_default: false,
        admin_default: false,
        external_role_id: null,
        external_tenant: null,
      },
      {
        uuid: '00000-0000-0000-0000-00000000',
        name: 'Test_1_00000-00000',
        display_name: 'Test 1',
        description: 'Test role1',
        created: '2024-05-17T05:03:15.684013Z',
        modified: '2024-05-17T05:03:15.709410Z',
        policyCount: 2,
        accessCount: 2,
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
        accessCount: 2,
        applications: [],
        system: false,
        platform_default: false,
        admin_default: false,
        external_role_id: null,
        external_tenant: null,
      },
    ],
    meta: {
      count: 3,
      limit: 20,
      offset: 0,
    },
  };

  const filteredRoles = {
    data: [
      {
        uuid: '00000-00000-1111-1111-111111',
        name: 'A_Test_00000-00000',
        display_name: 'A Test',
        description: 'Test role A',
        created: '2024-05-17T05:03:15.684013Z',
        modified: '2024-05-17T05:03:15.709410Z',
        policyCount: 2,
        accessCount: 2,
        applications: [],
        system: false,
        platform_default: false,
        admin_default: false,
        external_role_id: null,
        external_tenant: null,
      },
    ],
    meta: {
      count: 1,
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
    cy.wait('@getRoles', { timeout: 15000 });
  });

  it('should display the Roles table and correct data', () => {
    cy.get('[data-ouia-component-id="RolesTable-detail-drawer"]').should('exist');

    mockRoles.data.forEach((role, index) => {
      cy.get(`[data-ouia-component-id^="RolesTable-table-tr-${index}"]`).within(() => {
        cy.get('td').eq(1).should('contain', role.display_name);
        cy.get('td').eq(2).should('contain', role.description);
        cy.get('td').eq(3).should('contain', role.accessCount);
        cy.get('td').eq(4).should('contain', '');
        cy.get('td').eq(5).should('contain', '');
        cy.get('td').eq(6).should('contain', role.modified);
      });
    });
  });

  it('should display the details drawer', () => {
    mockRoles.data.forEach((role, index) => {
      cy.get(`[data-ouia-component-id^="RolesTable-table-tr-${index}"]`).within(() => {
        cy.get('td').eq(1).should('contain', role.display_name);
        cy.get('td').eq(2).should('contain', role.description);
        cy.get('td').eq(3).should('contain', role.accessCount);
        cy.get('td').eq(4).should('contain', '');
        cy.get('td').eq(5).should('contain', '');
        cy.get('td').eq(6).should('contain', role.modified);
      });
    });
    cy.get('[data-ouia-component-id^="RolesTable-table-tr-1"]').click();
    cy.get('[data-ouia-component-id^="RolesTable-drawer-tabs"]').should('be.visible');
    cy.get('[data-ouia-component-id^="role-permissions-table-stack"]').should('be.visible');
    cy.get('[data-ouia-component-id^="RolesTable-assigned-groups-tab"]').first().click();
    cy.get('[data-ouia-component-id^="assigned-usergroups-table-stack"]').should('be.visible');
  });

  it('should sort roles', () => {
    cy.intercept('GET', '**/api/rbac/v1/roles/?limit=20&display_name=&scope=org_id&order_by=display_name*', {
      statusCode: 200,
      body: sortedRoles,
    }).as('sortRoles');
    cy.get('[data-ouia-component-id="RolesTable-table-th-0"]').click();
    cy.wait('@sortRoles', { timeout: 15000 });
    cy.get('[data-ouia-component-id="RolesTable-table-td-0-0"]').should('contain.text', 'A Test');
  });

  it('should filter roles by name', () => {
    cy.intercept('GET', '**/api/rbac/v1/roles/?limit=20&display_name=A*', {
      statusCode: 200,
      body: filteredRoles,
    }).as('filterRoles');
    cy.get('[data-ouia-component-id="RolesTable-name-filter-input"]').type('A');
    cy.wait('@filterRoles', { timeout: 15000 });
    cy.get('table tbody tr').should('have.length', 1);
  });

  it('should open the add roles wizard', () => {
    cy.get('button[data-ouia-component-id="add-role-button"]').click();
    cy.get('div[data-ouia-component-type="PF5/ModalContent"]').should('exist');
    cy.contains('Create role').should('be.visible');
  });

  it('should close the add role wizard on cancel', () => {
    cy.get('button[data-ouia-component-id="add-role-button"]').click();
    cy.get('div[data-ouia-component-type="PF5/ModalContent"]').should('exist');
    cy.contains('Cancel').click();
    cy.get('div[data-ouia-component-type="PF5/ModalContent"]').should('not.exist');
  });
});
