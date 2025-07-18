const API_TIMEOUT = 30000;
const testUsername = 'platform-experience-ui';

const waitForUsersTable = () => {
  cy.get('table[aria-label="Users Table"]', { timeout: 100000 });
  cy.screenshot(`users-table-${Cypress.currentTest.title}`);
  cy.get('table[aria-label="Users Table"]').should('be.visible');
};

const navigateToUsersTable = () => {
  cy.login();
  cy.visit('/iam/user-access/users');
  waitForUsersTable();
};

const filterTestUser = (username: string) => {
  cy.get('#filter-by-username').clear().type(username, { delay: 100 });
  cy.contains('tr', username).should('be.visible');
};

const clearAllFilters = () => {
  cy.get('button[data-ouia-component-id="ClearFilters"]')
    .should('be.visible')
    .click();

  waitForUsersTable();
};

const findUserRowByStatus = (status: 'Active' | 'Inactive') => {
  return cy.get('table tbody tr').filter(`:contains(${status})`).first();
};

const toggleUserStatus = (row: Cypress.Chainable<JQuery<HTMLElement>>) => {
  row.within(() => {
    cy.get('input[type="checkbox"][data-testid="user-status-toggle"]')
      .should('exist')
      .click({ force: true });
  });
};

const selectUsersByStatus = (status: 'Active' | 'Inactive', count: number) => {
  cy.get('table tbody tr')
    .filter(`:contains(${status})`)
    .then((rows) => {
      const slicedRows = Array.from(rows).slice(0, count);
      cy.wrap(slicedRows).each((el) => {
        cy.wrap(el).find('input[type="checkbox"][aria-label^="Select row"]').click({ force: true });
      });
    });
};

describe('Make user an org admin', () => {
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
    navigateToUsersTable();
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
});

describe('Activate/deactivate users from users table', () => {
  beforeEach(() => {
    navigateToUsersTable();
    clearAllFilters();
  });

  describe('Single user action via toggle', () => {
    it('activates an inactive user', () => {
      cy.intercept('POST', '**/account/v1/accounts/**/users/**/status', {
        statusCode: 200,
        body: { status: 'enabled' },
      }).as('enableUser');

      findUserRowByStatus('Inactive').then((row) => {
        toggleUserStatus(cy.wrap(row));
        cy.wait('@enableUser', { timeout: API_TIMEOUT });
      });
    });

    it('deactivates an active user', () => {
      cy.intercept('POST', '**/account/v1/accounts/**/users/**/status', {
        statusCode: 200,
        body: { status: 'disabled' },
      }).as('disableUser');

      findUserRowByStatus('Active').then((row) => {
        toggleUserStatus(cy.wrap(row));
        cy.wait('@disableUser', { timeout: API_TIMEOUT });
      });
    });
  });

  describe('Bulk action via dropdown', () => {
    const triggerBulkAction = (actionLabel: string) => {
      cy.get('button[aria-label="kebab dropdown toggle"]').click();
      cy.get('ul[role="menu"]').within(() => {
        cy.contains('li', actionLabel).click();
      });

      cy.get('div[data-ouia-component-id="toggle-status-modal"]').should('be.visible');

      cy.get('div[data-ouia-component-id="toggle-status-modal"]')
        .find('.pf-v5-c-modal-box__title-text')
        .should('contain.text', actionLabel);

      cy.get('input[data-ouia-component-id="toggle-status-modal-confirm-checkbox"]').check();

      cy.get('div[data-ouia-component-id="toggle-status-modal"]')
        .find('button[data-ouia-component-id="toggle-status-modal-confirm-button"]')
        .should('not.be.disabled')
        .click();

      cy.get('div[data-ouia-component-id="toggle-status-modal"]').should('not.exist');
    };

    it('activates multiple inactive users', () => {
      cy.intercept('POST', '**/account/v1/accounts/**/users/**/status', {
        statusCode: 200,
        body: { status: 'enabled' },
      }).as('bulkEnable');

      selectUsersByStatus('Inactive', 2);
      triggerBulkAction('Activate users');

      cy.wait('@bulkEnable', { timeout: API_TIMEOUT }).its('request.body').should('deep.equal', { status: 'enabled' });
      cy.wait('@bulkEnable');
    });

    it('deactivates multiple active users', () => {
      cy.intercept('POST', '**/account/v1/accounts/**/users/**/status', {
        statusCode: 200,
        body: { status: 'disabled' },
      }).as('bulkDisable');

      selectUsersByStatus('Active', 2);
      triggerBulkAction('Deactivate users');

      cy.wait('@bulkDisable', { timeout: API_TIMEOUT }).its('request.body').should('deep.equal', { status: 'disabled' });
      cy.wait('@bulkDisable');
    });
  });
});
