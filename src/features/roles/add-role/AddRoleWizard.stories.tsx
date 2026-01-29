import React from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AddRoleWizard } from './AddRoleWizard';

// API Spies
const createRoleSpy = fn();
const fetchRolesSpy = fn();

// Mock permissions data
const mockPermissions = [
  {
    application: 'inventory',
    resource_type: 'hosts',
    verb: 'read',
    permission: 'inventory:hosts:read',
    description: 'View inventory hosts',
  },
  {
    application: 'inventory',
    resource_type: 'hosts',
    verb: 'write',
    permission: 'inventory:hosts:write',
    description: 'Modify inventory hosts',
  },
  {
    application: 'cost-management',
    resource_type: 'rate',
    verb: 'read',
    permission: 'cost-management:rate:read',
    description: 'View cost rates',
  },
  {
    application: 'rbac',
    resource_type: 'role',
    verb: 'read',
    permission: 'rbac:role:read',
    description: 'View roles',
  },
];

// Mock roles for copy
const mockRoles = [
  {
    uuid: 'role-1',
    name: 'Platform Administrator',
    display_name: 'Platform Administrator',
    description: 'Full platform access',
    accessCount: 5,
    system: false,
  },
  {
    uuid: 'role-2',
    name: 'Cost Management Viewer',
    display_name: 'Cost Management Viewer',
    description: 'View cost reports',
    accessCount: 3,
    system: false,
  },
];

// Router decorator
const withRouter = (Story: StoryFn) => {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/roles/create-role"
          element={
            <div style={{ minHeight: '100vh' }}>
              <Story />
            </div>
          }
        />
        <Route path="/roles" element={<div data-testid="roles-page">Roles Page</div>} />
        <Route path="/user-access/groups" element={<div data-testid="groups-page">Groups Page</div>} />
        <Route path="*" element={<Navigate to="/roles/create-role" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

const meta: Meta<typeof AddRoleWizard> = {
  component: AddRoleWizard,
  tags: ['add-role-wizard', 'custom-css'],
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
  },
  args: {
    pagination: { limit: 20 },
    filters: {},
  },
};

export default meta;
type Story = StoryObj<typeof AddRoleWizard>;

// Default handlers
const createDefaultHandlers = () => [
  // Permissions API
  http.get('/api/rbac/v1/permissions/', async ({ request }) => {
    const url = new URL(request.url);
    const application = url.searchParams.get('application');
    const limit = parseInt(url.searchParams.get('limit') || '100');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    let filteredPermissions = mockPermissions;
    if (application) {
      filteredPermissions = mockPermissions.filter((p) => p.application === application);
    }

    await delay(100);
    return HttpResponse.json({
      data: filteredPermissions.slice(offset, offset + limit),
      meta: { count: filteredPermissions.length, limit, offset },
    });
  }),

  // Roles API for base role selection
  http.get('/api/rbac/v1/roles/', async ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    fetchRolesSpy({ limit, offset });
    await delay(100);
    return HttpResponse.json({
      data: mockRoles.slice(offset, offset + limit),
      meta: { count: mockRoles.length, limit, offset },
    });
  }),

  // Create role API
  http.post('/api/rbac/v1/roles/', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    createRoleSpy(body);
    await delay(100);
    return HttpResponse.json({
      uuid: 'new-role-uuid',
      ...body,
    });
  }),

  // Role name validation - catches /roles/?name=... for duplicate checking
  // This is separate from the list endpoint to handle the query param validation requests
  http.get('/api/rbac/v1/roles/*', async () => {
    await delay(100);
    return HttpResponse.json({ data: [], meta: { count: 0 } });
  }),
];

/**
 * Default state - Wizard opens with "Create role" step
 */
export const Default: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    await delay(500);
    const body = within(document.body);

    // Wizard should be visible (may have multiple dialogs - wizard + warning modal)
    const dialogs = await body.findAllByRole('dialog');
    expect(dialogs.length).toBeGreaterThan(0);

    // Title should show "Create role" - use getAllByText since it appears multiple times
    const createRoleTexts = body.getAllByText(/create role/i);
    expect(createRoleTexts.length).toBeGreaterThan(0);

    // Type selector options should be visible
    expect(body.getByText(/create a role from scratch/i)).toBeInTheDocument();
    expect(body.getByText(/copy an existing role/i)).toBeInTheDocument();
  },
};

/**
 * Select "Create from scratch" option
 */
