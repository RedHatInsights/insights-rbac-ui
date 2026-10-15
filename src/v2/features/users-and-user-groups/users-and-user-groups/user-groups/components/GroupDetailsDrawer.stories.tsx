import React, { useRef, useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Card } from '@patternfly/react-core/dist/dynamic/components/Card';
import { CardBody } from '@patternfly/react-core/dist/dynamic/components/Card';

import { GroupDetailsDrawer } from './GroupDetailsDrawer';

const meta: Meta<typeof GroupDetailsDrawer> = {
  component: GroupDetailsDrawer,
  parameters: {
    docs: {
      description: {
        component: `
## GroupDetailsDrawer Architecture

This demonstrates the refactored drawer components following island architecture:

### Pure Presentational Component
- **GroupDetailsDrawer**: Pure UI component that renders drawer structure
- Takes render props for flexible content
- Fully testable in isolation

### Container Component  
- **GroupDetailsContainer**: Manages business logic, tab state, and data flow
- Uses the pure drawer component for presentation
- Handles all user interactions and state management

This separation makes components more maintainable, testable, and reusable.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GroupDetailsDrawer>;

// Interactive example showing drawer with tab functionality
const DrawerExample = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  const renderUsersTab = () => (
    <div style={{ padding: '1rem' }}>
      <h4>Users in Group</h4>
      <p>List of users belonging to the &quot;Administrators&quot; group would appear here.</p>
      <p>• john.doe@example.com</p>
      <p>• admin@example.com</p>
    </div>
  );

  const renderServiceAccountsTab = () => (
    <div style={{ padding: '1rem' }}>
      <h4>Service Accounts</h4>
      <p>Service accounts associated with this group would appear here.</p>
      <p>• rbac-service-account</p>
      <p>• automation-sa</p>
    </div>
  );

  const renderRolesTab = () => (
    <div style={{ padding: '1rem' }}>
      <h4>Assigned Roles</h4>
      <p>Roles assigned to this group would appear here.</p>
      <p>• Administrator</p>
      <p>• User Manager</p>
    </div>
  );

  return (
    <GroupDetailsDrawer
      isOpen={isOpen}
      groupName="Administrators"
      onClose={() => setIsOpen(false)}
      drawerRef={drawerRef}
      ouiaId="group-details-drawer-example"
      activeTabKey={activeTabKey}
      onTabSelect={setActiveTabKey}
      renderUsersTab={renderUsersTab}
      renderServiceAccountsTab={renderServiceAccountsTab}
      renderRolesTab={renderRolesTab}
    >
      <Card>
        <CardBody>
          <h2>User Groups Table</h2>
          <p>Click the button below to open the group details drawer with tabs.</p>
          <Button onClick={() => setIsOpen(true)} disabled={isOpen}>
            View Group Details
          </Button>
        </CardBody>
      </Card>
    </GroupDetailsDrawer>
  );
};

// Drawer with no Edit button (simulates default access group)
const DrawerNoEditExample = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTabKey, setActiveTabKey] = useState<string | number>(0);
  const drawerRef = useRef<HTMLDivElement>(null);

  return (
    <GroupDetailsDrawer
      isOpen={isOpen}
      groupName="Default access"
      onClose={() => setIsOpen(false)}
      drawerRef={drawerRef}
      ouiaId="group-details-drawer-no-edit"
      activeTabKey={activeTabKey}
      onTabSelect={setActiveTabKey}
      renderUsersTab={() => <div style={{ padding: '1rem' }}>Users tab content</div>}
      renderServiceAccountsTab={() => <div style={{ padding: '1rem' }}>Service accounts tab content</div>}
      renderRolesTab={() => <div style={{ padding: '1rem' }}>Assigned roles tab content</div>}
    >
      <Card>
        <CardBody>
          <h2>User Groups Table</h2>
          <p>Click the button below to open the group details drawer without an Edit button.</p>
          <Button onClick={() => setIsOpen(true)} disabled={isOpen}>
            View Default Group Details
          </Button>
        </CardBody>
      </Card>
    </GroupDetailsDrawer>
  );
};

export const DefaultGroupNoEdit: Story = {
  render: () => <DrawerNoEditExample />,
  parameters: {
    docs: {
      description: {
        story: 'Default access groups do not show the Edit button in the drawer. The `onEditGroup` prop is omitted, hiding the pencil icon.',
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open drawer and verify no Edit button', async () => {
      const openButton = await canvas.findByRole('button', { name: /view default group details/i });
      await userEvent.click(openButton);

      await expect(canvas.findByText('Default access')).resolves.toBeInTheDocument();

      // Edit button should NOT be visible
      await expect(canvas.queryByRole('button', { name: /edit user group/i })).not.toBeInTheDocument();

      // Tabs should still be present
      await expect(canvas.findByRole('tab', { name: /users/i })).resolves.toBeInTheDocument();
      await expect(canvas.findByRole('tab', { name: /service accounts/i })).resolves.toBeInTheDocument();
      await expect(canvas.findByRole('tab', { name: /assigned roles/i })).resolves.toBeInTheDocument();
    });
  },
};

export const Default: Story = {
  render: () => <DrawerExample />,
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open drawer and verify content', async () => {
      await expect(await canvas.queryByText('Administrators')).not.toBeInTheDocument();

      const openButton = await canvas.findByRole('button', { name: /view group details/i });
      await userEvent.click(openButton);

      await expect(canvas.findByText('Administrators')).resolves.toBeInTheDocument();

      await expect(canvas.findByRole('tab', { name: /users/i })).resolves.toBeInTheDocument();
      await expect(canvas.findByRole('tab', { name: /service accounts/i })).resolves.toBeInTheDocument();
      await expect(canvas.findByRole('tab', { name: /assigned roles/i })).resolves.toBeInTheDocument();

      await expect(canvas.findByText(/john\.doe@example\.com/)).resolves.toBeInTheDocument();
    });

    await step('Switch to Service Accounts tab', async () => {
      const serviceAccountsTab = await canvas.findByRole('tab', { name: /service accounts/i });
      await userEvent.click(serviceAccountsTab);

      await expect(canvas.findByRole('heading', { name: 'Service Accounts' })).resolves.toBeInTheDocument();
      await expect(canvas.findByText(/rbac-service-account/)).resolves.toBeInTheDocument();

      await expect(await canvas.queryByText(/john\.doe@example\.com/)).not.toBeInTheDocument();
    });

    await step('Switch to Assigned Roles tab', async () => {
      const rolesTab = await canvas.findByRole('tab', { name: /assigned roles/i });
      await userEvent.click(rolesTab);

      await expect(canvas.findByRole('heading', { name: 'Assigned Roles' })).resolves.toBeInTheDocument();
      await expect(canvas.findByText(/User Manager/)).resolves.toBeInTheDocument();
    });
  },
};
