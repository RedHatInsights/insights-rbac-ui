describe('Enable Workspaces Alert', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/iam/user-access/overview');
    cy.intercept('GET', '**/api/rbac/v1/access/?application=rbac&limit=1000').as('overviewPage');
    cy.wait('@overviewPage', { timeout: 8000 }).its('response.statusCode').should('eq', 200);
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
    cy.get('[data-ouia-component-id="enable-workspaces-switch"]').click();
    cy.get('[data-ouia-component-id="enable-workspace-checkbox"]').click();
    cy.get('[data-ouia-component-id="enable-workspace-modal-confirm-button"]').click();
    cy.get('[data-ouia-component-id="enable-workspaces-success-alert"]').should('be.visible');
  });
});
