describe('Make user an org admin', () => {
  const testUsername = 'platform-experience-ui';
  const API_TIMEOUT = 30000;

  const filterTestUser = (username: string) => {
    cy.get('#filter-by-username').clear().type(username, { delay: 100 });
    cy.contains('tr', username).should('be.visible');
  };

  const setOrgAdminViaUI = (username: string, targetState: 'Yes' | 'No') => {
    cy.contains('tr', username).within(() => {
      cy.get('button.pf-v5-c-menu-toggle')
        .should('exist')
        .then(($btn) => {
          const currentState = $btn.text().trim();
          if (currentState !== targetState) {
            cy.wrap($btn).click();

            cy.get('[role="menu"]').should('be.visible');

            cy.contains('[role="menuitem"], button', targetState).click();
          }
        });
    });
  };

  beforeEach(() => {
    cy.login();
    cy.visit('/iam/user-access/users');
    cy.get('table[data-ouia-component-id="users-table"]', { timeout: 100000 }).should('be.visible');
    filterTestUser(testUsername);
  });

  it('Grants org admin status to a user', () => {
    cy.intercept('POST', '**/account/v1/accounts/**', {
      statusCode: 200,
      body: { roles: ['organization_administrator'] },
    }).as('setOrgAdmin');
    setOrgAdminViaUI(testUsername, 'Yes');
    cy.wait('@setOrgAdmin', { timeout: API_TIMEOUT });
  });

  it('Removes org admin status from a user', () => {
    cy.intercept('DELETE', '**/account/v1/accounts/**', {
      statusCode: 200,
      body: { roles: [] },
    }).as('removeOrgAdmin');
    setOrgAdminViaUI(testUsername, 'No');
    cy.wait('@removeOrgAdmin', { timeout: API_TIMEOUT });
  });
});
