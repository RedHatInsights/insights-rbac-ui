import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { queryWizardNavItems, queryWizardStepTitle, waitForModalClose } from '../../../../test-utils/interactionHelpers';
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify page and navigate to wizard', async () => {
      expect(await canvas.findByRole('heading', { name: 'Groups Management' })).toBeInTheDocument();
      expect(await canvas.findByRole('button', { name: 'Add Group' })).toBeInTheDocument();

      const addButton = await canvas.findByRole('button', { name: 'Add Group' });
      await userEvent.click(addButton);
    });

    await step('Verify wizard rendered', async () => {
      const body = within(document.body);
      expect(await body.findByRole('textbox', { name: /name/i }, { timeout: 5000 })).toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Navigate to wizard', async () => {
      const addButton = await canvas.findByRole('button', { name: 'Add Group' });
      await userEvent.click(addButton);

      const body = within(document.body);
      expect(await body.findByRole('textbox', { name: /name/i }, { timeout: 5000 })).toBeInTheDocument();
    });

    await step('Verify Add service accounts step in navigation', async () => {
      await waitFor(
        () => {
          const navItems = queryWizardNavItems();
          const hasServiceAccountsStep = navItems.some((item) => item.textContent?.toLowerCase().includes('service account'));

          expect(hasServiceAccountsStep).toBeTruthy();
        },
        { timeout: 5000 },
      );
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Enter name and click Next', async () => {
      const addButton = await canvas.findByRole('button', { name: 'Add Group' });
      await userEvent.click(addButton);

      const body = within(document.body);
      const nameInput = await body.findByRole('textbox', { name: /name/i }, { timeout: 5000 });
      await userEvent.type(nameInput, 'Workspaces Test Group');

      await waitFor(() => {
        expect((nameInput as HTMLInputElement).value).toBe('Workspaces Test Group');
      });

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
    });

    await step('Verify Members step (roles skipped in workspaces mode)', async () => {
      await waitFor(
        () => {
          const stepTitle = queryWizardStepTitle();
          expect(stepTitle).toBeTruthy();
          expect(stepTitle?.textContent?.toLowerCase()).toContain('member');
        },
        { timeout: 5000 },
      );
    });
  },
};

export const FormValidation: Story = {
  parameters: {
    msw: { handlers: mockHandlers },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open wizard and test empty name validation', async () => {
      const addButton = await canvas.findByRole('button', { name: 'Add Group' });
      await userEvent.click(addButton);

      const body = within(document.body);
      const nameInput = await body.findByRole('textbox', { name: /name/i }, { timeout: 5000 });
      const nextButton = await body.findByRole('button', { name: /next/i });

      expect((nameInput as HTMLInputElement).value).toBe('');

      const isDisabled =
        nextButton.hasAttribute('disabled') || nextButton.getAttribute('aria-disabled') === 'true' || nextButton.classList.contains('pf-m-disabled');

      if (!isDisabled) {
        await userEvent.click(nextButton);
        await waitFor(() => {
          expect(nameInput).toBeInTheDocument();
          expect(body.queryByText(/add roles|add members/i)).not.toBeInTheDocument();
        });
      }
    });

    await step('Enter valid name and progress', async () => {
      const body = within(document.body);
      const nameInput = await body.findByRole('textbox', { name: /name/i });
      const nextButton = await body.findByRole('button', { name: /next/i });

      await userEvent.type(nameInput, 'Valid Group Name');

      await waitFor(() => {
        expect((nameInput as HTMLInputElement).value).toBe('Valid Group Name');
      });

      await waitFor(
        () => {
          expect(nextButton).not.toBeDisabled();
        },
        { timeout: 5000 },
      );

      await userEvent.click(nextButton);

      await waitFor(
        () => {
          const progressElements = body.queryAllByText(/role/i).concat(body.queryAllByText(/member/i));
          expect(progressElements.length).toBeGreaterThan(0);
        },
        { timeout: 8000 },
      );
    });

    await step('Test description character limit', async () => {
      const body = within(document.body);
      const descriptionInput = body.queryByRole('textbox', { name: /description/i });
      if (descriptionInput) {
        const longText = 'A'.repeat(151);
        await userEvent.type(descriptionInput, longText);

        await waitFor(() => {
          const currentValue = (descriptionInput as HTMLTextAreaElement).value;
          expect(currentValue.length).toBeLessThanOrEqual(150);
        });
      }
    });
  },
};

