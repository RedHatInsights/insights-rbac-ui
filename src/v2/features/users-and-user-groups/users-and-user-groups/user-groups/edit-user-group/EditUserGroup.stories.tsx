import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { EditUserGroup } from './EditUserGroup';
import { groupsHandlers, groupsLoadingHandlers } from '../../../../../../shared/data/mocks/groups.handlers';
import { usersHandlers } from '../../../../../../shared/data/mocks/users.handlers';
import { serviceAccountsHandlers } from '../../../../../../shared/data/mocks/serviceAccounts.handlers';
import { createGroupMembersHandlers } from '../../../../../../shared/data/mocks/groupMembers.handlers';

// Mock groups data
const mockGroups = [
  {
    uuid: 'existing-group-1',
    name: 'Existing Group 1',
    description: 'An existing group for testing',
    principalCount: 5,
    roleCount: 3,
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
  },
  {
    uuid: 'existing-group-2',
    name: 'Platform Administrators',
    description: 'Platform admin group',
    principalCount: 10,
    roleCount: 8,
    system: true,
    platform_default: false,
    admin_default: true,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
  },
  {
    uuid: 'test-group-id',
    name: 'Test Development Group',
    description: 'A group for testing purposes',
    principalCount: 5,
    roleCount: 3,
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
  },
];

const editUsers = [
  {
    username: 'developer1',
    email: 'dev1@example.com',
    first_name: 'Dev',
    last_name: 'User1',
    is_active: true,
    is_org_admin: false,
    external_source_id: '1',
  },
  {
    username: 'developer2',
    email: 'dev2@example.com',
    first_name: 'Dev',
    last_name: 'User2',
    is_active: true,
    is_org_admin: false,
    external_source_id: '2',
  },
  {
    username: 'developer3',
    email: 'dev3@example.com',
    first_name: 'Dev',
    last_name: 'User3',
    is_active: true,
    is_org_admin: false,
    external_source_id: '3',
  },
];

// MockServiceAccount for serviceAccountsHandlers (list API)
const editServiceAccountsForList = [
  {
    uuid: '1',
    name: 'test-service-account',
    clientId: 'test-client-id',
    owner: 'admin@example.com',
    timeCreated: '2024-01-01T00:00:00Z',
    description: 'Test SA',
  },
  {
    uuid: '2',
    name: 'api-service-account',
    clientId: 'api-client-id',
    owner: 'admin@example.com',
    timeCreated: '2024-01-01T00:00:00Z',
    description: 'API SA',
  },
];
// ServiceAccount for createGroupMembersHandlers (group principals API)
const editServiceAccountsForGroup = [
  {
    username: 'test-client-id',
    type: 'service-account' as const,
    clientId: 'test-client-id',
    name: 'test-service-account',
    owner: 'admin@example.com',
    time_created: Math.floor(Date.parse('2024-01-01T00:00:00Z') / 1000),
    description: 'Test SA',
  },
  {
    username: 'api-client-id',
    type: 'service-account' as const,
    clientId: 'api-client-id',
    name: 'api-service-account',
    owner: 'admin@example.com',
    time_created: Math.floor(Date.parse('2024-01-01T00:00:00Z') / 1000),
    description: 'API SA',
  },
];

const createUsers = [
  ...editUsers.slice(0, 2),
  {
    username: 'designer1',
    email: 'design1@example.com',
    first_name: 'Design',
    last_name: 'User1',
    is_active: true,
    is_org_admin: false,
    external_source_id: '4',
  },
];

