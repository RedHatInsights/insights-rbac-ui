describe('My User Access Landing page', () => {
  beforeEach(() => {
    cy.login(true);
    cy.visit('/iam/my-user-access');
    cy.viewport(1280, 800); // ensure the viewport is large enough to display the role cards
  });

  it('Visit My User Access Landing page', () => {
    // check if My User Access heading exists on the page
    cy.contains('My User Access', { timeout: 8000 }).should('exist');
  });

  describe('Settings and User Access roles', () => {
    it('Select the Settings and User Access roles card', () => {
      // scroll to bottom of card list to make the settings card visible
      cy.get('.rbac-l-myUserAccess-section__cards', { timeout: 12000 }).scrollTo('bottom');
      cy.contains('Settings and User Access').should('exist');
      cy.contains('Settings and User Access').click();
      // verify the card was selected
      cy.contains('Your Settings and User Access roles').should('exist');
    });
  });
});
