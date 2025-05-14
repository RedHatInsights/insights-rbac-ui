describe('Workspaces page', { testIsolation: false }, () => {
  before(() => {
    cy.login();

    cy.visit('/iam/access-management/workspaces');
    cy.get('[data-ouia-component-id="ContentHeader-title"]', { timeout: 30000 });
  });

  it('Displays create workspace button', () => {
    cy.get('button[data-ouia-component-id="create-workspace-button"]').should('exist');
  });

  it('Opens the create workspace wizard', () => {
    cy.get('button[data-ouia-component-id="create-workspace-button"]').click();

    cy.contains('Create new workspace').should('be.visible');
    cy.contains('Workspace name').should('be.visible');
    cy.contains('Workspace description').should('be.visible');
  });

  it('Closes the create workspace wizard on cancel', () => {
    cy.contains('Cancel').click();
    cy.get('div[data-ouia-component-id="create-workspace-wizard"]').should('not.exist');
  });
});
