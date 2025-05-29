describe('Workspaces Alert confirm path', { testIsolation: false }, () => {
  before(() => {
    cy.login(false);
    cy.visit('/iam/user-access/overview');
    cy.get('[data-ouia-component-id="ContentHeader-title"]', { timeout: 60000 });
  });

  it('should be visible', () => {
    cy.get('[data-ouia-component-id="enable-workspaces-alert"]').should(
      'include.text',
      'You are qualified to opt into the workspace user access model for your organization.',
    );
  });

  it('should open Enable Workspaces Modal', () => {
    cy.get('[data-ouia-component-id="enable-workspaces-switch"]').click();
    cy.get('[data-ouia-component-id="enable-workspaces-modal-header"]').should('have.text', 'Enable workspaces');
  });

  it('should show success alert after confirming', () => {
    cy.get('[data-ouia-component-id="enable-workspace-checkbox"]').click();
    cy.get('[data-ouia-component-id="enable-workspace-modal-confirm-button"]').click();
    cy.get('[data-ouia-component-id="enable-workspaces-success-alert"]').should('be.visible');
  });
});

describe('Workspaces Alert cancel path', { testIsolation: false }, () => {
  before(() => {
    cy.login(false);
    cy.visit('/iam/user-access/overview');
    cy.get('[data-ouia-component-id="ContentHeader-title"]', { timeout: 30000 });
  });

  it('should show switch toggled off when modal is cancelled', () => {
    cy.get('[data-ouia-component-id="enable-workspaces-switch"]').click();
    cy.get('[data-ouia-component-id="enable-workspace-modal-cancel-button"]').click();
    cy.get('[data-ouia-component-id="enable-workspaces-switch"]').should('not.be.checked');
  });
});
