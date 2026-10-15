import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { expect, fn, userEvent, within } from 'storybook/test';
import { clearAndType } from '../../../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS } from '../../../../test-utils/testUtils';
import { CreateWorkspaceWizard } from './CreateWorkspaceWizard';
import { MemoryRouter } from 'react-router-dom';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { workspacesHandlers, workspacesLoadingHandlers } from '../../../data/mocks/workspaces.handlers';
import { DEFAULT_WORKSPACES, WS_PRODUCTION } from '../../../data/mocks/seed';

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

const createWorkspaceSpy = fn();

async function findWizardDialog() {
  const body = within(document.body);
  const dialogs = await body.findAllByRole('dialog', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
  return within(dialogs[dialogs.length - 1]);
}

async function openWizardDialog(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>) {
  const openButton = await canvas.findByTestId('open-wizard-button');
  await user.click(openButton);
  return findWizardDialog();
}

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
- **Custom Components**: SetDetails, SelectParentWorkspace, SetEarMark, Review steps

### Wizard Steps
1. **Details**: Workspace name and description
2. **Select parent**: Full-width tree for parent workspace selection
3. **Features** (conditional): Feature selection when billing enabled  
4. **Review**: Summary of selections before creation

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
          'Default create workspace wizard with standard flow (details → select parent → review). Tests the basic wizard functionality without billing features enabled.',
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-billing-features': false,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces': true,
    },
    msw: {
      handlers: [...workspacesHandlers(DEFAULT_WORKSPACES, { onCreate: createWorkspaceSpy })],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open wizard and verify details step', async () => {
      const wizard = await openWizardDialog(user, canvas);

      const nameField = await wizard.findByRole('textbox', { name: /workspace name/i });
      await expect(nameField).toBeInTheDocument();

      const descriptionField = await wizard.findByRole('textbox', { name: /workspace description/i });
      await expect(descriptionField).toBeInTheDocument();
    });

    await step('Fill details and navigate to parent selection step', async () => {
      const wizard = await findWizardDialog();
      await clearAndType(user, () => wizard.getByRole('textbox', { name: /workspace name/i }), 'Test Workspace');

      const nextButton = await wizard.findByRole('button', { name: /next/i });
      await user.click(nextButton);

      await expect(wizard.findByLabelText(/search workspaces/i)).resolves.toBeInTheDocument();
    });

    await step('Verify tree is visible with workspaces', async () => {
      const wizard = await findWizardDialog();
      await expect(wizard.findByText(WS_PRODUCTION.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).resolves.toBeInTheDocument();
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
          'Create workspace wizard with billing features enabled (`platform.rbac.workspaces-billing-features`). ' +
          'Shows the extended flow: details → select parent → select features → review. ' +
          'Billing account selection is placeholder UI — real implementation depends on Kessel integration ' +
          'for per-workspace billing (CRCPLAN-274, CRCPLAN-367). Currently the Org itself is the billing account for all workspaces.',
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-billing-features': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces': true,
    },
    msw: {
      handlers: [...workspacesHandlers(DEFAULT_WORKSPACES, { onCreate: createWorkspaceSpy })],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open wizard and verify details with billing', async () => {
      const wizard = await openWizardDialog(user, canvas);

      const nameField = await wizard.findByRole('textbox', { name: /workspace name/i });
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
        story: 'Tests the wizard behavior when workspace data is loading. Shows loading states and skeleton components on the parent selection step.',
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

    await step('Open wizard and fill details', async () => {
      await openWizardDialog(user, canvas);
      const wizard = await findWizardDialog();

      await clearAndType(user, () => wizard.getByRole('textbox', { name: /workspace name/i }), 'Loading Test');

      const nextButton = await wizard.findByRole('button', { name: /next/i });
      await user.click(nextButton);
    });

    await step('Verify loading state on parent selection step', async () => {
      const wizard = await findWizardDialog();
      const loadingSpinner = await wizard.findByTestId('workspace-loading', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await expect(loadingSpinner).toBeInTheDocument();
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
      handlers: [...workspacesHandlers(DEFAULT_WORKSPACES)],
    },
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open wizard and cancel', async () => {
      await openWizardDialog(user, canvas);
      const wizard = await findWizardDialog();

      const cancelButton = await wizard.findByRole('button', { name: /cancel/i });
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
          'Tests form validation behavior. Verifies the wizard blocks advancement on the parent selection step when no parent workspace is selected.',
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-billing-features': false,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces': true,
    },
    msw: {
      handlers: [...workspacesHandlers(DEFAULT_WORKSPACES)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open wizard and fill workspace name', async () => {
      await openWizardDialog(user, canvas);
      const wizard = await findWizardDialog();

      await clearAndType(user, () => wizard.getByRole('textbox', { name: /workspace name/i }), 'My New Workspace');
    });

    await step('Navigate to parent selection step', async () => {
      const wizard = await findWizardDialog();
      const nextButton = await wizard.findByRole('button', { name: /next/i });
      await user.click(nextButton);

      await expect(wizard.findByLabelText(/search workspaces/i)).resolves.toBeInTheDocument();
    });

    await step('Verify Next is disabled without parent workspace selected', async () => {
      const wizard = await findWizardDialog();
      const nextButton = await wizard.findByRole('button', { name: /next/i });
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
      handlers: [...workspacesHandlers(DEFAULT_WORKSPACES)],
    },
  },
  play: async ({ canvasElement, args, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Open wizard, cancel, and verify callback', async () => {
      await openWizardDialog(user, canvas);
      const wizard = await findWizardDialog();

      const cancelButton = await wizard.findByRole('button', { name: /^cancel$/i });
      await user.click(cancelButton);

      await expect(args.onCancel).toHaveBeenCalled();
    });
  },
};
