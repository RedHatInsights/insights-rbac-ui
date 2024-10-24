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

    cy.visit('/iam/access-management/users-and-user-groups');
    cy.wait('@getUsers', { timeout: 30000 });
  });

  it('should display the Users table and correct data', () => {
    // Check if the table exists
    cy.get('[data-ouia-component-id^="iam-users-table"]').should('exist');

    // Verify the data in the table matches the mock data
    mockUsers.data.forEach((user, index) => {
      cy.get(`[data-ouia-component-id^="iam-users-table-table-tr-${index}"]`).within(() => {
        cy.get('td').eq(1).should('contain', user.username);
        cy.get('td').eq(2).should('contain', user.email);
        cy.get('td').eq(3).should('contain', user.first_name);
        cy.get('td').eq(4).should('contain', user.last_name);
        cy.get('td')
          .eq(5)
          .should('contain', user.is_active ? 'Active' : 'Inactive');
        cy.get('td')
          .eq(6)
          .should('contain', user.is_org_admin ? 'Yes' : 'No');
      });
    });
  });

  it('should display warning modal when removing user', () => {
    cy.get('[data-ouia-component-id^="iam-users-table-table-td-0-6"]').click();
    cy.get('[data-ouia-component-id^="OUIA-Generated-DropdownItem-2"]').click();
    cy.get('[data-ouia-component-id^="iam-users-table-remove-user-modal"]').should('be.visible');
  });

  it('should display the User groups table and correct data', () => {
    // Check if the table exists
    cy.get('[data-ouia-component-id^="iam-users-table"]').should('exist');

    cy.get('[data-ouia-component-id="user-groups-tab-button"]').should('exist');
    cy.get('[data-ouia-component-id="user-groups-tab-button"]').click();

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
});
