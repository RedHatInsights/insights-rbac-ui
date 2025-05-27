describe('Workspaces page', () => {
  it('Visit Workspaces page', () => {
    cy.login(true);

    cy.visit('/iam/access-management/workspaces');

    // check if Workspaces heading exists on the page
    cy.contains('Workspaces', { timeout: 10000 }).should('exist');
  });
});
