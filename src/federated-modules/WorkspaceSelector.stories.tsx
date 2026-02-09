/**
 * WorkspaceSelector - Federated Module Story
 *
 * Smoke test that validates the federated module renders without Storybook's
 * context providers (noWrapping: true).
 *
 * For comprehensive component tests, see:
 * Features/Workspaces/Components/ManagedWorkspaceSelector
 */

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import WorkspaceSelector, { type WorkspaceSelectorProps } from './WorkspaceSelector';
import { workspaceHandlers } from '../test/msw-handlers';

const meta: Meta<WorkspaceSelectorProps> = {
  title: 'Federated Modules/WorkspaceSelector',
  component: WorkspaceSelector,
  tags: ['autodocs'],
  parameters: {
    noWrapping: true,
    msw: {
      handlers: workspaceHandlers,
    },
    docs: {
      description: {
        component: `
## Federated Module Smoke Test

This story validates that \`WorkspaceSelector\` renders as a federated module.

### External Consumer Usage

\`\`\`tsx
<AsyncComponent
  scope="rbac"
  module="./modules/WorkspaceSelector"
  onSelect={handleSelect}
  fallback={<Skeleton />}
/>
\`\`\`

### Providers Included

- **QueryClientProvider** - react-query for data fetching
- **ServiceProvider** - axios instance for API calls
- **IntlProvider** - internationalization

For comprehensive component tests, see **Features/Workspaces/Components/ManagedWorkspaceSelector**.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<WorkspaceSelectorProps>;

/** Smoke test - selector renders with all providers */
export const Default: Story = {
  parameters: {
    docs: {
      story: {
        height: '500px',
      },
    },
  },
};
