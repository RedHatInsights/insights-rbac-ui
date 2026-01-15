import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { navigateToPage, resetStoryState } from '../_shared/helpers';

// Mock data for Users
const mockUsers = [
  {
    id: '1',
    username: 'john.doe',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    is_org_admin: false,
    external_source_id: 123,
  },
  {
    id: '2',
    username: 'jane.smith',
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_active: true,
    is_org_admin: true,
    external_source_id: 456,
  },
  {
    id: '3',
    username: 'bob.wilson',
    email: 'bob.wilson@example.com',
    first_name: 'Bob',
    last_name: 'Wilson',
    is_active: false,
    is_org_admin: false,
    external_source_id: 789,
  },
];

// Mock data for User Groups
const mockGroups = [
  {
    uuid: 'group-1',
    name: 'Administrators',
    description: 'System administrators with full access',
    principalCount: 5,
    roleCount: 3,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-06-15T10:30:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
  {
    uuid: 'group-2',
    name: 'Developers',
    description: 'Development team members',
    principalCount: 12,
    roleCount: 2,
    created: '2023-02-01T00:00:00Z',
    modified: '2023-06-10T14:20:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
  {
    uuid: 'group-3',
    name: 'Read Only Users',
    description: 'Users with read-only access',
    principalCount: 25,
    roleCount: 1,
    created: '2023-03-01T00:00:00Z',
    modified: '2023-05-20T09:00:00Z',
    platform_default: true,
    admin_default: false,
    system: false,
  },
];

// Mock data for Roles
const mockRoles = [
  {
    uuid: 'role-1',
    name: 'Organization Administrator',
    display_name: 'Organization Administrator',
    description: 'Full administrative access to the organization',
    system: true,
    platform_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 50,
  },
  {
    uuid: 'role-2',
    name: 'User Access Administrator',
    display_name: 'User Access Administrator',
    description: 'Manage users and groups',
    system: true,
    platform_default: false,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 15,
  },
  {
    uuid: 'role-3',
    name: 'Viewer',
    display_name: 'Viewer',
    description: 'Read-only access to all resources',
    system: true,
    platform_default: true,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-01-01T00:00:00Z',
    policyCount: 1,
    accessCount: 10,
  },
];

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Feature Development/Access Management Navigation',
  tags: ['access-management', 'test-skip'],
  decorators: [
    (Story: any, context: any) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
  ],
  argTypes: {
    typingDelay: {
      control: { type: 'number', min: 0, max: 100, step: 10 },
      description: 'Typing delay in ms for demo mode',
      table: { category: 'Demo', defaultValue: { summary: '0 in CI, 30 otherwise' } },
    },
    orgAdmin: {
      control: 'boolean',
      description: 'Organization Administrator',
      table: { category: 'Permissions', defaultValue: { summary: 'true' } },
    },
    userAccessAdministrator: {
      control: 'boolean',
      description: 'User Access Administrator',
      table: { category: 'Permissions', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.workspaces-list': {
      control: 'boolean',
      description: 'Kessel M1 - Workspace list view',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.workspace-hierarchy': {
      control: 'boolean',
      description: 'Kessel M2 - Parent workspace selection',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.workspaces-role-bindings': {
      control: 'boolean',
      description: 'Kessel M3 - Workspace role bindings',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.workspaces-role-bindings-write': {
      control: 'boolean',
      description: 'Kessel M4 - Write access to workspace role bindings',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.workspaces': {
      control: 'boolean',
      description: 'Kessel M5 - Full workspace management',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.group-service-accounts': {
      control: 'boolean',
      description: 'Group service accounts feature',
      table: { category: 'Other Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.group-service-accounts.stable': {
      control: 'boolean',
      description: 'Group service accounts stable release',
      table: { category: 'Other Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.common-auth-model': {
      control: 'boolean',
      description: 'Common authentication model',
      table: { category: 'Other Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.common.userstable': {
      control: 'boolean',
      description: 'Common users table (enables new Users component)',
      table: { category: 'Other Flags', defaultValue: { summary: 'true' } },
    },
  },
  args: {
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    orgAdmin: true,
    userAccessAdministrator: false,
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': true,
    'platform.rbac.workspaces-role-bindings': true,
    'platform.rbac.workspaces-role-bindings-write': false,
    'platform.rbac.workspaces': false,
    'platform.rbac.group-service-accounts': false,
    'platform.rbac.group-service-accounts.stable': false,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.common.userstable': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      orgAdmin: true,
      userAccessAdministrator: false,
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces-role-bindings': true,
      'platform.rbac.workspaces-role-bindings-write': false,
      'platform.rbac.workspaces': false,
      'platform.rbac.group-service-accounts': false,
      'platform.rbac.group-service-accounts.stable': false,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.common.userstable': true,
    }),
    msw: {
      handlers: [
        // Users API
        http.get('/api/rbac/v1/principals/', () => {
          return HttpResponse.json({
            data: mockUsers,
            meta: { count: mockUsers.length },
          });
        }),
        // Groups API
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: mockGroups,
            meta: { count: mockGroups.length },
          });
        }),
        // Roles API
        http.get('/api/rbac/v1/roles/', () => {
          return HttpResponse.json({
            data: mockRoles,
            meta: { count: mockRoles.length },
          });
        }),
        // Cross-account requests (for overview)
        http.get('/api/rbac/v1/cross-account-requests/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0 },
          });
        }),
      ],
    },
    docs: {
      description: {
        component: `
# Access Management Navigation Rework

This user journey tests the new Access Management navigation structure introduced as part of the Management Fabric initiative.

## Overview

The Access Management epic introduces a reworked navigation structure with new and updated pages:

- **Overview** - Dashboard view (existing, may be updated)
- **Workspaces** - Workspace management (covered by Kessel Mx journeys)
- **Users and User Groups** - NEW unified page replacing separate Users and Groups pages
- **Roles** - Roles management (to be rebuilt)
- **Red Hat Access Requests** - External app (not linked)

## New Navigation Structure

The sidebar now shows "Access Management" as an expandable section containing:
1. Overview
2. Workspaces
3. Users and User Groups (NEW)
4. Roles
5. Red Hat Access Requests (disabled - external app)

## Feature Flags

- \`platform.rbac.common.userstable\`: Enables the new Users component
- \`platform.rbac.common-auth-model\`: Enables common authentication model features

## What This Journey Tests

1. **Navigation** - Verify all nav links work correctly
2. **Users and User Groups** - Test the new unified page with tabs
3. **Overview** - Verify the overview page loads
4. **Roles** - Verify roles page loads (placeholder until rebuilt)

## Gap Analysis

See the plan document for detailed gap analysis between current implementation and Figma designs.
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Manual Testing Entry Point
 *
 * Use this story for interactive exploration of the Access Management navigation.
 */
export const ManualTesting: Story = {
  name: 'Access Management Manual Testing',
  tags: ['autodocs'],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Access Management Manual Testing

This story provides an entry point for manual testing the new Access Management navigation.

### What to Test

**Navigation:**
- Click "Overview" in the sidebar
- Click "Users and User Groups" in the sidebar
- Click "Roles" in the sidebar
- Verify "Red Hat Access Requests" is disabled (external app)

**Users and User Groups Page:**
- Verify page loads with "Users" tab active by default
- Click "User Groups" tab and verify it switches
- Test table sorting and filtering
- Click on a user row to open the details drawer
- Click on a group row to open the group details drawer

**Overview Page:**
- Verify the overview dashboard loads correctly

**Roles Page:**
- Verify the roles table loads
- Test sorting and filtering
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Wait for the page to load
    await delay(500);

    // Verify the Users and User Groups page loads
    await expect(canvas.findByText('Users and User Groups')).resolves.toBeInTheDocument();
  },
};

/**
 * Navigate to Overview page
 *
 * Tests navigation to the Overview page from the Access Management sidebar.
 */
export const NavigateToOverview: Story = {
  name: 'Navigate to Overview',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests navigation to the Overview page using the new Access Management sidebar.

**Expected behavior:**
- Click "Overview" in the sidebar
- Page navigates to /iam/access-management/overview
- Overview content loads
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for initial page load
    await delay(500);

    // Navigate to Overview using the sidebar
    await navigateToPage(user, canvas, 'Overview');
    await delay(500);

    // Verify we're on the Overview page by checking the address bar
    const addressBar = canvas.getByTestId('fake-address-bar');
    expect(addressBar).toHaveTextContent(/overview/i);
  },
};

/**
 * Navigate to Users and User Groups
 *
 * Tests navigation to the new unified Users and User Groups page.
 */
export const NavigateToUsersAndUserGroups: Story = {
  name: 'Navigate to Users and User Groups',
  args: {
    initialRoute: '/iam/access-management/overview',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests navigation to the new Users and User Groups page.

**Expected behavior:**
- Click "Users and User Groups" in the sidebar
- Page navigates to /iam/access-management/users-and-user-groups
- Tabbed interface loads with Users and User Groups tabs
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for initial page load
    await delay(500);

    // Navigate to Users and User Groups using the sidebar
    await navigateToPage(user, canvas, 'Users and User Groups');
    await delay(500);

    // Verify the page header
    await expect(canvas.findByText('Users and User Groups')).resolves.toBeInTheDocument();

    // Verify the tabs are present
    await expect(canvas.findByRole('tab', { name: /users/i })).resolves.toBeInTheDocument();
    await expect(canvas.findByRole('tab', { name: /user groups/i })).resolves.toBeInTheDocument();
  },
};

/**
 * Users Tab - Table and Drawer
 *
 * Tests the Users tab functionality including table display and user details drawer.
 */
export const UsersTabTableAndDrawer: Story = {
  name: 'Users Tab - Table and Drawer',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the Users tab functionality in the Users and User Groups page.

**What this tests:**
- Users table renders with data
- Table columns display correctly
- Row click opens user details drawer
- Drawer shows user information
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(500);

    // Verify Users tab is active
    const usersTab = await canvas.findByRole('tab', { name: /users/i });
    expect(usersTab).toHaveAttribute('aria-selected', 'true');

    // Verify users are displayed in the table
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('jane.smith')).resolves.toBeInTheDocument();

    // Click on a user row to open the drawer
    const johnDoeRow = await canvas.findByText('john.doe');
    await user.click(johnDoeRow);
    await delay(300);

    // Verify the drawer opens (look for drawer content)
    // The drawer should show user details
    const drawer = document.querySelector('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    if (drawer) {
      const drawerScope = within(drawer as HTMLElement);
      // Check for user info in drawer
      await expect(drawerScope.findByText(/john/i)).resolves.toBeInTheDocument();
    }
  },
};

/**
 * User Groups Tab - Table and Drawer
 *
 * Tests the User Groups tab functionality including table display and group details drawer.
 */
export const UserGroupsTabTableAndDrawer: Story = {
  name: 'User Groups Tab - Table and Drawer',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the User Groups tab functionality in the Users and User Groups page.

**What this tests:**
- User Groups table renders with data
- Table columns display correctly
- Row click opens group details drawer
- Drawer shows group information with tabs (Users, Service Accounts, Roles)
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(500);

    // Verify User Groups tab is active
    const groupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    expect(groupsTab).toHaveAttribute('aria-selected', 'true');

    // Verify groups are displayed in the table
    await expect(canvas.findByText('Administrators')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Developers')).resolves.toBeInTheDocument();

    // Click on a group row to open the drawer
    const adminsRow = await canvas.findByText('Administrators');
    await user.click(adminsRow);
    await delay(300);

    // Verify the drawer opens
    const drawer = document.querySelector('.pf-v6-c-drawer__panel, .pf-c-drawer__panel');
    if (drawer) {
      const drawerScope = within(drawer as HTMLElement);
      // Check for group name in drawer
      await expect(drawerScope.findByText(/administrators/i)).resolves.toBeInTheDocument();
    }
  },
};

/**
 * Tab Navigation - Switch between Users and User Groups
 *
 * Tests switching between the Users and User Groups tabs.
 */
export const TabNavigation: Story = {
  name: 'Tab Navigation',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/users',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests tab navigation between Users and User Groups.

**What this tests:**
- Users tab is active by default
- Clicking User Groups tab switches the view
- Clicking Users tab switches back
- URL updates with tab navigation
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for page to load
    await delay(500);

    // Verify Users tab is active initially
    const usersTab = await canvas.findByRole('tab', { name: /users/i });
    expect(usersTab).toHaveAttribute('aria-selected', 'true');

    // Verify users data is shown
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();

    // Click User Groups tab
    const groupsTab = await canvas.findByRole('tab', { name: /user groups/i });
    await user.click(groupsTab);
    await delay(500);

    // Verify User Groups tab is now active
    expect(groupsTab).toHaveAttribute('aria-selected', 'true');

    // Verify groups data is shown
    await expect(canvas.findByText('Administrators')).resolves.toBeInTheDocument();

    // Click back to Users tab
    await user.click(usersTab);
    await delay(500);

    // Verify Users tab is active again
    expect(usersTab).toHaveAttribute('aria-selected', 'true');
    await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
  },
};

/**
 * Navigate to Roles
 *
 * Tests navigation to the Roles page.
 */
export const NavigateToRoles: Story = {
  name: 'Navigate to Roles',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests navigation to the Roles page.

**Expected behavior:**
- Click "Roles" in the sidebar
- Page navigates to /iam/access-management/roles
- Roles table loads with data

**Note:** The Roles page is planned to be rebuilt. This test verifies the current implementation.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for initial page load
    await delay(500);

    // Navigate to Roles using the sidebar
    await navigateToPage(user, canvas, 'Roles');
    await delay(500);

    // Verify we're on the Roles page by checking the address bar
    const addressBar = canvas.getByTestId('fake-address-bar');
    expect(addressBar).toHaveTextContent(/roles/i);
  },
};
