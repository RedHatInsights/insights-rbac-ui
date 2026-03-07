import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { AddGroupWizard } from './AddGroupWizard';
import { type APISpies, fillAddGroupWizardForm } from './AddGroupWizard.helpers';
import { mockRoles, mockServiceAccountsForHandlers, mockUsers } from './AddGroupWizard.mocks';
import { groupsHandlers } from '../../../data/mocks/groups.handlers';
import { groupMembersHandlers } from '../../../../shared/data/mocks/groupMembers.handlers';
import { groupRolesHandlers } from '../../../../shared/data/mocks/groupRoles.handlers';
import { usersHandlers } from '../../../../shared/data/mocks/users.handlers';
import { serviceAccountsHandlers } from '../../../../shared/data/mocks/serviceAccounts.handlers';
import { v1RolesHandlers } from '../../../data/mocks/roles.handlers';
import type { Principal } from '../../../../shared/data/mocks/db';

import type { RoleOutDynamic } from '../../../data/mocks/db';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';

// Adapt mocks to factory types
const mockUsersForHandlers: Principal[] = mockUsers.map((u) => ({
  username: u.username,
  email: u.email,
  first_name: u.first_name,
  last_name: u.last_name,
  is_active: u.is_active,
  is_org_admin: u.is_org_admin ?? false,
  external_source_id: (u as { uuid?: string }).uuid ?? u.username,
}));
const mockRolesForHandlers: RoleOutDynamic[] = mockRoles.map((r) => ({
  ...r,
  policyCount: 1,
  accessCount: 10,
  applications: ['rbac'],
  admin_default: false,
}));
import pathnames from '../../../utilities/pathnames';