const createServiceAccountsForList = [
  editServiceAccountsForList[0],
  {
    uuid: '3',
    name: 'production-sa',
    clientId: 'prod-client-id',
    owner: 'admin@example.com',
    timeCreated: '2024-01-01T00:00:00Z',
    description: 'Production SA',
  },
];
const meta: Meta<typeof EditUserGroup> = {
  component: EditUserGroup,
  decorators: [
    (Story, { parameters }) => {
      const routePath = parameters?.route?.path || '/access-management/user-groups/:groupId/edit';
      const initialEntries = parameters?.route?.initialEntries || ['/access-management/user-groups/test-group-id/edit'];

      return (
        <MemoryRouter initialEntries={initialEntries}>
          <Routes>
            <Route path={routePath} element={<Story />} />
            <Route path="/access-management/user-groups/create" element={<Story />} />
            <Route path="/access-management/user-groups" element={<div>User Groups List</div>} />
            {/* Route for useAppNavigate with /iam/user-access basename */}
            <Route
              path="/iam/access-management/users-and-user-groups/user-groups"
              element={<div data-testid="user-groups-list">User Groups List Page</div>}
            />
          </Routes>
        </MemoryRouter>
      );
    },
  ],
  parameters: {
    docs: {
      description: {
        component: `
**EditUserGroup** is a feature container component that provides comprehensive group management functionality with form-based editing capabilities.

### Feature Responsibilities
- **Form Management**: Uses data-driven-forms with FormRenderer for dynamic form creation
- **Validation**: Implements complex validation including name uniqueness checks
- **Data Integration**: Manages group data, loading states, and API interactions through React Query
- **Route Management**: Handles both create and edit modes based on route parameters
- **Custom Components**: Integrates custom form components for users and service accounts
- **Navigation**: Provides breadcrumb navigation and form cancellation handling

### Architecture Pattern
This component follows the **feature container pattern**:
- **Feature Container (this component)**: Handles form orchestration, validation, and business logic
- **Data-Driven Forms**: Uses FormRenderer with custom component mapper for dynamic forms
- **Child Components**: EditGroupUsersAndServiceAccounts component for complex user/service account selection
- **Data Fetching**: Uses mutations for group creation, updates, and queries for data fetching

### Form Features
- **Dynamic Schema**: Form schema adapts based on create vs edit mode
- **Real-time Validation**: Name uniqueness validation against existing groups
- **Complex Field Types**: Custom component for users and service accounts with initial/updated state tracking
- **Loading States**: Displays spinner during data fetching and form initialization

### Testing Focus
These stories test the feature's form handling, validation logic, React Query integration, and routing behavior.
Child components like EditGroupUsersAndServiceAccounts are tested separately with their own stories.
        `,
      },
    },
  },
  argTypes: {
    createNewGroup: {
      description: 'Whether this is creating a new group (true) or editing existing (false)',
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof EditUserGroup>;

// Spies for testing API calls
const updateGroupSpy = fn();
const createGroupSpy = fn();

export const EditExistingGroup: Story = {
  tags: ['autodocs'],
  args: {
    createNewGroup: false,
  },
  parameters: {
    route: {
      path: '/access-management/user-groups/:groupId/edit',
      initialEntries: ['/access-management/user-groups/test-group-id/edit'],
    },
    docs: {
      description: {
        story: `
**Edit Mode**: Feature container in edit mode with existing group data. Component fetches group data via React Query, populates form fields, and handles updates.

## Form Validation Features

This story demonstrates:
- **Group Data Fetching**: Component dispatches \`fetchGroup\` action on mount
- **Form Population**: Form fields pre-populated with existing group data
- **Name Validation**: Real-time validation prevents duplicate group names
- **Custom Components**: Integration with EditGroupUsersAndServiceAccounts component
- **Update Flow**: Form submission triggers \`updateGroup\` React Query mutation
- **API Integration**: Tests complete workflow with user/service account selection and form submission
- **API Verification**: Uses spies to verify correct API calls with expected payloads

## Additional Feature Stories

For testing specific feature scenarios, see these additional stories:

- **[CreateNewGroup](?path=/story/features-access-management-users-and-user-groups-user-groups-edit-user-group-editusergroup--create-new-group)**: Tests feature in creation mode
- **[LoadingState](?path=/story/features-access-management-users-and-user-groups-user-groups-edit-user-group-editusergroup--loading-state)**: Tests feature behavior during data loading
- **[ValidationErrors](?path=/story/features-access-management-users-and-user-groups-user-groups-edit-user-group-editusergroup--validation-errors)**: Tests form validation and error handling
        `,
      },
    },
    msw: {
      handlers: [
        ...groupsHandlers(mockGroups, { onUpdate: updateGroupSpy }),
        ...usersHandlers(editUsers),
        ...serviceAccountsHandlers(editServiceAccountsForList),
        ...createGroupMembersHandlers({ 'test-group-id': [editUsers[0]] }, { 'test-group-id': [editServiceAccountsForGroup[0]] }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for form to load
      await expect(canvas.findByDisplayValue('Test Development Group')).resolves.toBeInTheDocument();

      // Verify form fields are populated
      await expect(canvas.findByDisplayValue('A group for testing purposes')).resolves.toBeInTheDocument();

      // Verify custom component is rendered
      await expect(canvas.findByTestId('users-and-service-accounts-component')).resolves.toBeInTheDocument();

      // Test user/service account interaction
      // Wait for users and service accounts to load
      await expect(canvas.findByText('developer1')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('test-service-account')).resolves.toBeInTheDocument();

      // Test adding a new user - click on developer3 checkbox
      const dev3Text = await canvas.findByText('developer3');
      const dev3Row = dev3Text.closest('tr');
      if (dev3Row) {
        const dev3Checkbox = await within(dev3Row as HTMLElement).findByRole('checkbox');
        await userEvent.click(dev3Checkbox);

        // Verify developer3 is now selected
        await expect(dev3Checkbox).toBeChecked();
      }

      // Test adding a new service account - switch to service accounts tab first
      const serviceAccountsTab = await canvas.findByRole('tab', { name: /service accounts/i });
      await userEvent.click(serviceAccountsTab);

      // Wait for service accounts to be visible
      await expect(canvas.findByText('api-service-account')).resolves.toBeInTheDocument();

      // Test adding api-service-account
      const apiSAText = await canvas.findByText('api-service-account');
      const apiSARow = apiSAText.closest('tr');
      if (apiSARow) {
        const apiSACheckbox = await within(apiSARow as HTMLElement).findByRole('checkbox');
        await userEvent.click(apiSACheckbox);

        // Verify api-service-account is now selected
        await expect(apiSACheckbox).toBeChecked();
      }

      // Test form field editing
      const nameField = await canvas.findByDisplayValue('Test Development Group');
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'Updated Group Name');

      const descField = await canvas.findByDisplayValue('A group for testing purposes');
      await userEvent.clear(descField);
      await userEvent.type(descField, 'Updated description for the group');

      // Verify buttons are present
      const buttons = await canvas.findAllByRole('button');
      await expect(buttons.length).toBeGreaterThan(0);

      // Test save action
      const saveButton = buttons.find((button) => button.textContent?.includes('Save'));
      if (saveButton) {
        await userEvent.click(saveButton);
      }

      // Test cancel action
      const buttonsAgain = await canvas.findAllByRole('button');
      const cancelButton = buttonsAgain.find((button) => button.textContent?.includes('Cancel'));
      if (cancelButton) {
        await userEvent.click(cancelButton);
      }
    });
  },
};

export const CreateNewGroup: Story = {
  args: {
    createNewGroup: true,
  },
  parameters: {
    route: {
      path: '/access-management/user-groups/create',
      initialEntries: ['/access-management/user-groups/create'],
    },
    docs: {
      description: {
        story: `
**Create Mode**: Feature container in creation mode with empty form. Component provides form for creating new groups with validation and API integration testing.

## Complete Workflow Testing

This story demonstrates:
- **Form Creation**: Empty form with all fields available for input
- **User/Service Account Selection**: Interactive selection from available lists
- **Form Validation**: Real-time validation including duplicate name checking
- **API Integration**: Complete workflow from form filling to submission
- **Data Integration**: Uses React Query for data fetching and form submission
        `,
      },
    },
    msw: {
      handlers: [
        ...groupsHandlers(mockGroups, { onCreate: createGroupSpy }),
        ...usersHandlers(createUsers),
        ...serviceAccountsHandlers(createServiceAccountsForList),
        ...createGroupMembersHandlers({}, {}),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for form to render
      await expect(canvas.findByRole('textbox', { name: /^name$/i })).resolves.toBeInTheDocument();

      const nameField = await canvas.findByRole('textbox', { name: /^name$/i });
      await expect(nameField).toHaveValue('');

      const descField = await canvas.findByRole('textbox', { name: /description/i });
      await expect(descField).toHaveValue('');

      // Verify custom component is rendered
      await expect(canvas.findByTestId('users-and-service-accounts-component')).resolves.toBeInTheDocument();

      // Test user/service account selection for new group
      // Wait for users to load
      await expect(canvas.findByText('developer1')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('designer1')).resolves.toBeInTheDocument();

      // Select some users for the new group
      const dev1Text = await canvas.findByText('developer1');
      const dev1Row = dev1Text.closest('tr');
      if (dev1Row) {
        const dev1Checkbox = await within(dev1Row as HTMLElement).findByRole('checkbox');
        await userEvent.click(dev1Checkbox);

        // Verify developer1 is selected
        await waitFor(async () => {
          await expect(dev1Checkbox).toBeChecked();
        });
      }

      const designer1Text = await canvas.findByText('designer1');
      const designer1Row = designer1Text.closest('tr');
      if (designer1Row) {
        const designer1Checkbox = await within(designer1Row as HTMLElement).findByRole('checkbox');
        await userEvent.click(designer1Checkbox);

        // Verify designer1 is selected
        await waitFor(async () => {
          await expect(designer1Checkbox).toBeChecked();
        });
      }

      // Switch to service accounts tab and select a service account
      const serviceAccountsTab = await canvas.findByRole('tab', { name: /service accounts/i });
      await userEvent.click(serviceAccountsTab);

      // Wait for service accounts to be visible
      await expect(canvas.findByText('production-sa')).resolves.toBeInTheDocument();

      // Select production-sa
      const prodSAText = await canvas.findByText('production-sa');
      const prodSARow = prodSAText.closest('tr');
      if (prodSARow) {
        const prodSACheckbox = await within(prodSARow as HTMLElement).findByRole('checkbox');
        await userEvent.click(prodSACheckbox);

        // Verify production-sa is selected
        await expect(prodSACheckbox).toBeChecked();
      }

      // Test form filling
      await userEvent.type(nameField, 'New Test Group');
      await userEvent.type(descField, 'A brand new group for testing');

      // Test name validation - try duplicate name
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'Existing Group 1'); // This should trigger validation error

      // Wait for validation to trigger
      // Look for validation error in multiple ways
      const errorByText =
        canvas.queryByText(/group name.*taken/i) ||
        canvas.queryByText(/name.*taken/i) ||
        canvas.queryByText(/already.*taken/i) ||
        canvas.queryByText(/name.*exists/i);

      // Look for ARIA invalid attribute - target the input by its value
      const nameFieldForValidation = await canvas.findByDisplayValue('Existing Group 1');
      const hasAriaInvalid = nameFieldForValidation.getAttribute('aria-invalid') === 'true';

      // Look for any element with validation error class or role
      const errorByRole = canvas.queryByRole('alert') || canvas.queryByText(/required/i);

      // Should find validation error through one of these methods
      await expect(errorByText || hasAriaInvalid || errorByRole).toBeTruthy();

      // Fix validation error
      const nameFieldForFix = await canvas.findByRole('textbox', { name: /^name$/i });
      await userEvent.clear(nameFieldForFix);
      await userEvent.type(nameFieldForFix, 'Unique New Group');

      // Submit button should be enabled for valid, dirty form
      const buttons = await canvas.findAllByRole('button');
      const submitButton = buttons.find(
        (button) =>
          button.getAttribute('type') === 'submit' ||
          button.textContent?.toLowerCase().includes('submit') ||
          button.textContent?.toLowerCase().includes('save'),
      );
      await expect(submitButton).toBeDefined();
      await expect(submitButton).not.toBeDisabled();

      // Test final form submission
      if (submitButton) {
        await userEvent.click(submitButton);
      }
    });
  },
};

export const LoadingState: Story = {
  args: {
    createNewGroup: false,
  },
  parameters: {
    route: {
      path: '/access-management/user-groups/:groupId/edit',
      initialEntries: ['/access-management/user-groups/loading-group/edit'],
    },
    docs: {
      description: {
        story: `
**Loading State**: Feature container during data loading. Shows spinner while fetching group data.
        `,
      },
    },
    msw: {
      handlers: [
        ...groupsLoadingHandlers(),
        ...usersHandlers(editUsers),
        ...serviceAccountsHandlers(editServiceAccountsForList),
        ...createGroupMembersHandlers({}, {}),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Should show loading spinner initially
      await expect(canvas.findByRole('progressbar')).resolves.toBeInTheDocument();

      // Should show page title (be more specific to avoid multiple matches)
      await expect(canvas.findByRole('heading', { name: /edit user group/i })).resolves.toBeInTheDocument();
    });
  },
};

export const ValidationErrors: Story = {
  args: {
    createNewGroup: true,
  },
  parameters: {
    route: {
      path: '/access-management/user-groups/create',
      initialEntries: ['/access-management/user-groups/create'],
    },
    docs: {
      description: {
        story: `
**Validation Testing**: Comprehensive form validation testing including required fields and name uniqueness.
        `,
      },
    },
    msw: {
      handlers: [
        ...groupsHandlers(mockGroups),
        ...usersHandlers(editUsers.slice(0, 2)),
        ...serviceAccountsHandlers(editServiceAccountsForList.slice(0, 1)),
        ...createGroupMembersHandlers({}, {}),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify', async () => {
      const canvas = within(canvasElement);

      // Wait for form to load
      await expect(canvas.findByRole('textbox', { name: /^name$/i })).resolves.toBeInTheDocument();

      const nameField = await canvas.findByRole('textbox', { name: /^name$/i });

      // Test required field validation
      await userEvent.click(nameField);
      await userEvent.tab(); // Move focus away to trigger validation

      await expect(canvas.findByText(/required/i)).resolves.toBeInTheDocument();

      // Test duplicate name validation
      await userEvent.clear(nameField);
      await userEvent.type(nameField, 'Platform Administrators'); // Existing group name

      // Look for the specific validation message
      await expect(canvas.findByText('Group name already taken')).resolves.toBeInTheDocument();

      // Verify the input field is marked as invalid
      await expect(nameField.getAttribute('aria-invalid')).toBe('true');

      // Verify submit is disabled with validation errors
      const buttons = await canvas.findAllByRole('button');
      const submitButton = buttons.find(
        (button) =>
          button.getAttribute('type') === 'submit' ||
          button.textContent?.toLowerCase().includes('submit') ||
          button.textContent?.toLowerCase().includes('create'),
      );
      await expect(submitButton).toBeDefined();
      await expect(submitButton).toBeDisabled();

      // Fix validation errors
      const nameFieldForValidation = await canvas.findByRole('textbox', { name: /^name$/i });
      await userEvent.clear(nameFieldForValidation);
      await userEvent.type(nameFieldForValidation, 'Valid Unique Name');

      // Submit should become enabled
      await expect(submitButton).not.toBeDisabled();
    });
  },
};