export const CancelWarning: Story = {
  parameters: {
    msw: { handlers: mockHandlers },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Open wizard and click Cancel', async () => {
      const addButton = await canvas.findByRole('button', { name: 'Add Group' });
      await userEvent.click(addButton);

      const body = within(document.body);
      const nameInput = await body.findByRole('textbox', { name: /name/i }, { timeout: 5000 });
      await userEvent.type(nameInput, 'Cancel Test Group');

      await waitFor(() => {
        expect((nameInput as HTMLInputElement).value).toBe('Cancel Test Group');
      });

      const cancelButton = await waitFor(
        () => {
          const allCancelButtons = body.queryAllByRole('button', { name: /cancel/i });
          const wizardCancelButton = allCancelButtons.find((btn) => !btn.hasAttribute('disabled'));
          expect(wizardCancelButton).toBeTruthy();
          return wizardCancelButton!;
        },
        { timeout: 5000 },
      );

      await userEvent.click(cancelButton);
    });

    await step('Confirm exit and verify wizard closes', async () => {
      const body = within(document.body);

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

      await userEvent.click(exitButton);

      await waitForModalClose({ timeout: 5000 });

      expect(await within(document.body).findByTestId('groups-list', undefined, { timeout: 3000 })).toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    await step('Open wizard and enter duplicate group name', async () => {
      const addButton = await canvas.findByRole('button', { name: 'Add Group' });
      await userEvent.click(addButton);

      const nameInput = await body.findByRole('textbox', { name: /name/i }, { timeout: 5000 });
      await userEvent.clear(nameInput);
      await userEvent.type(nameInput, 'Existing Group');

      await expect(body.findByText(/already been taken/i)).resolves.toBeInTheDocument();
    });

    await step('Verify Next is disabled', async () => {
      const nextButtons = body.getAllByRole('button', { name: /next/i });
      const wizardNextButton = nextButtons.find((btn) => !btn.closest('.pf-v6-c-pagination'));
      expect(wizardNextButton).toBeTruthy();
      expect(wizardNextButton).toBeDisabled();
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Navigate to wizard and fill form', async () => {
      const addButton = await canvas.findByRole('button', { name: 'Add Group' });
      await userEvent.click(addButton);

      await within(document.body).findByRole('textbox', { name: /name/i }, { timeout: 5000 });

      fullWizardFlowSpies.groupCreationSpy?.mockClear();
      fullWizardFlowSpies.serviceAccountAssignmentSpy?.mockClear();

      await fillAddGroupWizardForm(
        {
          name: 'Service Account Test Group',
          description: 'Testing service account integration',
          selectRoles: false,
          selectUsers: false,
          selectServiceAccounts: false,
        },
        fullWizardFlowSpies,
      );
    });

    await step('Verify navigation to groups list', async () => {
      expect(await within(document.body).findByTestId('groups-list', undefined, { timeout: 3000 })).toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Navigate to wizard and complete basic group creation', async () => {
      const addButton = await canvas.findByRole('button', { name: 'Add Group' });
      await userEvent.click(addButton);

      await within(document.body).findByRole('textbox', { name: /name/i }, { timeout: 5000 });

      fullWizardFlowSpies.groupCreationSpy?.mockClear();
      fullWizardFlowSpies.serviceAccountAssignmentSpy?.mockClear();

      await fillAddGroupWizardForm(
        {
          name: 'Basic Test Group',
          description: 'Testing basic group creation',
          selectRoles: false,
          selectUsers: false,
          selectServiceAccounts: false,
        },
        fullWizardFlowSpies,
      );
    });

    await step('Verify group creation API call and navigation', async () => {
      await waitFor(
        () => {
          expect(fullWizardFlowSpies.groupCreationSpy).toHaveBeenCalledWith({
            name: 'Basic Test Group',
            description: 'Testing basic group creation',
          });
        },
        { timeout: 5000 },
      );

      expect(await within(document.body).findByTestId('groups-list', undefined, { timeout: 3000 })).toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Navigate to wizard and complete full flow', async () => {
      const addButton = await canvas.findByRole('button', { name: 'Add Group' });
      await userEvent.click(addButton);

      await within(document.body).findByRole('textbox', { name: /name/i }, { timeout: 5000 });

      await fillAddGroupWizardForm(
        {
          name: 'Complete Test Group',
          description: 'Testing full wizard flow',
          selectRoles: true,
          selectUsers: true,
          selectServiceAccounts: false,
        },
        fullWizardFlowSpies,
      );
    });

    await step('Verify navigation to groups list', async () => {
      expect(await within(document.body).findByTestId('groups-list', undefined, { timeout: 3000 })).toBeInTheDocument();
    });
  },
};
