/* eslint-disable @typescript-eslint/no-namespace */

/* eslint-disable prettier/prettier */
// ***********************************************************
// This example support/component.ts is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

// Import commands.js using ES2015 syntax:
import './commands'
// Patternfly
import '@patternfly/patternfly/patternfly.css';
// Patternfly utilities
import '@patternfly/patternfly/patternfly-addons.css';
import '../../src/App.scss'
import { mount } from 'cypress/react18'
import '@cypress/code-coverage/support'

// Alternatively you can use CommonJS syntax:
// require('./commands')

// Augment the Cypress namespace to include type definitions for
// your custom command.
// Alternatively, can be defined in cypress/support/component.d.ts
// with a <reference path="./component" /> at the top of your spec.
declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    TestApp: any;
  }
  namespace Cypress {
    interface Chainable {
      mount: typeof mount
      matchImageSnapshot: () => void
      login(enableWorkspaces?: boolean): Chainable<void>;
    }
  }
}

Cypress.Commands.add('mount', mount)

// Example use:
// cy.mount(<MyComponent />)
