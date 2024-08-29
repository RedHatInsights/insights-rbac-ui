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

  beforeEach(() => {
    cy.login();

    // Mock the users
    cy.intercept('GET', '**/api/rbac/v1/principals/*', {
      statusCode: 200,
      body: mockUsers,
    }).as('getUsers');

    cy.visit('/iam/access-management/users-and-user-groups');
    cy.wait('@getUsers', { timeout: 10000 });
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
});
