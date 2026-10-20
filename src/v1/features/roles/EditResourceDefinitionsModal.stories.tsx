import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { queryDocumentByTestId, queryModalBox, queryModalTitle, querySpinner } from '../../../test-utils/interactionHelpers';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { EditResourceDefinitionsModal } from './EditResourceDefinitionsModal';
import { v1RolesHandlers } from '../../data/mocks/roles.handlers';
import type { RoleOutDynamic } from '../../data/mocks/db';
import { inventoryErrorHandlers, inventoryHandlers, inventoryLoadingHandlers } from '../../../shared/data/mocks/inventory.handlers';
import { defaultCostResourceTypes } from '../../../shared/data/mocks/inventory.fixtures';

// API Spies
const updateRoleSpy = fn();
const getRoleAccessSpy = fn();

/**
 * EditResourceDefinitionsModal - Edit resource definitions for a permission
 *
 * This modal allows editing resource definitions using a dual-list selector.
 * It supports both inventory and cost-management resource types.
 */

// Mock role with inventory permission
const mockRole = {
  uuid: 'role-123',
  name: 'Inventory Admin',
  display_name: 'Inventory Admin',
  description: 'Manages inventory resources',
  access: [
    {
      permission: 'inventory:hosts:read',
      resourceDefinitions: [
        {
          attributeFilter: {
            key: 'group.id',
            operation: 'in',
            value: ['group-1', 'group-2'],
          },
        },
      ],
    },
  ],
};

// Mock role with a cost-management permission. Cost permissions resolve their
// resources through the cost-management resource-types API rather than inventory.
const mockCostRole = {
  uuid: 'role-456',
  name: 'Cost Admin',
  display_name: 'Cost Admin',
  description: 'Manages cost resources',
  access: [
    {
      permission: 'cost-management:aws.account:read',
      resourceDefinitions: [
        {
          attributeFilter: {
            key: 'cost-management.aws.account',
            operation: 'in',
            value: ['AWS Account 001', 'AWS Account 002'],
          },
        },
      ],
    },
  ],
};

// Mock inventory groups - API returns { meta, links, data } structure
const mockInventoryGroups = {
  meta: { count: 4 },
  links: { first: null, previous: null, next: null, last: null },
  data: [
    { id: 'group-1', name: 'Production Servers' },
    { id: 'group-2', name: 'Development Servers' },
    { id: 'group-3', name: 'Staging Servers' },
    { id: 'group-4', name: 'QA Servers' },
  ],
};

// Component wrapper - TanStack Query handles data fetching internally
const EditResourceDefinitionsModalWrapper = ({ cancelRoute }: { cancelRoute: string }) => {
  return <EditResourceDefinitionsModal cancelRoute={cancelRoute} />;
};

// Router decorator - uses MemoryRouter to set initial route with params
const withRouter = (Story: React.FC, context: { parameters: { roleId?: string; permissionId?: string } }) => {
  const roleId = context.parameters.roleId || 'role-123';
  const permissionId = context.parameters.permissionId || 'inventory:hosts:read';
  const cancelRoute = `/roles/${roleId}/permissions/${permissionId}`;
  const initialRoute = `/roles/${roleId}/permissions/${permissionId}/edit`;

  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Routes>
        <Route
          path="/roles/:roleId/permissions/:permissionId/edit"
          element={
            <div style={{ minHeight: '100vh' }}>
              <EditResourceDefinitionsModalWrapper cancelRoute={cancelRoute} />
            </div>
          }
        />
        <Route path="/roles/:roleId/permissions/:permissionId" element={<div data-testid="permission-page">Permission Page - Save Successful</div>} />
        <Route path="/roles/:roleId" element={<div data-testid="role-detail-page">Role Detail</div>} />
        {/* Catch-all for navigation after save */}
        <Route path="*" element={<div data-testid="navigated-page">Navigated Away</div>} />
      </Routes>
    </MemoryRouter>
  );
};

// Inventory groups for dual-list (id/name format)
const inventoryGroupsForModal = mockInventoryGroups.data.map((g) => ({ id: g.id, name: g.name, host_count: 0, updated: '2024-01-01' }));

// Default MSW handlers
const createDefaultHandlers = (role = mockRole) => [
  ...v1RolesHandlers([role as unknown as RoleOutDynamic], {
    onUpdate: (roleId, body) => updateRoleSpy({ roleId, body }),
    onAccess: (url) => getRoleAccessSpy({ url }),
  }),
  ...inventoryHandlers(inventoryGroupsForModal, [], { networkDelay: 0 }),
];

