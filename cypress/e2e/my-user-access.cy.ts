describe('My User Access Landing page', () => {
  beforeEach(() => {
    cy.login();
    cy.visit('/iam/my-user-access');
    cy.wait(4000);
  });

  it('Visit My User Access Landing page', () => {
    // check if My User Access heading exists on the page
    cy.contains('My User Access').should('exist');
  });

  describe('Settings and User Access roles', () => {
    it('Select the Settings and User Access roles card', () => {
      cy.contains('Settings and User Access').should('exist');
      cy.contains('Settings and User Access').click();
      // verify the card was selected
      cy.contains('Your Settings and User Access roles').should('exist');
    });
  });
});