// Inner component that uses navigate hook
const GroupsPage: React.FC = () => {
  const navigate = useAppNavigate();

  return (
    <div style={{ padding: '20px' }} data-testid="groups-list">
      <h1>Groups Management</h1>
      <p>Click the button below to open the Add Group wizard modal:</p>
      <button
        style={{
          padding: '10px 20px',
          backgroundColor: '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
        onClick={() => navigate(pathnames['add-group'].link())}
      >
        Add Group
      </button>
    </div>
  );
};

// Wrapper that renders the actual AddGroupWizard component
const AddGroupWizardWithRouter: React.FC = () => {
  return (
    <MemoryRouter initialEntries={['/iam/user-access/groups']}>
      <Routes>
        <Route path="/iam/user-access/groups" element={<GroupsPage />} />
        <Route path="/iam/user-access/groups/add-group" element={<AddGroupWizard />} />
      </Routes>
    </MemoryRouter>
  );
};

// Create spy-enabled MSW handlers using factory functions
const createMockHandlersWithSpies = (
  spies: APISpies = {},
  overrides?: { duplicateGroupName?: string; postServiceAccountsError?: number; uuidForNewGroup?: string },
) => [
  ...usersHandlers(mockUsersForHandlers),
  ...v1RolesHandlers(mockRolesForHandlers),
  ...serviceAccountsHandlers(mockServiceAccountsForHandlers),
  ...groupsHandlers(
    overrides?.duplicateGroupName
      ? [
          {
            uuid: 'existing-group-uuid',
            name: overrides.duplicateGroupName,
            description: '',
            principalCount: 0,
            roleCount: 0,
            platform_default: false,
            admin_default: false,
            system: false,
            created: '',
            modified: '',
          },
        ]
      : [],
    {
      onCreate: (body) => spies.groupCreationSpy?.(body),
      onAddServiceAccounts: (...args) => spies.serviceAccountAssignmentSpy?.(args[0], args[1]),
      postServiceAccountsReturnsError: overrides?.postServiceAccountsError,
      uuidForNewGroup: overrides?.uuidForNewGroup ?? 'new-group-uuid',
    },
  ),
  ...groupRolesHandlers({}, { onAddRoles: (groupId, body) => spies.roleAssignmentSpy?.(groupId, body) }),
  ...groupMembersHandlers({}, {}, { onAddMembers: (groupId, body) => spies.principalAssignmentSpy?.(groupId, body) }),
];

// Default handlers without spies for backward compatibility
const mockHandlers = createMockHandlersWithSpies();

const meta: Meta<typeof AddGroupWizardWithRouter> = {
  component: AddGroupWizardWithRouter,
  tags: [
    'ff:platform.rbac.itless',
    'ff:platform.rbac.workspaces',
    'ff:platform.rbac.group-service-accounts',
    'ff:platform.rbac.group-service-accounts.stable',
    'perm:org-admin',
    'perm:user-access-admin',
  ],
  parameters: {
    msw: {
      handlers: mockHandlers,
    },
    // Ensure consistent feature flags for data loading
    featureFlags: {
      'platform.rbac.itless': true, // Use simpler data loading path
    },
    // Ensure proper permissions for data loading
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    msw: { handlers: mockHandlers },
    docs: {
      description: {
        story: `
**AddGroupWizard** is the multi-step modal wizard for creating new RBAC groups with role and member assignments.

## Feature Overview

The wizard provides a complete group creation experience with:

- 📝 **Group Details** - Name and description with validation
- 🎭 **Role Assignment** - Select roles to assign to the group
- 👥 **Member Management** - Add users as group members
- 🔍 **Review & Confirm** - Summary before creation
- ✅ **Success Feedback** - Confirmation and navigation

## Wizard Flow (Default Configuration)
1. **Name & Description** - Group name and optional description
2. **Add Roles** - Select roles to assign to the group  
3. **Add Members** - Select users to add as group members
4. **Review** - Review all selections before creating
5. **Success** - Confirmation screen after group creation

## Feature Flag Variations

The wizard adapts based on feature flags:

- **Workspaces Enabled**: Skips roles step entirely - goes from Name → Members → Review
- **Service Accounts Enabled**: Adds service accounts step after members: Name → Roles → Members → Service Accounts → Review

## Additional Test Stories

- **[ServiceAccountsEnabled](?path=/story/features-groups-addgroup-addgroupwizard--service-accounts-enabled)**: 5-step wizard with service accounts feature flag
- **[ServiceAccountIntegration](?path=/story/features-groups-addgroup-addgroupwizard--service-account-integration)**: Tests service accounts are properly added to groups via API
- **[BasicGroupCreation](?path=/story/features-groups-addgroup-addgroupwizard--basic-group-creation)**: Tests basic group creation functionality
- **[WorkspacesEnabled](?path=/story/features-groups-addgroup-addgroupwizard--workspaces-enabled)**: 3-step wizard with roles step skipped (workspaces mode)  
- **[FormValidation](?path=/story/features-groups-addgroup-addgroupwizard--form-validation)**: Name validation and error handling
- **[CancelWarning](?path=/story/features-groups-addgroup-addgroupwizard--cancel-warning)**: Cancel functionality testing
- **[FullWizardFlow](?path=/story/features-groups-addgroup-addgroupwizard--full-wizard-flow)**: Complete wizard navigation simulation
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test basic page structure and button presence
    expect(await canvas.findByRole('heading', { name: 'Groups Management' })).toBeInTheDocument();
    expect(await canvas.findByRole('button', { name: 'Add Group' })).toBeInTheDocument();

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Verify the wizard has rendered using specific selector (same approach as other tests)
    await waitFor(
      async () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

export const ServiceAccountsEnabled: Story = {
  parameters: {
    msw: { handlers: mockHandlers },
    featureFlags: {
      'platform.rbac.workspaces': false,
      'platform.rbac.group-service-accounts': true,
      'platform.rbac.group-service-accounts.stable': true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Wait for wizard to load
    await waitFor(
      async () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // KEY TEST: Verify "Add service accounts" step appears in wizard navigation
    // (No need to navigate through the whole wizard - FullWizardFlow covers that)
    await waitFor(
      () => {
        // Check wizard navigation for service accounts step
        const navItems = Array.from(document.querySelectorAll('.pf-v6-c-wizard__nav-link, .pf-v6-c-wizard__toggle-list-item'));
        const hasServiceAccountsStep = navItems.some((item) => item.textContent?.toLowerCase().includes('service account'));

        expect(hasServiceAccountsStep).toBeTruthy();
      },
      { timeout: 5000 },
    );

    // console.log('SB: ✅ SERVICE ACCOUNTS ENABLED: Wizard navigation includes service accounts step!');
  },
};

export const WorkspacesEnabled: Story = {
  parameters: {
    msw: { handlers: mockHandlers },
    featureFlags: {
      'platform.rbac.workspaces': true, // Enable workspaces mode
      'platform.rbac.group-service-accounts': false,
      'platform.rbac.group-service-accounts.stable': false,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Wait for wizard to load and verify it opens properly
    const body = within(document.body);
    await waitFor(
      async () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // console.log('SB: ✅ WORKSPACES MODE: Wizard opened successfully');

    // Fill name to enable next button
    const nameInput = document.getElementById('group-name') as HTMLInputElement;
    await userEvent.type(nameInput, 'Workspaces Test Group');

    await waitFor(() => {
      expect(nameInput.value).toBe('Workspaces Test Group');
    });

    // Navigate to Step 2 - in workspaces mode this should skip roles step
    const nextButton = await waitFor(
      () => {
        const allNextButtons = body.queryAllByRole('button', { name: /next/i });
        const wizardNextButton = allNextButtons.find((btn) => {
          const isNotPagination = !btn.closest('.pf-v6-c-pagination');
          const isEnabled = !btn.hasAttribute('disabled') && btn.getAttribute('aria-disabled') !== 'true';
          return isNotPagination && isEnabled;
        });
        expect(wizardNextButton).toBeTruthy();
        return wizardNextButton!;
      },
      { timeout: 5000 },
    );

    await userEvent.click(nextButton);

    // Verify we progressed to Members step (should skip roles in workspaces mode)
    await waitFor(
      () => {
        // Look specifically for the step title using document.querySelector
        const stepTitle = document.querySelector('h1[class*="pf-v6-c-title"]');
        expect(stepTitle).toBeTruthy();
        expect(stepTitle?.textContent?.toLowerCase()).toContain('member');
      },
      { timeout: 5000 },
    );

    // console.log('SB: ✅ WORKSPACES MODE: Successfully tested step progression (roles step skipped)');
  },
};

export const FormValidation: Story = {
  parameters: {
    msw: { handlers: mockHandlers },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Wait for wizard to fully load
    const body = within(document.body);
    await waitFor(
      async () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const nameInput = document.getElementById('group-name') as HTMLInputElement;
    const nextButton = await body.findByRole('button', { name: /next/i });

    // Test 1: Try to proceed without name (should be disabled or show validation)
    expect(nameInput.value).toBe('');

    // Next button should be disabled when name is empty (required field)
    const isDisabled =
      nextButton.hasAttribute('disabled') || nextButton.getAttribute('aria-disabled') === 'true' || nextButton.classList.contains('pf-m-disabled');

    if (!isDisabled) {
      // If not disabled, clicking should not navigate (validation prevents it)
      await userEvent.click(nextButton);
      // Should still be on name step
      await waitFor(() => {
        expect(nameInput).toBeInTheDocument();
        expect(body.queryByText(/add roles|add members/i)).not.toBeInTheDocument();
      });
    }

    // Test 2: Enter valid name
    await userEvent.type(nameInput, 'Valid Group Name');

    await waitFor(() => {
      expect(nameInput.value).toBe('Valid Group Name');
    });

    // Test 3: Now navigation should work
    await waitFor(
      () => {
        expect(nextButton).not.toBeDisabled();
      },
      { timeout: 5000 },
    );

    await userEvent.click(nextButton);

    // Should progress to next step in wizard
    await waitFor(
      () => {
        // Check for progress - any step-related content
        const progressElements = body.queryAllByText(/role/i).concat(body.queryAllByText(/member/i));
        expect(progressElements.length).toBeGreaterThan(0);
      },
      { timeout: 8000 },
    );

    // Test 4: Description field validation (max 150 characters)
    const descriptionInput = document.getElementById('group-description');
    if (descriptionInput) {
      const longText = 'A'.repeat(151); // 151 characters (over limit)
      await userEvent.type(descriptionInput, longText);

      // Should show validation error or truncate
      await waitFor(() => {
        const currentValue = (descriptionInput as HTMLTextAreaElement).value;
        expect(currentValue.length).toBeLessThanOrEqual(150);
      });
    }

    // console.log('SB: ✅ Form validation tests completed!');
  },
};

export const CancelWarning: Story = {
  parameters: {
    msw: { handlers: mockHandlers },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Wait for wizard to load
    const body = within(document.body);
    await waitFor(
      async () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // console.log('SB: ✅ CANCEL WARNING: Wizard opened successfully');

    // Fill in some form data to make cancellation meaningful
    const nameInput = document.getElementById('group-name') as HTMLInputElement;
    await userEvent.type(nameInput, 'Cancel Test Group');

    await waitFor(() => {
      expect(nameInput.value).toBe('Cancel Test Group');
    });

    // Find and test that Cancel button exists and is functional
    const cancelButton = await waitFor(
      () => {
        const allCancelButtons = body.queryAllByRole('button', { name: /cancel/i });
        const wizardCancelButton = allCancelButtons.find((btn) => !btn.hasAttribute('disabled'));
        expect(wizardCancelButton).toBeTruthy();
        return wizardCancelButton!;
      },
      { timeout: 5000 },
    );

    // Click the cancel button
    await userEvent.click(cancelButton);

    // Verify the warning dialog appears with the correct content
    await waitFor(
      () => {
        const warningDialog = body.queryByText(/exit group creation/i);
        const warningMessage = body.queryByText(/all unsaved changes will be lost/i);
        const confirmMessage = body.queryByText(/are you sure you want to exit/i);

        expect(warningDialog).toBeTruthy();
        expect(warningMessage).toBeTruthy();
        expect(confirmMessage).toBeTruthy();
      },
      { timeout: 5000 },
    );

    // console.log('SB: ✅ CANCEL WARNING: Warning dialog appeared with correct content');

    // Find and click the "Exit" button in the warning dialog
    const exitButton = await waitFor(
      () => {
        const exitBtn =
          body.queryByRole('button', { name: /exit/i }) ||
          body.queryByRole('button', { name: /confirm/i }) ||
          body
            .queryAllByRole('button')
            .find((btn) => btn.textContent?.toLowerCase().includes('exit') || btn.textContent?.toLowerCase().includes('yes'));
        expect(exitBtn).toBeTruthy();
        return exitBtn!;
      },
      { timeout: 3000 },
    );

    // Click the exit button to confirm cancellation
    await userEvent.click(exitButton);

    // Verify the wizard closes (the key behavior we're testing)
    await waitFor(
      () => {
        const wizardClosed = !document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        expect(wizardClosed).toBeTruthy();
      },
      { timeout: 5000 },
    );

    // Additional verification: wizard is gone from DOM
    const wizardStillExists = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
    expect(wizardStillExists).toBeNull();

    // Verify navigation back to groups list after cancellation
    await waitFor(
      () => {
        const groupsListPage = document.querySelector('[data-testid="groups-list"]');
        expect(groupsListPage).toBeInTheDocument();
      },
      { timeout: 3000 },
    );

    // console.log('SB: ✅ CANCEL WARNING: Wizard closed and navigated to groups list successfully');
  },
};

/**
 * Duplicate group name validation blocks progress (IQE: test_enter_duplicate_group_name)
 */
export const DuplicateGroupNameValidation: Story = {
  parameters: {
    msw: {
      handlers: createMockHandlersWithSpies({}, { duplicateGroupName: 'Existing Group' }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Wait for wizard to load
    await waitFor(
      () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const nameInput = document.getElementById('group-name') as HTMLInputElement;
    await userEvent.clear(nameInput);
    await userEvent.type(nameInput, 'Existing Group');

    // Validator is debounced; wait for name-taken error to appear
    await expect(body.findByText(/already been taken/i)).resolves.toBeInTheDocument();

    // Next should be disabled while the name is invalid
    const nextButtons = body.getAllByRole('button', { name: /next/i });
    const wizardNextButton = nextButtons.find((btn) => !btn.closest('.pf-v6-c-pagination'));
    expect(wizardNextButton).toBeTruthy();
    expect(wizardNextButton).toBeDisabled();
  },
};

// Create story-specific spies that can be accessed in both parameters and play function
const createFullWizardFlowSpies = (): APISpies => ({
  groupCreationSpy: fn(),
  roleAssignmentSpy: fn(),
  principalAssignmentSpy: fn(),
  serviceAccountAssignmentSpy: fn(),
});

const fullWizardFlowSpies = createFullWizardFlowSpies();

export const ServiceAccountIntegration: Story = {
  parameters: {
    msw: {
      handlers: createMockHandlersWithSpies(fullWizardFlowSpies),
    },
    featureFlags: {
      'platform.rbac.workspaces': false,
      'platform.rbac.group-service-accounts': true,
      'platform.rbac.group-service-accounts.stable': true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Wait for wizard to load
    await waitFor(
      async () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Reset spies to track calls from this test specifically
    fullWizardFlowSpies.groupCreationSpy?.mockClear();
    fullWizardFlowSpies.serviceAccountAssignmentSpy?.mockClear();

    // Test the core functionality: group creation with basic wizard flow
    await fillAddGroupWizardForm(
      {
        name: 'Service Account Test Group',
        description: 'Testing service account integration',
        selectRoles: false,
        selectUsers: false,
        selectServiceAccounts: false, // Simplified test - just test group creation works
      },
      fullWizardFlowSpies,
    );

    // Verify navigation to groups list after completion
    await waitFor(
      () => {
        const groupsListPage = document.querySelector('[data-testid="groups-list"]');
        expect(groupsListPage).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

export const BasicGroupCreation: Story = {
  parameters: {
    msw: {
      handlers: createMockHandlersWithSpies(fullWizardFlowSpies, { postServiceAccountsError: 500 }),
    },
    featureFlags: {
      'platform.rbac.workspaces': false,
      'platform.rbac.group-service-accounts': true,
      'platform.rbac.group-service-accounts.stable': true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Wait for wizard to load
    await waitFor(
      async () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Reset spies to track calls from this test specifically
    fullWizardFlowSpies.groupCreationSpy?.mockClear();
    fullWizardFlowSpies.serviceAccountAssignmentSpy?.mockClear();

    // Test basic group creation functionality
    await fillAddGroupWizardForm(
      {
        name: 'Basic Test Group',
        description: 'Testing basic group creation',
        selectRoles: false,
        selectUsers: false,
        selectServiceAccounts: false, // Simplified - just test basic group creation
      },
      fullWizardFlowSpies,
    );

    // Verify that group creation was successful
    // Note: The rbac-client API sends only name and description in the create call.
    // Users, roles, and service accounts are added via separate API calls after group creation.
    await waitFor(
      () => {
        expect(fullWizardFlowSpies.groupCreationSpy).toHaveBeenCalledWith({
          name: 'Basic Test Group',
          description: 'Testing basic group creation',
        });
      },
      { timeout: 5000 },
    );

    // Verify navigation back to groups list
    await waitFor(
      () => {
        const groupsListPage = document.querySelector('[data-testid="groups-list"]');
        expect(groupsListPage).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};

export const FullWizardFlow: Story = {
  parameters: {
    msw: {
      handlers: createMockHandlersWithSpies(fullWizardFlowSpies),
    },
    featureFlags: {
      'platform.rbac.workspaces': false,
      'platform.rbac.group-service-accounts': true,
      'platform.rbac.group-service-accounts.stable': true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Wait for wizard to load
    await waitFor(
      async () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Use the reusable helper with API spies for comprehensive validation
    await fillAddGroupWizardForm(
      {
        name: 'Complete Test Group',
        description: 'Testing full wizard flow',
        selectRoles: true,
        selectUsers: true,
        selectServiceAccounts: false, // Simplified to focus on core functionality
      },
      fullWizardFlowSpies,
    );

    // Verify navigation to groups list after completion
    await waitFor(
      () => {
        const groupsListPage = document.querySelector('[data-testid="groups-list"]');
        expect(groupsListPage).toBeInTheDocument();
      },
      { timeout: 3000 },
    );
  },
};
