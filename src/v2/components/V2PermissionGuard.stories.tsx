import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { TenantPermissionsMap } from '../../../.storybook/contexts/StorybookMockContext';
import { V2PermissionGuard, groups, roles } from './V2PermissionGuard';

const ProtectedContent = () => <div data-testid="protected-content">Protected route content</div>;

const ALL_GRANTED: TenantPermissionsMap = {
  rbac_roles_read: true,
  rbac_roles_write: true,
  rbac_groups_read: true,
  rbac_groups_write: true,
  rbac_principal_read: true,
  rbac_workspace_view: true,
  rbac_workspace_edit: true,
  rbac_workspace_create: true,
  rbac_workspace_delete: true,
  rbac_workspace_move: true,
};

const ALL_DENIED: TenantPermissionsMap = {
  rbac_roles_read: false,
  rbac_roles_write: false,
  rbac_groups_read: false,
  rbac_groups_write: false,
  rbac_principal_read: false,
  rbac_workspace_view: false,
  rbac_workspace_edit: false,
  rbac_workspace_create: false,
  rbac_workspace_delete: false,
  rbac_workspace_move: false,
};

const meta: Meta<typeof V2PermissionGuard> = {
  component: V2PermissionGuard,
  title: 'V2/Components/V2PermissionGuard',
  tags: ['autodocs', 'v2-permission-guard'],
  parameters: {
    docs: {
      description: {
        component: `
Route-level permission guard for V2. Uses Kessel SDK for permission checks
and Chrome identity for orgAdmin. Renders children or \`<Outlet />\` on success,
\`UnauthorizedAccess\` on denial, and a loading placeholder while checking.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/test']}>
        <Routes>
          <Route path="/test" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof V2PermissionGuard>;

/**
 * Authorized — user has the required tenant permissions.
 */
export const Authorized: Story = {
  parameters: {
    permissions: ['rbac:*:*'],
    tenantPermissions: ALL_GRANTED,
  },
  render: () => (
    <V2PermissionGuard permissions={[roles.canView]}>
      <ProtectedContent />
    </V2PermissionGuard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = await canvas.findByTestId('protected-content');
    expect(content).toBeInTheDocument();
  },
};

/**
 * Unauthorized — user lacks the required tenant permissions.
 */
export const Unauthorized: Story = {
  parameters: {
    permissions: [],
    tenantPermissions: ALL_DENIED,
  },
  render: () => (
    <V2PermissionGuard permissions={[roles.canView]}>
      <ProtectedContent />
    </V2PermissionGuard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = await canvas.findByRole('heading', { name: /you do not have access/i });
    expect(heading).toBeInTheDocument();
    expect(canvas.queryByTestId('protected-content')).not.toBeInTheDocument();
  },
};

/**
 * OrgAdmin Required — authorized because user is org admin.
 */
export const OrgAdminAuthorized: Story = {
  parameters: {
    permissions: [],
    orgAdmin: true,
  },
  render: () => (
    <V2PermissionGuard requireOrgAdmin>
      <ProtectedContent />
    </V2PermissionGuard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = await canvas.findByTestId('protected-content');
    expect(content).toBeInTheDocument();
  },
};

/**
 * OrgAdmin Required — denied because user is not org admin.
 */
export const OrgAdminDenied: Story = {
  parameters: {
    permissions: [],
    orgAdmin: false,
  },
  render: () => (
    <V2PermissionGuard requireOrgAdmin>
      <ProtectedContent />
    </V2PermissionGuard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = await canvas.findByRole('heading', { name: /you do not have access/i });
    expect(heading).toBeInTheDocument();
    expect(canvas.queryByTestId('protected-content')).not.toBeInTheDocument();
  },
};

/**
 * Public Route — no permissions required, always renders children.
 */
export const PublicRoute: Story = {
  parameters: {
    permissions: [],
    tenantPermissions: ALL_DENIED,
  },
  render: () => (
    <V2PermissionGuard>
      <ProtectedContent />
    </V2PermissionGuard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = await canvas.findByTestId('protected-content');
    expect(content).toBeInTheDocument();
  },
};

/**
 * CheckAll false — passes when user has at least one of the required permissions.
 */
export const PartialPermissionsOrLogic: Story = {
  parameters: {
    permissions: ['rbac:role:read'],
    tenantPermissions: {
      ...ALL_DENIED,
      rbac_roles_read: true,
    },
  },
  render: () => (
    <V2PermissionGuard permissions={[roles.canView, groups.canView]} checkAll={false}>
      <ProtectedContent />
    </V2PermissionGuard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const content = await canvas.findByTestId('protected-content');
    expect(content).toBeInTheDocument();
  },
};

/**
 * CheckAll true — denied when user has only some of the required permissions.
 */
export const PartialPermissionsAndLogic: Story = {
  parameters: {
    permissions: ['rbac:role:read'],
    tenantPermissions: {
      ...ALL_DENIED,
      rbac_roles_read: true,
    },
  },
  render: () => (
    <V2PermissionGuard permissions={[roles.canView, groups.canView]} checkAll={true}>
      <ProtectedContent />
    </V2PermissionGuard>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const heading = await canvas.findByRole('heading', { name: /you do not have access/i });
    expect(heading).toBeInTheDocument();
    expect(canvas.queryByTestId('protected-content')).not.toBeInTheDocument();
  },
};
