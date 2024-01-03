describe('My User Access Landing page', () => {
  it('Visit My User Access Landing page', () => {
    cy.login();

    cy.visit('/iam/my-user-access');
    cy.wait(4000);

    // check if My User Access heading exists on the page
    cy.contains('My User Access').should('exist');
  });
});
