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

  const SELECTORS = {
    usersTable: '[data-ouia-component-id^="iam-users-table"]',
    usersTableActionsDropdown: '[data-ouia-component-id="iam-users-table-table-actions-menu-dropdown"]',
    usersTableActionsDropdownToggle: '[data-ouia-component-id="iam-users-table-table-actions-menu-dropdown-toggle"]',
    userGroupsTable: '[data-ouia-component-id^="iam-user-groups-table"]',
    userGroupsTab: '[data-ouia-component-id="user-groups-tab-button"]',
    userDetailsDrawer: '[data-ouia-component-id="user-details-drawer"]',
    addUserGroupModal: '[data-ouia-component-id="add-user-group-modal"]',
    removeUserModal: '[data-ouia-component-id^="iam-users-table-remove-user-modal"]',
    removeUserGroupModal: '[data-ouia-component-id="iam-user-groups-table-remove-user-modal"]',
    editUserGroupForm: '[data-ouia-component-id="edit-user-group-form"]',
    inviteUsersModalEmailField: 'textarea[id="email-addresses"]',
    inviteUsersModalMessageField: 'textarea[id="invite-message"]',
    inviteUsersModalInviteButton: '[data-ouia-component-id="primary-save-button"]',
  };

  const API_TIMEOUT = 30000;

  beforeEach(() => {
    cy.login(true);

    cy.intercept('GET', '**/api/rbac/v1/principals/*', {
      statusCode: 200,
      body: mockUsers,
    }).as('getUsers');

    cy.intercept('GET', '**/api/rbac/v1/groups/*', {
      statusCode: 200,
      body: mockUserGroups,
    }).as('getUserGroups');
  });

  describe('Users page', () => {
    beforeEach(() => {
      cy.visit('/iam/access-management/users-and-user-groups');
      cy.wait('@getUsers', { timeout: API_TIMEOUT });
    });

    it('should display the Users table and correct data', () => {
      cy.get(SELECTORS.usersTable).should('exist');

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
      cy.wait('@getFilteredUsers', { timeout: API_TIMEOUT });

      cy.get('[data-ouia-component-id^="iam-users-table-table-tr-0"]').within(() => {
        cy.get('td').eq(2).should('contain', 'test-user-1');
      });
    });

    it('should be able to sort the Users table', () => {
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
      cy.wait('@getSortedUsers', { timeout: API_TIMEOUT });

      cy.get('[data-ouia-component-id^="iam-users-table-table-tr-0"]').within(() => {
        cy.get('td').eq(2).should('contain', 'test-user-2');
      });
      cy.get('[data-ouia-component-id^="iam-users-table-table-tr-1"]').within(() => {
        cy.get('td').eq(2).should('contain', 'test-user-1');
      });
    });

    it('should display warning modal when removing user', () => {
      cy.get('[data-ouia-component-id^="iam-users-table-table-tr-0"]').within(() => {
        cy.get('td').eq(8).click();
      });
      cy.get('[data-ouia-component-id^="OUIA-Generated-DropdownItem-2"]').click();

      cy.get(SELECTORS.removeUserModal).should('be.visible');
    });

    it('should be able to open Add User Modal once an active user is selected', () => {
      cy.get('[aria-label="Select row 0"]').click();
      cy.get('[data-ouia-component-id="iam-users-table-add-user-button"]').click();

      cy.get(SELECTORS.addUserGroupModal).should('be.visible');
    });

    it('can view user details when a user is clicked', () => {
      cy.get('[data-ouia-component-id="iam-users-table-table-tr-0"]').click();

      cy.get(SELECTORS.userDetailsDrawer).should('be.visible');
      cy.get(SELECTORS.userDetailsDrawer).contains(mockUsers.data[0].first_name).should('exist');
      cy.get(SELECTORS.userDetailsDrawer).contains(mockUsers.data[0].last_name).should('exist');
      cy.get(SELECTORS.userDetailsDrawer).contains(mockUsers.data[0].email).should('exist');
    });

    it('should be able to navigate to the User groups table and display correct data', () => {
      cy.get(SELECTORS.usersTable).should('exist');

      cy.get(SELECTORS.userGroupsTab).should('exist');
      cy.get(SELECTORS.userGroupsTab).click();
      cy.wait('@getUserGroups', { timeout: API_TIMEOUT });

      cy.get(SELECTORS.userGroupsTable).should('exist');

      mockUserGroups.data.forEach((group, index) => {
        cy.get(`[data-ouia-component-id^="iam-user-groups-table-table-tr-${index}"]`).within(() => {
          cy.get('td').eq(1).should('contain', group.name);
          cy.get('td').eq(2).should('contain', group.description);
          cy.get('td').eq(3).should('contain', group.principalCount);
          cy.get('td').eq(5).should('contain', group.roleCount);
        });
      });
    });

    it.only('should be able to invite a user to the organization from the users table', () => {
      // Set up the spying so we can check the response

      cy.intercept('**/account/v1/accounts/*/users/invite', {
        statusCode: 204,
        body: { data: [], meta: {} },
      }).as('getInviteStatus');

      // Open the actions dropdown
      cy.get(SELECTORS.usersTableActionsDropdownToggle).click();
      // Click the "Invite users" button
      cy.get(SELECTORS.usersTableActionsDropdown).within(() => {
        cy.get('button[role="menuitem"]').contains('Invite users').click();
      });
      // Make sure the modal is open via the header bc no good OUIA ID for the modal yet
      cy.get('span[class$="modal-box__title-text"]').contains('Invite New Users').should('exist');
      // Add the address of one of our test users to the email field
      cy.get(SELECTORS.inviteUsersModalEmailField).type(mockUsers.data[0].email);
      // Send the invite
      cy.get(SELECTORS.inviteUsersModalInviteButton).click();
      // Check the invite code
      cy.wait('@getInviteStatus').its('response.statusCode').should('eq', 204);
    });
  });

  describe('User Groups page', () => {
    beforeEach(() => {
      cy.visit('/iam/access-management/users-and-user-groups/user-groups');
      cy.wait('@getUserGroups', { timeout: API_TIMEOUT });
    });

    it('should be able to open Delete User Groups Modal from row actions', () => {
      cy.get('[data-ouia-component-id^="iam-user-groups-table-table-td-0-7"]').click();
      cy.get('[data-ouia-component-id^="iam-user-groups-table-table-td-0-7"] button').contains('Delete user group').click();

      cy.get(SELECTORS.removeUserGroupModal).should('be.visible');
    });

    it('should be able to open Delete User Groups modal from toolbar', () => {
      cy.get('[data-ouia-component-id^="iam-user-groups-table-table-tr-0"]').find('input[type="checkbox"]').click();
      cy.get('[data-ouia-component-id="iam-user-groups-table-actions-dropdown-menu-control"]').click();
      cy.get('[data-ouia-component-id="iam-user-groups-table-actions-dropdown-menu-control"] button').contains('Delete user group').click();
    });

    it('should be able to open the Create User Groups Wizard from the toolbar', () => {
      cy.get(SELECTORS.editUserGroupForm).should('not.exist');

      cy.get('[data-ouia-component-id="iam-user-groups-table-actions-dropdown-action-0"]').click();

      cy.get(SELECTORS.editUserGroupForm).should('exist');
    });

    it('should be able to open Edit User Group page from row actions', () => {
      cy.get('[data-ouia-component-id^="iam-user-groups-table-table-td-0-7"]').click();
      cy.get('[data-ouia-component-id^="iam-user-groups-table-table-td-0-7"] button').contains('Edit user group').click();

      cy.url().should('include', '/iam/user-access/users-and-user-groups/edit-group');
      cy.get(SELECTORS.editUserGroupForm).should('be.visible');
    });
  });
});
