describe('Users and User Groups page', () => {
  const mockUsers = {
    data: [
      {
        username: 'test-user-1',
        email: 'test1@example.com',
        first_name: 'Test',
        last_name: 'User1',
        is_active: true,
        is_org_admin: false,
      },
      {
        username: 'test-user-2',
        email: 'test2@example.com',
        first_name: 'Test',
        last_name: 'User2',
        is_active: false,
        is_org_admin: true,
      },
    ],
    meta: {
      count: 2,
      limit: 20,
      offset: 0,
    },
  };

  const mockUserGroups = {
    data: [
      {
        name: 'test-group-1',
        description: 'Test Group 1',
        principalCount: 1,
        roleCount: 2,
        modified: '2021-09-01T00:00:00Z',
      },
      {
        name: 'test-group-2',
        description: 'Test Group 2',
        principalCount: 3,
        roleCount: 4,
        modified: '2021-09-02T00:00:00Z',
      },
    ],
    meta: {
      count: 2,
      limit: 20,
      offset: 0,
    },
  };

  beforeEach(() => {
    cy.login();

    // Mock the users
    cy.intercept('GET', '**/api/rbac/v1/principals/*', {
      statusCode: 200,
      body: mockUsers,
    }).as('getUsers');

    // Mock the user groups
    cy.intercept('GET', '**/api/rbac/v1/groups/*', {
      statusCode: 200,
      body: mockUserGroups,
    }).as('getUserGroups');
  });

  it('should display the Users table and correct data', () => {
    cy.visit('/iam/access-management/users-and-user-groups');
    cy.wait('@getUsers', { timeout: 30000 });
    // Check if the table exists
    cy.get('[data-ouia-component-id^="iam-users-table"]').should('exist');

    // Verify the data in the table matches the mock data
    mockUsers.data.forEach((user, index) => {
      cy.get(`[data-ouia-component-id^="iam-users-table-table-tr-${index}"]`).within(() => {
        cy.get('td').eq(2).should('contain', user.username);
        cy.get('td').eq(3).should('contain', user.email);
        cy.get('td').eq(4).should('contain', user.first_name);
        cy.get('td').eq(5).should('contain', user.last_name);
        cy.get('td')
          .eq(6)
          .should('contain', user.is_active ? 'Active' : 'Inactive');
        cy.get('td')
          .eq(1)
          .should('contain', user.is_org_admin ? 'Yes' : 'No');
      });
    });
  });

  it('should be able to filter the Users table', () => {
    cy.visit('/iam/access-management/users-and-user-groups');
    cy.wait('@getUsers', { timeout: 30000 });
    cy.intercept('GET', '**/api/rbac/v1/principals/*usernames=test-user-1*', {
      statusCode: 200,
      body: {
        data: [mockUsers.data[0]],
        meta: {
          count: 1,
          limit: 20,
          offset: 0,
        },
      },
    }).as('getFilteredUsers');

    cy.get('[data-ouia-component-id="iam-users-table-filters"]').click();
    cy.get('[data-ouia-component-id="iam-users-table-username-filter"]').find('input').type('test-user-1');
    cy.wait('@getFilteredUsers', { timeout: 30000 });

    cy.get('[data-ouia-component-id^="iam-users-table-table-tr-0"]').within(() => {
      cy.get('td').eq(2).should('contain', 'test-user-1');
    });
  });

  it('should be able to sort the Users table', () => {
    cy.visit('/iam/access-management/users-and-user-groups');
    cy.wait('@getUsers', { timeout: 30000 });
    cy.intercept('GET', '**/api/rbac/v1/principals/*sort_order=desc*', {
      statusCode: 200,
      body: {
        data: [mockUsers.data[1], mockUsers.data[0]],
        meta: {
          count: 2,
          limit: 20,
          offset: 0,
        },
      },
    }).as('getSortedUsers');

    cy.get('[data-ouia-component-id^="iam-users-table-table-tr-0"]').within(() => {
      cy.get('td').eq(2).should('contain', 'test-user-1');
    });
    cy.get('[data-ouia-component-id^="iam-users-table-table-tr-1"]').within(() => {
      cy.get('td').eq(2).should('contain', 'test-user-2');
    });

    cy.get('[data-ouia-component-id="iam-users-table-table-th-1"]').click();
    cy.wait('@getSortedUsers', { timeout: 30000 });

    cy.get('[data-ouia-component-id^="iam-users-table-table-tr-0"]').within(() => {
      cy.get('td').eq(2).should('contain', 'test-user-2');
    });
    cy.get('[data-ouia-component-id^="iam-users-table-table-tr-1"]').within(() => {
      cy.get('td').eq(2).should('contain', 'test-user-1');
    });
  });

  it('should display warning modal when removing user', () => {
    cy.visit('/iam/access-management/users-and-user-groups');
    cy.wait('@getUsers', { timeout: 30000 });

    cy.get('[data-ouia-component-id^="iam-users-table-table-tr-0"]').within(() => {
      cy.get('td').eq(8).click();
    });
    cy.get('[data-ouia-component-id^="OUIA-Generated-DropdownItem-2"]').click();
    cy.get('[data-ouia-component-id^="iam-users-table-remove-user-modal"]').should('be.visible');
  });

  it('should display the User groups table and correct data', () => {
    cy.visit('/iam/access-management/users-and-user-groups');
    cy.wait('@getUsers', { timeout: 30000 });

    // Check if the table exists
    cy.get('[data-ouia-component-id^="iam-users-table"]').should('exist');

    cy.get('[data-ouia-component-id="user-groups-tab-button"]').should('exist');
    cy.get('[data-ouia-component-id="user-groups-tab-button"]').click();

    cy.wait('@getUserGroups', { timeout: 30000 });

    cy.get('[data-ouia-component-id^="iam-user-groups-table"]').should('exist');

    // Verify the data in the table matches the mock data
    mockUserGroups.data.forEach((group, index) => {
      cy.get(`[data-ouia-component-id^="iam-user-groups-table-table-tr-${index}"]`).within(() => {
        cy.get('td').eq(1).should('contain', group.name);
        cy.get('td').eq(2).should('contain', group.description);
        cy.get('td').eq(3).should('contain', group.principalCount);
        cy.get('td').eq(5).should('contain', group.roleCount);
      });
    });
  });

  it('should be able to open Add User Modal once an active user is selected', () => {
    cy.visit('/iam/access-management/users-and-user-groups');
    cy.wait('@getUsers', { timeout: 30000 });

    cy.get('[aria-label="Select row 0"]').click();
    cy.get('[data-ouia-component-id="iam-users-table-add-user-button"]').click();
    cy.get('[data-ouia-component-id="add-user-group-modal"]').should('be.visible');
  });

  it('can view user details when a user is clicked', () => {
    cy.visit('/iam/access-management/users-and-user-groups');
    cy.wait('@getUsers', { timeout: 30000 });

    cy.get('[data-ouia-component-id="iam-users-table-table-tr-0"]').click();
    cy.get('[data-ouia-component-id="user-details-drawer"]').should('be.visible');
    cy.get('[data-ouia-component-id="user-details-drawer"]').contains(mockUsers.data[0].first_name).should('exist');
    cy.get('[data-ouia-component-id="user-details-drawer"]').contains(mockUsers.data[0].last_name).should('exist');
    cy.get('[data-ouia-component-id="user-details-drawer"]').contains(mockUsers.data[0].email).should('exist');
  });

  it('should be able to open Delete User Groups Modal from row actions', () => {
    cy.visit('/iam/access-management/users-and-user-groups/user-groups');
    cy.wait('@getUserGroups', { timeout: 30000 });

    cy.get('[data-ouia-component-id="user-groups-tab-button"]').click();
    cy.get('[data-ouia-component-id^="iam-user-groups-table-table-td-0-7"]').click();
    cy.get('[data-ouia-component-id^="iam-user-groups-table-table-td-0-7"] button').contains('Delete user group').click();
    cy.get('[data-ouia-component-id="iam-user-groups-table-remove-user-modal"]').should('be.visible');
  });

  it('should be able to open Delete User Groups modal from toolbar', () => {
    cy.visit('/iam/access-management/users-and-user-groups/user-groups');
    cy.wait('@getUserGroups', { timeout: 30000 });

    cy.get('[data-ouia-component-id="user-groups-tab-button"]').click();
    cy.get('[data-ouia-component-id^="iam-user-groups-table-table-tr-0"]').find('input[type="checkbox"]').click();
    cy.get('[data-ouia-component-id="iam-user-groups-table-actions-dropdown-menu-control"]').click();
    cy.get('[data-ouia-component-id="iam-user-groups-table-actions-dropdown-menu-control"] button').contains('Delete user group').click();
  });

  it('should be able to open the Create User Groups Wizard from the toolbar', () => {
    cy.visit('/iam/access-management/users-and-user-groups/user-groups');
    cy.wait('@getUserGroups', { timeout: 30000 });

    cy.get('[data-ouia-component-id="edit-user-group-form"]').should('not.exist');
    cy.get('[data-ouia-component-id="user-groups-tab-button"]').click();
    cy.get('[data-ouia-component-id="iam-user-groups-table-actions-dropdown-action-0"]').click();
    cy.get('[data-ouia-component-id="edit-user-group-form"]').should('exist');
  });

  it('should be able to open Edit User Group page from row actions', () => {
    cy.visit('/iam/access-management/users-and-user-groups/user-groups');
    cy.wait('@getUserGroups', { timeout: 30000 });

    cy.get('[data-ouia-component-id="user-groups-tab-button"]').click();
    cy.get('[data-ouia-component-id^="iam-user-groups-table-table-td-0-7"]').click();
    cy.get('[data-ouia-component-id^="iam-user-groups-table-table-td-0-7"] button').contains('Edit user group').click();
    cy.url().should('include', '/iam/user-access/users-and-user-groups/edit-group');
    cy.get('[data-ouia-component-id="edit-user-group-form"]').should('be.visible');
  });
});