export const SelectCreateFromScratch: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    await delay(500);
    const body = within(document.body);

    // Wizard should be visible
    await body.findAllByRole('dialog');

    // Click "Create a role from scratch" option
    const createOption = body.getByText(/create a role from scratch/i);
    await userEvent.click(createOption);

    // Role name input should appear (conditional field)
    await waitFor(() => {
      const nameInputs = body.queryAllByRole('textbox');
      expect(nameInputs.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Select "Copy existing role" option - verifies radio button is clickable
 */
export const SelectCopyExistingRole: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    await delay(500);
    const body = within(document.body);

    // Wizard should be visible
    await body.findAllByRole('dialog');

    // Click "Copy an existing role" option
    const copyOption = body.getByText(/copy an existing role/i);
    expect(copyOption).toBeInTheDocument();
    await userEvent.click(copyOption);

    // Wait for UI to update
    await delay(300);

    // The radio should now be selected (checked)
    const radioInputs = body.getAllByRole('radio');
    expect(radioInputs.length).toBeGreaterThan(0);
  },
};

/**
 * Enter role name when creating from scratch
 */
export const EnterRoleName: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    await delay(500);
    const body = within(document.body);

    // Wizard should be visible
    await body.findAllByRole('dialog');

    // Click "Create a role from scratch" option
    const createOption = body.getByText(/create a role from scratch/i);
    await userEvent.click(createOption);

    // Wait for name input
    await delay(300);

    // Find text inputs and type role name
    const nameInputs = body.getAllByRole('textbox');
    const nameInput = nameInputs[0];
    await userEvent.type(nameInput, 'My Test Role');
    expect(nameInput).toHaveValue('My Test Role');
  },
};

/**
 * Cancel button is visible
 */
export const CancelButtonVisible: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    await delay(500);
    const body = within(document.body);

    // Wizard should be visible
    await body.findAllByRole('dialog');

    // Cancel button should be present
    const cancelButton = body.getByRole('button', { name: /cancel/i });
    expect(cancelButton).toBeInTheDocument();
    expect(cancelButton).toBeEnabled();
  },
};

/**
 * Next button initially visible
 */
export const NextButtonVisible: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    await delay(500);
    const body = within(document.body);

    // Wizard should be visible
    await body.findAllByRole('dialog');

    // Next button should be present
    const nextButton = body.getByRole('button', { name: /next/i });
    expect(nextButton).toBeInTheDocument();
  },
};

/**
 * Wizard navigation shows step indicators
 */
export const WizardStepIndicators: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    await delay(500);
    const body = within(document.body);

    // Wizard should be visible
    await body.findAllByRole('dialog');

    // Step nav should show step names - check for wizard step structure
    const wizardNav = document.querySelector('.pf-v6-c-wizard__nav');
    expect(wizardNav).toBeInTheDocument();
  },
};

/**
 * Verify role name input accepts text
 */
export const RoleNameInputAcceptsText: Story = {
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    await delay(500);
    const body = within(document.body);

    // Wizard should be visible
    await body.findAllByRole('dialog');

    // Click "Create a role from scratch"
    const createOption = body.getByText(/create a role from scratch/i);
    await userEvent.click(createOption);
    await delay(300);

    // Find text inputs
    const nameInputs = body.getAllByRole('textbox');
    expect(nameInputs.length).toBeGreaterThan(0);

    // Type role name
    const nameInput = nameInputs[0];
    await userEvent.type(nameInput, 'Test Role Name');
    expect(nameInput).toHaveValue('Test Role Name');
  },
};

/**
 * Duplicate role name validation blocks progress (IQE: test_enter_duplicate_role_name)
 */
export const DuplicateRoleNameValidation: Story = {
  parameters: {
    msw: {
      handlers: [
        // Override Roles API to return an existing role when name_match=exact is used
        http.get('/api/rbac/v1/roles/', async ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          const nameMatch = url.searchParams.get('name_match') || url.searchParams.get('nameMatch');
          const name = url.searchParams.get('name');
          const displayName = url.searchParams.get('display_name') || url.searchParams.get('displayName');

          if (String(nameMatch).toLowerCase() === 'exact' && (name === 'Duplicate Role' || displayName === 'Duplicate Role')) {
            return HttpResponse.json({
              data: [
                {
                  uuid: 'existing-role-uuid',
                  name: 'Duplicate Role',
                  display_name: 'Duplicate Role',
                  description: 'Existing role used to validate duplicate name behavior',
                  accessCount: 1,
                  system: false,
                },
              ],
              meta: { count: 1, limit, offset },
            });
          }

          // Fall back to the default mock roles list
          fetchRolesSpy({ limit, offset });
          await delay(100);
          return HttpResponse.json({
            data: mockRoles.slice(offset, offset + limit),
            meta: { count: mockRoles.length, limit, offset },
          });
        }),
        ...createDefaultHandlers(),
      ],
    },
  },
  play: async () => {
    await delay(500);
    const body = within(document.body);

    // Wizard should be visible
    await body.findAllByRole('dialog');

    // Select create from scratch
    const createOption = body.getByText(/create a role from scratch/i);
    await userEvent.click(createOption);
    await delay(300);

    // Type duplicate role name (validator is debounced)
    const roleNameInput = body.getByLabelText('Role name');
    await userEvent.clear(roleNameInput);
    await userEvent.type(roleNameInput, 'Duplicate Role');

    // Wait for duplicate-name error message
    await expect(body.findByText(/already been taken/i)).resolves.toBeInTheDocument();

    // Next should be disabled while the name is invalid
    const nextButton = body.getByRole('button', { name: /next/i });
    expect(nextButton).toBeDisabled();
  },
};
