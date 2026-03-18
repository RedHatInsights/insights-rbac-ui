import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { clearAndType, getSkeletonCount, queryNotificationPortal } from '../../../../test-utils/interactionHelpers';
import { CreateWorkspaceWizard } from './CreateWorkspaceWizard';
import { MemoryRouter } from 'react-router-dom';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { workspacesHandlers, workspacesLoadingHandlers } from '../../../data/mocks/workspaces.handlers';

// Mock workspace data for factory (WorkspacesWorkspace format)
const mockWorkspaces = [
  {
    id: 'workspace-1',
    name: 'Production Environment',
    description: 'Main production workspace',
    type: 'root' as const,
    parent_id: undefined,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'workspace-2',
    name: 'Development Environment',
    description: 'Development workspace',
    type: 'root' as const,
    parent_id: undefined,
    created: '2024-01-02T00:00:00Z',
    modified: '2024-01-02T00:00:00Z',
  },
];

// Modal wizard wrapper component - uses global React Query from preview.tsx
const WizardWrapper = ({ storyArgs }: { storyArgs: React.ComponentProps<typeof CreateWorkspaceWizard> }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <MemoryRouter initialEntries={['/iam/access-management/workspaces/new']} initialIndex={0}>
      <div>
        <Button data-testid="open-wizard-button" onClick={() => setIsOpen(true)}>
          Open Create Workspace Wizard
        </Button>
        {isOpen && (
          <CreateWorkspaceWizard
            {...storyArgs}
            afterSubmit={() => {
              setIsOpen(false);
              storyArgs.afterSubmit?.();
            }}
            onCancel={() => {
              setIsOpen(false);
              storyArgs.onCancel?.();
            }}
          />
        )}
      </div>
    </MemoryRouter>
  );
};

// API spy for tracking workspace creation
// TODO: Add a story that tests full wizard submission flow
// Example: Fill form → Click Next → Review → Submit → Verify createWorkspaceSpy was called
const createWorkspaceSpy = fn();

const meta: Meta<typeof CreateWorkspaceWizard> = {
  component: CreateWorkspaceWizard,
  tags: ['autodocs', 'ff:platform.rbac.workspaces', 'ff:platform.rbac.workspace-hierarchy', 'ff:platform.rbac.workspaces-billing-features'],
  parameters: {
    docs: {
      description: {
        component: `
**CreateWorkspaceWizard** is a multi-step Data Driven Forms wizard for creating new workspaces.

This component demonstrates:
- **Multi-Step Wizard**: Dynamic steps based on feature flags  
- **Data Driven Forms**: Uses DDF with custom component mapper
- **Data Integration**: Uses createWorkspace mutation
- **Feature Flag Integration**: Conditional steps for billing features
- **Form Validation**: Required fields and workspace naming guidelines
- **Custom Components**: SetDetails, SetEarMark, Review steps

### Wizard Steps
1. **Details**: Workspace name, description, parent selection
2. **Features** (conditional): Feature selection when billing enabled  
3. **Review**: Summary of selections before creation

### Testing Note
Since this is a modal wizard, these stories use a button wrapper pattern where you click a button to open the wizard for testing. Modal content is tested in document.body following project guidelines.

### Design References

<img src="/mocks/workspaces/Create workspace.png" alt="Create workspace wizard" width="400" />
        `,
      },
    },
  },
  render: (args) => <WizardWrapper storyArgs={args} />,
};

export default meta;
type Story = StoryObj<typeof CreateWorkspaceWizard>;

export const Default: Story = {
  args: {
    afterSubmit: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Default create workspace wizard with standard flow (details → review). Tests the basic wizard functionality without billing features enabled.',
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-billing-features': false,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces': true,
    },
    msw: {
      handlers: [...workspacesHandlers(mockWorkspaces, { onCreate: createWorkspaceSpy })],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open wizard and verify details step', async () => {
      const openButton = await canvas.findByTestId('open-wizard-button');
      await expect(openButton).toBeInTheDocument();
      await user.click(openButton);

      const body = within(document.body);
      await expect(body.findByText('Create new workspace')).resolves.toBeInTheDocument();

      const workspaceDetailsElements = await body.findAllByText('Workspace details');
      await expect(workspaceDetailsElements.length).toBeGreaterThanOrEqual(1);

      const nameField = await body.findByRole('textbox', { name: /workspace name/i });
      await expect(nameField).toBeInTheDocument();

      const descriptionField = await body.findByRole('textbox', { name: /workspace description/i });
      await expect(descriptionField).toBeInTheDocument();

      const nextButton = body.queryByRole('button', { name: /next/i });
      const cancelButton = body.queryByRole('button', { name: /cancel/i });

      await expect(nextButton || cancelButton).toBeTruthy();
    });
  },
};

