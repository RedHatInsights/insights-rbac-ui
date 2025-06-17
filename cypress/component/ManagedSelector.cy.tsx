import React from 'react';
import ManagedSelector, { RBACListWorkspacesResponse } from '../../src/smart-components/workspaces/managed-selector/ManagedSelector';
import WorkspaceType from '../../src/smart-components/workspaces/managed-selector/WorkspaceType';

const mockListWorkspacesResponse: RBACListWorkspacesResponse = {
  data: [
    {
      id: 'A',
      type: WorkspaceType.ROOT,
      name: 'Root Workspace A',
      description: 'Description for Workspace A',
      created: '2023-01-01T00:00:00Z',
      updated: '2023-01-02T00:00:00Z',
    },
    {
      id: 'B',
      parent_id: 'A',
      type: WorkspaceType.DEFAULT,
      name: 'Child Workspace B',
      description: 'Description for Workspace B',
      created: '2023-01-03T00:00:00Z',
      updated: '2023-01-04T00:00:00Z',
    },
    {
      id: 'C',
      parent_id: 'A',
      type: WorkspaceType.DEFAULT,
      name: 'Child Workspace C',
      description: 'Description for Workspace C',
      created: '2023-01-05T00:00:00Z',
      updated: '2023-01-06T00:00:00Z',
    },
    {
      id: 'D',
      parent_id: 'C',
      type: WorkspaceType.DEFAULT,
      name: 'Nested Workspace D',
      description: 'Description for Workspace D',
      created: '2023-01-07T00:00:00Z',
      updated: '2023-01-08T00:00:00Z',
    },
    {
      id: 'E',
      parent_id: 'C',
      type: WorkspaceType.DEFAULT,
      name: 'Nested Workspace E',
      description: 'Description for Workspace E',
      created: '2023-01-09T00:00:00Z',
      updated: '2023-01-10T00:00:00Z',
    },
  ],
};

describe('ManagedSelector', () => {
  beforeEach(() => {
    cy.viewport(1200, 800);
    cy.intercept('GET', '/api/rbac/v2/workspaces/*', {
      statusCode: 200,
      body: mockListWorkspacesResponse,
    }).as('getWorkspaces');
  });

  it('loads and displays workspaces', () => {
    cy.mount(<ManagedSelector />);

    cy.wait('@getWorkspaces');

    cy.get('.workspace-selector-toggle').should('exist');
    cy.get('.workspace-selector-toggle').click();

    cy.get('#A').should('exist');
    cy.get('#B').should('not.exist');

    cy.get('#A').click();
    cy.get('#D').should('not.exist');
    cy.get('#C').should('exist').click();
    cy.get('#D').should('exist');
  });

  it('can filter workspaces', () => {
    cy.mount(<ManagedSelector />);

    cy.wait('@getWorkspaces');

    cy.get('.workspace-selector-toggle').should('exist');
    cy.get('.workspace-selector-toggle').click();

    cy.get('input[type="text"]').type('Workspace D');

    cy.get('#A').should('exist');
    cy.get('#B').should('not.exist');
    cy.get('#C').should('exist');
    cy.get('#D').should('exist');
    cy.get('#E').should('not.exist');
  });

  it('handles empty workspace data', () => {
    cy.intercept('GET', '/api/rbac/v2/workspaces/*', {
      statusCode: 200,
      body: { data: [] },
    }).as('getEmptyWorkspaces');

    cy.mount(<ManagedSelector />);

    cy.wait('@getEmptyWorkspaces');

    cy.get('.workspace-selector-toggle').should('exist');
    cy.get('.workspace-selector-toggle').click();

    cy.get('[id]').should('not.exist');

    cy.contains('No workspaces to show.').should('exist');
  });
});
