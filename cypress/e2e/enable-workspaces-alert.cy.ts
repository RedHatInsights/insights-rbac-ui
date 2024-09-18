describe('Enable Workspaces Alert', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/iam/user-access/overview');
    cy.wait(5000);
  });

  it('should be visible', () => {
    cy.get('[data-ouia-component-id="enable-workspaces-alert"]').should(
      'include.text',
      'You are qualified to opt into the workspace user access model for your organization.'
    );
  });

  it('should open Enable Workspaces Modal', () => {
    cy.get('[data-ouia-component-id="enable-workspaces-switch"]').click();
    cy.get('[data-ouia-component-id="enable-workspaces-modal-header"]').should('have.text', 'Enable workspaces');
  });

  it('should show success alert after confirming', () => {
    cy.wait(3000);
    cy.get('[data-ouia-component-id="enable-workspaces-switch"]').click();
    cy.get('[data-ouia-component-id="enable-workspace-checkbox"]').click();
    cy.get('[data-ouia-component-id="enable-workspace-modal-confirm-button"]').click();
    cy.get('[data-ouia-component-id="enable-workspaces-success-alert"]').should('be.visible');
  });
});