const meta: Meta<typeof EditResourceDefinitionsModal> = {
  component: EditResourceDefinitionsModal,
  tags: ['edit-resource-definitions-modal', 'custom-css'],
  decorators: [withRouter],
  parameters: {
    layout: 'fullscreen',
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    docs: {
      description: {
        component:
          'This modal allows editing resource definitions for a permission. ' +
          'It uses a dual-list selector to move resources between available and defined lists.',
      },
    },
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
};

export default meta;
type Story = StoryObj<typeof EditResourceDefinitionsModal>;

/**
 * Default - Shows the edit resource definitions modal with inventory permission
 */
export const Default: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
  },
  play: async ({ step }) => {
    await step('Verify modal and title', async () => {
      // The modal should be rendered - look for it in the document body (PatternFly modals portal)
      await waitFor(
        () => {
          const modal = queryModalBox();
          expect(modal).toBeTruthy();
        },
        { timeout: 5000 },
      );

      // Verify the modal title
      await waitFor(
        () => {
          const title = queryModalTitle();
          expect(title?.textContent).toContain('Edit resource definitions');
        },
        { timeout: 5000 },
      );
    });
  },
};

/**
 * Loading - Shows the loading spinner while data is being fetched
 */
export const Loading: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    msw: {
      handlers: [...v1RolesHandlers([mockRole as unknown as RoleOutDynamic]), ...inventoryLoadingHandlers()],
    },
  },
  play: async ({ step }) => {
    await step('Verify loading spinner', async () => {
      // Should show spinner during loading (inside modal)
      await waitFor(
        () => {
          const spinner = querySpinner();
          expect(spinner).toBeTruthy();
        },
        { timeout: 5000 },
      );
    });
  },
};

/**
 * AddResourceAndSave - Tests adding a resource and saving
 *
 * This test:
 * 1. Opens the modal with existing defined resources (group-1, group-2)
 * 2. Selects an available resource (Staging Servers / group-3)
 * 3. Moves it to the defined list using the add button
 * 4. Clicks Save (now enabled after changes)
 * 5. Verifies the updateRole API is called with the new resource added
 *
 * This test was previously skipped due to a bug in @data-driven-forms DualListSelect
 * where addSelected/removeSelected callbacks have different signatures than onListChange.
 * Fixed by using FixedDualListSelect component via custom componentMapper.
 */
