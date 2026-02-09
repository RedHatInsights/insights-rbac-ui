/**
 * CreateWorkspaceWizard - Federated Module Story
 *
 * Smoke test that validates the federated module renders without Storybook's
 * context providers (noWrapping: true).
 *
 * For comprehensive component tests with button/modal interactions, see:
 * Features/Workspaces/CreateWorkspaceWizard
 */

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HttpResponse, delay, http } from 'msw';
import CreateWorkspaceWizard, { type CreateWorkspaceWizardProps } from './CreateWorkspaceWizard';
import { workspaceHandlers } from '../test/msw-handlers';

// Handler for workspace creation
const createWorkspaceHandler = http.post('/api/rbac/v2/workspaces/', async () => {
  await delay(300);
  return HttpResponse.json({
    id: 'new-workspace-123',
    name: 'New Workspace',
    description: 'Created via wizard',
    parent_id: 'workspace-1',
    type: 'standard',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  });
});

const meta: Meta<CreateWorkspaceWizardProps> = {
  title: 'Federated Modules/CreateWorkspaceWizard',
  component: CreateWorkspaceWizard,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    noWrapping: true,
    msw: {
      handlers: [...workspaceHandlers, createWorkspaceHandler],
    },
    docs: {
      description: {
        component: `
## Federated Module Smoke Test

This story validates that \`CreateWorkspaceWizard\` renders as a federated module with \`noWrapping: true\`.

**Note:** This module exports the wizard form directly, not a button to open it.
Consumers are responsible for their own modal/dialog trigger.

### External Consumer Usage

\`\`\`tsx
const [isOpen, setIsOpen] = useState(false);

// Your own trigger
<Button onClick={() => setIsOpen(true)}>Create Workspace</Button>

{isOpen && (
  <AsyncComponent
    scope="rbac"
    module="./modules/CreateWorkspaceWizard"
    afterSubmit={() => setIsOpen(false)}
    onCancel={() => setIsOpen(false)}
    fallback={<Skeleton />}
  />
)}
\`\`\`

### Providers Included

- **QueryClientProvider** - react-query for data fetching
- **ServiceProvider** - axios instance for API calls
- **IntlProvider** - internationalization

**Requires:** A Router in the parent tree (provided by Chrome at runtime).

For comprehensive component tests, see **Features/Workspaces/CreateWorkspaceWizard**.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<CreateWorkspaceWizardProps>;

/** Smoke test - wizard renders with all providers */
export const Default: Story = {
  parameters: {
    docs: {
      story: {
        inline: false,
        height: '900px',
      },
    },
  },
};