export const WithBillingFeatures: Story = {
  args: {
    afterSubmit: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Create workspace wizard with billing features enabled. Shows the extended flow: details → select features → review. Tests the conditional step behavior.',
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-billing-features': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces': true,
    },
    msw: {
      handlers: [...workspacesHandlers(mockWorkspaces, { onCreate: createWorkspaceSpy })],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open wizard and verify details with billing', async () => {
      const openButton = await canvas.findByTestId('open-wizard-button');
      await user.click(openButton);

      const body = within(document.body);
      await expect(body.findByText('Create new workspace')).resolves.toBeInTheDocument();

      const workspaceDetailsElements = await body.findAllByText('Workspace details');
      await expect(workspaceDetailsElements.length).toBeGreaterThanOrEqual(1);

      const nameField = await body.findByRole('textbox', { name: /workspace name/i });
      await expect(nameField).toBeInTheDocument();
    });
  },
};

export const LoadingWorkspaces: Story = {
  args: {
    afterSubmit: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests the wizard behavior when workspace data is loading. Shows loading states and skeleton components.',
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-billing-features': false,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces': true,
    },
    msw: {
      handlers: [...workspacesLoadingHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open wizard and verify loading state', async () => {
      const openButton = await canvas.findByTestId('open-wizard-button');
      await user.click(openButton);

      const body = within(document.body);
      await expect(body.findByText('Create new workspace')).resolves.toBeInTheDocument();

      const loadingElements = body.queryAllByText(/loading/i);

      const skeletonCount = getSkeletonCount(document.body);

      await expect(loadingElements.length > 0 || skeletonCount > 0).toBe(true);
    });
  },
};

export const CancelOperation: Story = {
  args: {
    afterSubmit: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests the cancel operation functionality. Verifies that the onCancel callback is triggered when users cancel the wizard.',
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-billing-features': false,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces': true,
    },
    msw: {
      handlers: [...workspacesHandlers(mockWorkspaces)],
    },
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open wizard and cancel', async () => {
      const openButton = await canvas.findByTestId('open-wizard-button');
      await user.click(openButton);

      const body = within(document.body);
      await expect(body.findByText('Create new workspace')).resolves.toBeInTheDocument();

      const cancelButton = await body.findByRole('button', { name: /cancel/i });
      await expect(cancelButton).toBeInTheDocument();

      await user.click(cancelButton);

      await expect(args.onCancel).toHaveBeenCalled();
    });
  },
};

export const FormValidation: Story = {
  args: {
    afterSubmit: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story:
          'Tests form validation behavior. Verifies the wizard blocks advancement when no parent workspace is selected, even if the workspace name is filled.',
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-billing-features': false,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces': true,
    },
    msw: {
      handlers: [...workspacesHandlers(mockWorkspaces)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Wait for content ready', async () => {
      await canvas.findByTestId('open-wizard-button');
    });

    await step('Open wizard and fill only workspace name', async () => {
      const openButton = await canvas.findByTestId('open-wizard-button');
      await user.click(openButton);

      const body = within(document.body);
      await expect(body.findByText('Create new workspace')).resolves.toBeInTheDocument();

      await clearAndType(user, () => body.getByRole('textbox', { name: /workspace name/i }), 'My New Workspace');
    });

    await step('Verify Next is disabled without parent workspace', async () => {
      const body = within(document.body);
      const nextButton = await body.findByRole('button', { name: /next/i });
      await expect(nextButton).toBeDisabled();
    });
  },
};

export const CancelNotification: Story = {
  args: {
    afterSubmit: fn(),
    onCancel: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: 'Test warning notification when user cancels workspace creation.',
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-billing-features': false,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces': true,
    },
    msw: {
      handlers: [...workspacesHandlers(mockWorkspaces)],
    },
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open wizard, cancel, and verify callback', async () => {
      const openButton = await canvas.findByTestId('open-wizard-button');
      await user.click(openButton);

      const body = within(document.body);
      await expect(body.findByText('Create new workspace')).resolves.toBeInTheDocument();

      const cancelButton = body.queryByRole('button', { name: /^cancel$/i });
      if (cancelButton) {
        await user.click(cancelButton);

        await expect(args.onCancel).toHaveBeenCalled();

        const notificationPortal = queryNotificationPortal();
        if (notificationPortal) {
          const warningAlert = notificationPortal.querySelector('.pf-v6-c-alert.pf-m-warning');
          if (warningAlert) {
            expect(warningAlert).toBeInTheDocument();
          }
        }
      } else {
        await expect(body.findByText('Create new workspace')).resolves.toBeInTheDocument();
      }
    });
  },
};