export const AddResourceAndSave: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async () => {
    // Clear spies from previous runs
    updateRoleSpy.mockClear();
    getRoleAccessSpy.mockClear();

    // Wait for the modal to be fully loaded (no spinner)
    await waitFor(
      () => {
        const spinner = querySpinner();
        expect(spinner).toBeFalsy();
      },
      { timeout: 10000 },
    );

    // Get the modal content
    const modal = queryModalBox();
    expect(modal).toBeTruthy();
    const modalContent = within(modal as HTMLElement);

    // Verify the modal title
    await waitFor(
      () => {
        const title = queryModalTitle();
        expect(title?.textContent).toContain('Edit resource definitions');
      },
      { timeout: 5000 },
    );

    // Wait for the dual-list to be populated with available resources
    await waitFor(
      () => {
        expect(modalContent.queryByText('Staging Servers')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Find the dual-list selector
    const dualList = modal?.querySelector('[class*="pf-v6-c-dual-list-selector"]');
    expect(dualList).toBeTruthy();
    const dualListContent = within(dualList as HTMLElement);

    // Step 1: Select "Staging Servers" by clicking on the item element
    const stagingOption = dualListContent.getByText('Staging Servers');
    const stagingLi = stagingOption.closest('li');
    const stagingItem = stagingLi?.querySelector('.pf-v6-c-dual-list-selector__item');
    await userEvent.click(stagingItem as HTMLElement);

    // Step 2: Click "Add selected" button
    const addButton = dualListContent.getByRole('button', { name: /add selected/i });
    await userEvent.click(addButton);

    // Verify UI state changed - Staging should now be in chosen list
    await waitFor(() => {
      const chosenPane = dualList?.querySelector('.pf-m-chosen ul');
      const chosenTexts = Array.from(chosenPane?.querySelectorAll('li') || []).map((li) => li.textContent?.trim());
      expect(chosenTexts.some((t) => t?.includes('Staging'))).toBe(true);
    });

    // Now Save button should be enabled - click it
    const saveButton = await modalContent.findByRole('button', { name: /save/i });
    await userEvent.click(saveButton);

    // Verify the API was called with the new resource added
    await waitFor(
      () => {
        expect(updateRoleSpy).toHaveBeenCalled();
        const callArgs = updateRoleSpy.mock.calls[0][0];
        expect(callArgs.roleId).toBe('role-123');
        // The body should include the access for inventory:hosts:read
        const accessForPermission = callArgs.body.access.find((a: { permission: string }) => a.permission === 'inventory:hosts:read');
        expect(accessForPermission).toBeTruthy();
        // Verify the attribute filter
        const filter = accessForPermission.resourceDefinitions[0].attributeFilter;
        expect(filter.key).toBe('group.id');
        // Should now include group-1, group-2, AND group-3 (newly added)
        const values = Array.isArray(filter.value) ? filter.value : [filter.value];
        expect(values).toContain('group-1');
        expect(values).toContain('group-2');
        expect(values).toContain('group-3'); // The newly added Staging Servers
      },
      { timeout: 5000 },
    );
  },
};

/**
 * CostManagementPermission - Regression test for RHCLOUD-52266
 *
 * Cost-management permissions resolve their resources through the
 * cost-management resource-types API. The resources object is `undefined` on
 * the first render (and whenever the resource type cannot be resolved), which
 * used to throw `Cannot convert undefined or null to object` out of
 * `Object.entries` while building the dual-list options — the modal never
 * rendered and the whole route crashed into the Sentry error boundary.
 */
export const CostManagementPermission: Story = {
  parameters: {
    roleId: 'role-456',
    permissionId: 'cost-management:aws.account:read',
    msw: {
      handlers: [
        ...v1RolesHandlers([mockCostRole as unknown as RoleOutDynamic]),
        ...inventoryHandlers(inventoryGroupsForModal, defaultCostResourceTypes, { networkDelay: 0 }),
      ],
    },
  },
  play: async ({ step }) => {
    await step('Modal renders instead of crashing', async () => {
      await waitFor(
        () => {
          const title = queryModalTitle();
          expect(title?.textContent).toContain('Edit resource definitions');
        },
        { timeout: 5000 },
      );

      await waitFor(
        () => {
          expect(querySpinner()).toBeFalsy();
        },
        { timeout: 10000 },
      );
    });

    await step('AWS accounts are listed as available resources', async () => {
      const modal = queryModalBox();
      expect(modal).toBeTruthy();
      const modalContent = within(modal as HTMLElement);

      await waitFor(
        () => {
          expect(modalContent.queryByText('AWS Account 003')).toBeInTheDocument();
        },
        { timeout: 5000 },
      );
    });
  },
};

/**
 * CostManagementResourceTypesUnavailable - The cost-management API is denied or
 * unavailable (a 403 for users without cost-management access returns no
 * resource types). The permission's resource type never resolves, so there are
 * no options to offer — the modal must still render rather than crash.
 */
export const CostManagementResourceTypesUnavailable: Story = {
  parameters: {
    roleId: 'role-456',
    permissionId: 'cost-management:aws.account:read',
    msw: {
      handlers: [...v1RolesHandlers([mockCostRole as unknown as RoleOutDynamic]), ...inventoryErrorHandlers(403)],
    },
  },
  play: async ({ step }) => {
    await step('Modal renders with no available resources', async () => {
      await waitFor(
        () => {
          const title = queryModalTitle();
          expect(title?.textContent).toContain('Edit resource definitions');
        },
        { timeout: 5000 },
      );

      await waitFor(
        () => {
          expect(querySpinner()).toBeFalsy();
        },
        { timeout: 10000 },
      );

      const modal = queryModalBox();
      expect(modal).toBeTruthy();
      expect(within(modal as HTMLElement).queryByText('AWS Account 003')).not.toBeInTheDocument();
    });
  },
};

/**
 * CancelWithoutChanges - Tests that cancel navigation works
 */
export const CancelWithoutChanges: Story = {
  parameters: {
    roleId: 'role-123',
    permissionId: 'inventory:hosts:read',
    msw: {
      handlers: createDefaultHandlers(),
    },
  },
  play: async ({ step }) => {
    await step('Cancel without changes and verify navigation', async () => {
      updateRoleSpy.mockClear();

      // Wait for loading to complete
      await waitFor(
        () => {
          const spinner = querySpinner();
          expect(spinner).toBeFalsy();
        },
        { timeout: 10000 },
      );

      const modal = queryModalBox();
      expect(modal).toBeTruthy();
      const modalContent = within(modal as HTMLElement);

      // Click Cancel button
      const cancelButton = await modalContent.findByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
      await userEvent.click(cancelButton);

      // Should NOT call updateRole API
      expect(updateRoleSpy).not.toHaveBeenCalled();

      // Should navigate away
      await waitFor(
        () => {
          const navigatedPage = queryDocumentByTestId('permission-page') || queryDocumentByTestId('navigated-page');
          expect(navigatedPage).toBeTruthy();
        },
        { timeout: 5000 },
      );
    });
  },
};
