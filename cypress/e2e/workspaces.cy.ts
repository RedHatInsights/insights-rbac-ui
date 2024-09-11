describe('Workspaces page', () => {
  it('Visit Workspaces page', () => {
    cy.login();

    cy.visit('/iam/access-management/workspaces');
    cy.wait(4000);

    // check if Workspaces heading exists on the page
    cy.contains('Workspaces').should('exist');
  });
});
