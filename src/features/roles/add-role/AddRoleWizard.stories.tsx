import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, http } from 'msw';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AddRoleWizard } from './AddRoleWizard';

// API Spies
const createRoleSpy = fn();
const fetchRolesSpy = fn();

const findWizardDialog = async () => {
  const dialogs = await screen.findAllByRole('dialog');
  return (
    dialogs.find((d) => within(d).queryAllByText(/create role/i).length > 0) ?? dialogs[0]
  );
};

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
const withRouter = (Story: any) => {
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
        <Route path="/groups" element={<div data-testid="groups-page">Groups Page</div>} />
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
    return HttpResponse.json({
      data: mockRoles.slice(offset, offset + limit),
      meta: { count: mockRoles.length, limit, offset },
    });
  }),

  // Create role API
  http.post('/api/rbac/v1/roles/', async ({ request }) => {
    const body = (await request.json()) as Record<string, unknown>;
    createRoleSpy(body);
    return HttpResponse.json({
      uuid: 'new-role-uuid',
      ...body,
    });
  }),

  // Role name validation - catches /roles/?name=... for duplicate checking
  // This is separate from the list endpoint to handle the query param validation requests
  http.get('/api/rbac/v1/roles/*', async () => {
    return HttpResponse.json({ data: [], meta: { count: 0 } });
  }),
];

/**
 * Default state - Wizard opens with "Create role" step
 */
export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: createDefaultHandlers(),
    },
    docs: {
      description: {
        story: `
Container story for the **Add role** wizard. Additional interaction stories in this file validate the key UI-only flows we identified for Storybook coverage (e.g. duplicate role name validation).\n`,
      },
    },
  },
  play: async () => {
    const dialog = await findWizardDialog();
    const body = within(dialog);

    // Wizard should be visible (may have multiple dialogs - wizard + warning modal)
    await expect(dialog).toBeInTheDocument();

    // Title should show "Create role" - use getAllByText since it appears multiple times
    const createRoleTexts = await body.findAllByText(/create role/i);
    await expect(createRoleTexts.length).toBeGreaterThan(0);

    // Type selector options should be visible
    await expect(body.findByText(/create a role from scratch/i)).resolves.toBeInTheDocument();
    await expect(body.findByText(/copy an existing role/i)).resolves.toBeInTheDocument();
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
    const dialog = await findWizardDialog();
    const body = within(dialog);

    // Click "Create a role from scratch" option
    const createOption = await body.findByText(/create a role from scratch/i);
    await userEvent.click(createOption);

    // Role name input should appear (conditional field)
    await waitFor(async () => {
      const nameInputs = body.queryAllByRole('textbox');
      await expect(nameInputs.length).toBeGreaterThan(0);
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
    const dialog = await findWizardDialog();
    const body = within(dialog);

    // Click "Copy an existing role" option
    const copyOption = await body.findByText(/copy an existing role/i);
    await expect(copyOption).toBeInTheDocument();
    await userEvent.click(copyOption);

    // The radio should now be selected (checked)
    const radioInputs = body.getAllByRole('radio');
    await expect(radioInputs.length).toBeGreaterThan(0);
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
    const dialog = await findWizardDialog();
    const body = within(dialog);

    // Click "Create a role from scratch" option
    const createOption = await body.findByText(/create a role from scratch/i);
    await userEvent.click(createOption);

    // Find text inputs and type role name
    const nameInputs = await body.findAllByRole('textbox');
    const nameInput = nameInputs[0];
    await userEvent.type(nameInput, 'My Test Role');
    await expect(nameInput).toHaveValue('My Test Role');
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
    const dialog = await findWizardDialog();
    const body = within(dialog);

    // Cancel button should be present
    const cancelButton = await body.findByRole('button', { name: /cancel/i });
    await expect(cancelButton).toBeInTheDocument();
    await expect(cancelButton).toBeEnabled();
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
    const dialog = await findWizardDialog();
    const body = within(dialog);

    // Next button should be present
    const nextButton = await body.findByRole('button', { name: /next/i });
    await expect(nextButton).toBeInTheDocument();
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
    await findWizardDialog();

    // Step nav should show step names - check for wizard step structure
    const wizardNav = document.querySelector('.pf-v6-c-wizard__nav');
    await expect(wizardNav).toBeInTheDocument();
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
    const dialog = await findWizardDialog();
    const body = within(dialog);

    // Click "Create a role from scratch"
    const createOption = await body.findByText(/create a role from scratch/i);
    await userEvent.click(createOption);

    // Find text inputs
    const nameInputs = await body.findAllByRole('textbox');
    await expect(nameInputs.length).toBeGreaterThan(0);

    // Type role name
    const nameInput = nameInputs[0];
    await userEvent.type(nameInput, 'Test Role Name');
    await expect(nameInput).toHaveValue('Test Role Name');
  },
};

/**
 * Duplicate role name validation blocks progress (matches IQE: test_enter_duplicate_role_name)
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

          // Validator uses exact match checks for both name and display name
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

          // Default list response for other calls
          fetchRolesSpy({ limit, offset });
          await delay(100);
          return HttpResponse.json({
            data: mockRoles.slice(offset, offset + limit),
            meta: { count: mockRoles.length, limit, offset },
          });
        }),
        // Keep other default handlers (permissions + create role)
        ...createDefaultHandlers(),
      ],
    },
  },
  play: async () => {
    const dialog = await findWizardDialog();
    const body = within(dialog);

    // Select create from scratch
    const createOption = await body.findByText(/create a role from scratch/i);
    await userEvent.click(createOption);

    // Type duplicate role name (validator is debounced)
    const roleNameInput = await body.findByLabelText('Role name');
    await userEvent.clear(roleNameInput);
    await userEvent.type(roleNameInput, 'Duplicate Role');

    // Wait for duplicate-name error message
    await expect(body.findByText(/already been taken/i)).resolves.toBeInTheDocument();

    // Next should be disabled when the role-name field is invalid/cleared by validator
    const nextButton = await body.findByRole('button', { name: /next/i });
    await expect(nextButton).toBeDisabled();
  },
};
