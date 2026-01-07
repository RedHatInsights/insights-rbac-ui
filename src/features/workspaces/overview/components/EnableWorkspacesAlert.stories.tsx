import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import React from 'react';
import { EnableWorkspacesAlert } from './EnableWorkspacesAlert';

interface FeatureFlagContextArgs {
  showEligibleUser: boolean;
  workspacesEnabled: boolean;
}

const meta: Meta<typeof EnableWorkspacesAlert> = {
  component: EnableWorkspacesAlert,
  tags: ['autodocs', 'custom-css'],
  parameters: {
    backgrounds: {
      default: 'console',
    },
    docs: {
      description: {
        component: `
EnableWorkspacesAlert is a specialized alert component that handles the workspaces enablement flow.
It displays an alert with a switch that opens a confirmation modal when toggled.

## 🎯 Purpose

This component guides users through enabling the workspaces feature with:
- Initial alert state with toggle switch
- Confirmation modal with detailed explanation
- Checkbox confirmation requirement
- Success state after confirmation

## 🚩 Feature Flag Context

**IMPORTANT**: This component only appears when specific feature flags are set:

- ✅ \`platform.rbac.workspaces-eligible\` = **true** (user is eligible for workspaces)
- ✅ \`platform.rbac.workspaces\` = **false** (workspaces not yet enabled)

### When Component Appears
| workspaces-eligible | workspaces | Component Shown | Reason |
|-------------------|------------|----------------|---------|
| ❌ false | ❌ false | **No** | User not eligible |
| ❌ false | ✅ true | **No** | User not eligible |
| ✅ true | ❌ false | **✅ Yes** | Eligible user, needs enablement |
| ✅ true | ✅ true | **No** | Already enabled |

This component is the "opt-in" flow for eligible users to enable workspaces.

## 🎨 Design Principles

- **Progressive Disclosure**: Information is revealed step by step
- **Clear Actions**: Each step has obvious next actions
- **Confirmation Pattern**: Requires explicit user confirmation before proceeding
- **Feedback**: Success state shows completion

## 📋 Component States

### Initial State
Shows alert with toggle switch for enabling workspaces.

### Modal State
When switch is toggled, shows detailed confirmation modal with:
- Explanation of workspaces impact
- Required confirmation checkbox
- Confirm/Cancel actions

### Success State
After confirmation, shows success alert instead of initial alert.

## 🔧 Usage Guidelines

### When to Use
- Introducing major feature changes that affect user workflow
- Requiring explicit opt-in for new capabilities
- Providing detailed explanation before proceeding

### When Not to Use
- Simple feature toggles that don't require explanation
- Non-destructive or easily reversible actions
- Features that don't impact existing user data or workflow

## ⚡ Interactions

- **Switch Toggle**: Opens confirmation modal
- **Modal Checkbox**: Enables confirm button
- **Confirm Action**: Closes modal and shows success state
- **Cancel Action**: Closes modal and returns to initial state
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof EnableWorkspacesAlert>;

export const Default: Story = {
  render: () => <EnableWorkspacesAlert />,
};

// Feature Flag Testing Component
const FeatureFlagTestComponent: React.FC<{ showEligibleUser: boolean; workspacesEnabled: boolean }> = ({ showEligibleUser, workspacesEnabled }) => {
  // Simulate the feature flag logic from overview.js: isWorkspacesEligible && !isWorkspacesFlag
  const shouldShowComponent = showEligibleUser && !workspacesEnabled;

  return (
    <div data-testid="feature-flag-test-container">
      <div style={{ marginBottom: '1rem', padding: '1rem', backgroundColor: '#f0f0f0', borderRadius: '4px' }}>
        <h4>🚩 Feature Flag Test</h4>
        <p>
          <strong>platform.rbac.workspaces-eligible:</strong> {showEligibleUser ? '✅ true' : '❌ false'}
        </p>
        <p>
          <strong>platform.rbac.workspaces:</strong> {workspacesEnabled ? '✅ true' : '❌ false'}
        </p>
        <p>
          <strong>Expected:</strong> Component {shouldShowComponent ? 'SHOWN' : 'HIDDEN'}
        </p>
      </div>
      {shouldShowComponent ? (
        <EnableWorkspacesAlert />
      ) : (
        <div data-testid="component-hidden-message" style={{ padding: '2rem', textAlign: 'center', color: '#666', fontStyle: 'italic' }}>
          EnableWorkspacesAlert is hidden (correct behavior)
        </div>
      )}
    </div>
  );
};

export const NotEligibleNotEnabled: StoryObj<FeatureFlagContextArgs> = {
  render: () => <FeatureFlagTestComponent showEligibleUser={false} workspacesEnabled={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Component should NOT be shown (user not eligible)
    await expect(canvas.findByTestId('component-hidden-message')).resolves.toBeInTheDocument();
    await expect(canvas.queryByText('You are qualified to opt into the workspace user access model for your organization.')).not.toBeInTheDocument();
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: '❌ User not eligible, workspaces not enabled → Component HIDDEN',
      },
    },
  },
};

export const NotEligibleButEnabled: StoryObj<FeatureFlagContextArgs> = {
  render: () => <FeatureFlagTestComponent showEligibleUser={false} workspacesEnabled={true} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Component should NOT be shown (user not eligible, even though workspaces enabled)
    await expect(canvas.findByTestId('component-hidden-message')).resolves.toBeInTheDocument();
    await expect(canvas.queryByText('You are qualified to opt into the workspace user access model for your organization.')).not.toBeInTheDocument();
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: '❌ User not eligible, workspaces enabled → Component HIDDEN',
      },
    },
  },
};

export const EligibleNotEnabled: StoryObj<FeatureFlagContextArgs> = {
  render: () => <FeatureFlagTestComponent showEligibleUser={true} workspacesEnabled={false} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Component SHOULD be shown (eligible user, workspaces not enabled)
    await expect(
      canvas.findByText('You are qualified to opt into the workspace user access model for your organization.'),
    ).resolves.toBeInTheDocument();
    await expect(canvas.queryByTestId('component-hidden-message')).not.toBeInTheDocument();

    // Should show the switch (PF6 uses role="switch")
    const switchElement = await canvas.findByRole('switch');
    await expect(switchElement).toBeInTheDocument();
    await expect(switchElement).not.toBeChecked();
  },
  parameters: {
    docs: {
      description: {
        story: '✅ User eligible, workspaces not enabled → Component SHOWN (this is the main use case)',
      },
    },
  },
};

export const EligibleAndEnabled: StoryObj<FeatureFlagContextArgs> = {
  render: () => <FeatureFlagTestComponent showEligibleUser={true} workspacesEnabled={true} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Component should NOT be shown (workspaces already enabled)
    await expect(canvas.findByTestId('component-hidden-message')).resolves.toBeInTheDocument();
    await expect(canvas.queryByText('You are qualified to opt into the workspace user access model for your organization.')).not.toBeInTheDocument();
    await expect(canvas.queryByRole('checkbox')).not.toBeInTheDocument();
  },
  parameters: {
    docs: {
      description: {
        story: '❌ User eligible, workspaces already enabled → Component HIDDEN (no need to show enablement flow)',
      },
    },
  },
};

export const InteractiveDemo: Story = {
  render: () => <EnableWorkspacesAlert />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Initial state should show alert with switch
    await expect(
      canvas.findByText('You are qualified to opt into the workspace user access model for your organization.'),
    ).resolves.toBeInTheDocument();
    const switchElement = await canvas.findByRole('switch');
    await expect(switchElement).toBeInTheDocument();
    await expect(switchElement).not.toBeChecked();

    // Click the switch to open modal
    await userEvent.click(switchElement);

    // Modal should now be visible in document body
    const body = within(document.body);
    await expect(body.getByRole('heading', { name: 'Enable workspaces' })).toBeInTheDocument();

    // Confirm button should be disabled initially
    const confirmButton = body.getByRole('button', { name: 'Confirm' });
    await expect(confirmButton).toBeDisabled();

    // Check the confirmation checkbox
    const checkbox = body.getByRole('checkbox');
    await userEvent.click(checkbox);

    // Confirm button should now be enabled
    await expect(confirmButton).toBeEnabled();

    // Click confirm to complete the flow
    await userEvent.click(confirmButton);

    // Should now show success alert
    await expect(canvas.findByText('Your workspace migration is complete and ready to manage!')).resolves.toBeInTheDocument();
  },
};

export const ModalOpen: Story = {
  name: 'Modal Open (Visual Only)',
  render: () => {
    // This is a visual story only - shows the modal state
    // We can't easily control internal state, so this demonstrates the modal UI
    return (
      <div>
        <EnableWorkspacesAlert />
        <p style={{ marginTop: '16px', fontSize: '14px', color: '#666' }}>💡 Click the switch in the alert above to see the confirmation modal</p>
      </div>
    );
  },
};
