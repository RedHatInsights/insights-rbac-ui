import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { userEvent, within } from 'storybook/test';
import { KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { navigateToPage, resetStoryState, waitForPageToLoad } from '../_shared/helpers';
import { defaultWorkspaces } from '../../../.storybook/fixtures/workspaces';
import { defaultKesselRoles } from '../../../.storybook/fixtures/kessel-groups-roles';
import { HttpResponse, http } from 'msw';

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Workspaces (Kessel)/M4: Role Bindings Write/With Write Permission',
  tags: ['kessel-m4-write', 'test-skip'],
  decorators: [
    (Story: any, context: any) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      // Replace parameters entirely instead of mutating to ensure React sees the change
      context.parameters = { ...context.parameters, ...dynamicEnv };
      // Force remount when controls change by using args as key
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
      description: 'Kessel M3 - Workspace role bindings (read-only)',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.workspaces-role-bindings-write': {
      control: 'boolean',
      description: 'Kessel M4 - Workspace role bindings (write)',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
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
      table: { category: 'Other Flags', defaultValue: { summary: 'false' } },
    },
    'platform.rbac.common.userstable': {
      control: 'boolean',
      description: 'Common users table',
      table: { category: 'Other Flags', defaultValue: { summary: 'false' } },
    },
  },
  args: {
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    orgAdmin: true,
    userAccessAdministrator: false,
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': true,
    'platform.rbac.workspaces-role-bindings': true,
    'platform.rbac.workspaces-role-bindings-write': true,
    'platform.rbac.workspaces': false,
    'platform.rbac.group-service-accounts': false,
    'platform.rbac.group-service-accounts.stable': false,
    'platform.rbac.common-auth-model': false,
    'platform.rbac.common.userstable': false,
  },
  parameters: {
    ...createDynamicEnvironment({
      orgAdmin: true,
      userAccessAdministrator: false,
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces-role-bindings': true,
      'platform.rbac.workspaces-role-bindings-write': true,
      'platform.rbac.workspaces': false,
      'platform.rbac.group-service-accounts': false,
      'platform.rbac.group-service-accounts.stable': false,
      'platform.rbac.common-auth-model': false,
      'platform.rbac.common.userstable': false,
    }),
    msw: {
      handlers: [
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: defaultWorkspaces,
            meta: { count: defaultWorkspaces.length, limit: 10000, offset: 0 },
          });
        }),
        http.get('/api/rbac/v2/workspaces/:workspaceId', ({ params }) => {
          const workspace = defaultWorkspaces.find((w) => w.id === params.workspaceId);
          return HttpResponse.json(workspace || {});
        }),
        http.get('/api/rbac/v1/groups/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 10, offset: 0 },
          });
        }),
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');
          const application = url.searchParams.get('application');

          let filtered = [...defaultKesselRoles];

          // Handle application filtering
          if (application) {
            const apps = application.split(',').map((a) => a.trim());
            filtered = filtered.filter((r) => {
              if (!r.applications || r.applications.length === 0) {
                return true;
              }
              return r.applications.some((roleApp) => apps.includes(roleApp));
            });
          }

          const paginated = filtered.slice(offset, offset + limit);

          return HttpResponse.json({
            data: paginated,
            meta: { count: filtered.length, limit, offset },
          });
        }),
        http.get('/api/rbac/v1/principals/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 10, offset: 0 },
          });
        }),
        http.get('/api/rbac/v1/access/', ({ request }) => {
          const url = new URL(request.url);
          const limit = parseInt(url.searchParams.get('limit') || '20');
          const offset = parseInt(url.searchParams.get('offset') || '0');

          const accessData = [
            {
              permission: 'rbac:*:*',
              application: 'rbac',
              resourceType: 'rbac',
              verb: '*',
            },
            {
              permission: 'inventory:hosts:read',
              application: 'inventory',
              resourceType: 'hosts',
              verb: 'read',
            },
            {
              permission: 'inventory:groups:write',
              application: 'inventory',
              resourceType: 'groups',
              verb: 'write',
            },
          ];

          return HttpResponse.json({
            data: accessData.slice(offset, offset + limit),
            meta: {
              count: accessData.length,
              limit,
              offset,
            },
          });
        }),
        http.post('/api/test/reset-state', () => {
          return HttpResponse.json({ success: true });
        }),
      ],
    },
    docs: {
      description: {
        component: `
# Kessel M4: Admin Environment (PLACEHOLDER)

**Feature Flag**: \`platform.rbac.workspaces-role-bindings-write\` (hypothetical)

**Expected Delivery**: January 2026

## ⚠️ Status: Not Yet Implemented

These stories are **placeholders** documenting the expected M4 features. The actual UI and APIs have not been built yet.

## Milestone Overview

Kessel M4 adds **Access Management v2 Write** capabilities, allowing administrators to modify role bindings directly from workspace detail pages. This builds upon M3's read-only role bindings view.

## Key Features (Planned)

- ✅ **All M3 Features**: Workspace list, hierarchy, detail pages with read-only role bindings
- 🚧 **Add Role Binding**: Assign roles to workspace
- 🚧 **Remove Role Binding**: Remove roles from workspace
- 🚧 **Assign Principals**: Add users/groups to workspace roles
- 🚧 **Remove Principals**: Remove users/groups from workspace roles
- 🚧 **Role Binding Management**: Full CRUD for workspace-level role assignments

## Admin Capabilities (When Implemented)

In M4, admins will be able to:
- Navigate to workspace detail page (from M3)
- Switch to "Roles" tab
- Click "Add role" to assign a role to the workspace
- Select principals (users/groups) to bind to that role
- Remove role bindings from the workspace
- Manage who has access to workspace resources

## Architecture Notes

M4 introduces the concept of **workspace-scoped role bindings**, which differ from organization-level role assignments:
- **Organization Roles** (existing): Apply globally across all resources
- **Workspace Role Bindings** (M4): Apply only within specific workspace context
- This enables fine-grained access control per workspace

## API Endpoints (Expected)

\`\`\`
POST   /api/rbac/v2/workspaces/{id}/role-bindings
GET    /api/rbac/v2/workspaces/{id}/role-bindings
DELETE /api/rbac/v2/workspaces/{id}/role-bindings/{binding-id}
PATCH  /api/rbac/v2/workspaces/{id}/role-bindings/{binding-id}
\`\`\`

## Testing Strategy

Once M4 is implemented:
1. Create role bindings from workspace detail page
2. Verify role bindings appear in Roles tab
3. Test principal assignment (users/groups)
4. Test role binding removal
5. Verify access inheritance in workspace hierarchy (from M2)

## Dependencies

- M3 must be complete (workspace detail pages with Roles tab)
- RBACv2 role model must be finalized
- v2 role binding PR must be merged
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Manual Testing Entry Point with automated verification
 * Imported from shared story to maintain consistency across all milestones
 */
import { ManualTestingWithWrite } from '../_shared/stories/ManualTestingStory';
export const ManualTesting: Story = {
  ...ManualTestingWithWrite,
  name: 'Manual Testing',
  tags: ['autodocs'],
  args: {
    ...ManualTestingWithWrite.args,
    // Explicitly include feature flag args to ensure controls work
    orgAdmin: true,
    userAccessAdministrator: false,
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': true,
    'platform.rbac.workspaces-role-bindings': true,
    'platform.rbac.workspaces-role-bindings-write': true,
    'platform.rbac.workspaces': false,
  },
  parameters: {
    docs: {
      description: {
        story: `
## Kessel M4 Manual Testing - With Write Permission (PLACEHOLDER)

**Feature Flag**: \`platform.rbac.workspaces-role-bindings-write\`  
**Required Permission**: \`inventory:groups:write\` or \`inventory:groups:*\`

### ⚠️ Status: Not Yet Implemented

These stories are **placeholders** documenting the expected M4 features. The actual UI and APIs have not been built yet. **Expected Delivery**: January 2026

### Milestone Context

Kessel M4 adds **workspace role bindings write access**, allowing administrators to modify role assignments directly from workspace detail pages. This builds upon M3's read-only role bindings view.

**What's Planned for M4:**
- ✅ All M1 features (workspace list view)
- ✅ All M2 features (workspace hierarchy management)
- ✅ All M3 features (workspace detail pages with read-only role bindings)
- 🚧 Add role binding to workspace
- 🚧 Remove role binding from workspace
- 🚧 Assign principals (users/groups) to workspace roles
- 🚧 Remove principals from workspace roles
- 🚧 Full CRUD for workspace-level role assignments

### Manual Testing Entry Point

This story provides a **placeholder** entry point for manual testing the RBAC UI in the M4 milestone environment once implemented.

**Environment Configuration (When Implemented):**
- Feature flags: M1 + M2 + M3 + M4 (\`workspaces-role-bindings-write\`)
- Chrome API mock with \`inventory:groups:write\` permission
- MSW handlers for API mocking
- Mock data for workspaces, groups, roles, and role bindings

**What to Test (When Implemented):**

**My User Access Page:**
- Navigate to "My User Access" using the left navigation
- Switch between different bundle cards (RHEL, Ansible, OpenShift)
- Verify roles are displayed for each bundle
- Check that data is accurate and loads correctly

**Workspaces Management (M4 Features - Planned):**
- Navigate to "Workspaces" using the left navigation
- All M2 CRUD operations still available (Create, Edit, Move, Delete)
- Click workspace name to open detail page
- **Roles Tab (Write Access)**: Modify role bindings
  - Click "Add role" button
  - Select role to assign to workspace
  - Select principals (users/groups) to bind to that role
  - Submit and verify role binding appears
  - Click "Remove" on existing role binding
  - Confirm removal
- Switch between "Roles assigned in this workspace" and "Roles assigned in parent workspaces"
- Verify inherited role bindings cannot be modified (read-only)

**Interactive Features:**
- Use the **Controls panel** at the bottom to toggle feature flags and permissions
- Try enabling \`platform.rbac.workspaces\` to see M5 (master flag) behavior
- The story will automatically remount with new settings when controls change

### Architecture Notes

M4 introduces the concept of **workspace-scoped role bindings**, which differ from organization-level role assignments:
- **Organization Roles** (existing): Apply globally across all resources
- **Workspace Role Bindings** (M4): Apply only within specific workspace context
- This enables fine-grained access control per workspace

### Tips

- Open browser DevTools to see network requests and MSW handler logs
- Use the Controls panel to experiment with different permissions
- Check console for any errors or warnings
- This is a **placeholder** - actual implementation is pending

### Automated Checks

This story includes automated verification:
- ✅ My User Access page loads successfully
- ✅ Roles table is displayed with data
- ✅ Specific roles like "Workspace Administrator" are present
- ✅ Navigation works correctly
        `,
      },
    },
  },
};

/**
 * Workspace Role Bindings / Add role binding
 *
 * ⚠️ PLACEHOLDER - Not yet implemented
 *
 * Journey:
 * 1. Navigate to workspace detail page
 * 2. Click "Roles" tab
 * 3. Click "Add role" button
 * 4. Select a role from available roles
 * 5. Select principals (users/groups) to bind
 * 6. Submit and verify role binding appears in table
 */
export const AddRoleBinding: Story = {
  name: 'Workspace Role Bindings / Add role binding',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **PLACEHOLDER STORY** - This feature has not been implemented yet.

## Expected Behavior

Admins should be able to add role bindings to workspaces from the workspace detail page.

**Journey:**
1. Navigate to Workspaces page
2. Click on "Production" workspace
3. Switch to "Roles" tab
4. Click "Add role" button
5. Modal opens with role selector
6. Select a role (e.g., "Viewer")
7. Select principals (users/groups) to bind
8. Submit
9. Role binding appears in the Roles table

**UI Components Needed:**
- "Add role" button in Roles tab toolbar
- Add role binding modal/wizard
- Role selector dropdown
- Principal selector (users/groups)
- Success notification

**API Calls Expected:**
\`\`\`
POST /api/rbac/v2/workspaces/ws-1/role-bindings
{
  "role_id": "viewer-role",
  "principals": ["user1", "user2"],
  "workspace_id": "ws-1"
}
\`\`\`
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Placeholder: Navigate to workspace detail
    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Production');

    // TODO: Click workspace link to detail page
    // TODO: Switch to Roles tab
    // TODO: Click "Add role" button
    // TODO: Fill in role binding form
    // TODO: Submit and verify
  },
};

/**
 * Workspace Role Bindings / Remove role binding
 *
 * ⚠️ PLACEHOLDER - Not yet implemented
 *
 * Journey:
 * 1. Navigate to workspace detail page with existing role bindings
 * 2. Click "Roles" tab
 * 3. Open kebab menu for a role binding
 * 4. Click "Remove"
 * 5. Confirm deletion
 * 6. Verify role binding is removed from table
 */
export const RemoveRoleBinding: Story = {
  name: 'Workspace Role Bindings / Remove role binding',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **PLACEHOLDER STORY** - This feature has not been implemented yet.

## Expected Behavior

Admins should be able to remove role bindings from workspaces.

**Journey:**
1. Navigate to workspace detail page
2. Switch to "Roles" tab (shows existing role bindings)
3. Find a role binding row
4. Click kebab menu on that row
5. Click "Remove role binding"
6. Confirmation modal appears
7. Confirm deletion
8. Role binding removed from table
9. Success notification

**API Calls Expected:**
\`\`\`
DELETE /api/rbac/v2/workspaces/ws-1/role-bindings/binding-123
\`\`\`
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Placeholder
    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Production');

    // TODO: Implement when M4 is available
  },
};

/**
 * Workspace Role Bindings / Assign principals to role
 *
 * ⚠️ PLACEHOLDER - Not yet implemented
 *
 * Journey:
 * 1. Navigate to workspace detail page
 * 2. Click "Roles" tab
 * 3. Click on a role to expand details
 * 4. Click "Add principals" button
 * 5. Select users/groups
 * 6. Submit and verify principals are assigned
 */
export const AssignPrincipalsToRole: Story = {
  name: 'Workspace Role Bindings / Assign principals to role',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **PLACEHOLDER STORY** - This feature has not been implemented yet.

## Expected Behavior

Admins should be able to add users/groups to existing workspace role bindings.

**Journey:**
1. Navigate to workspace detail page
2. Switch to "Roles" tab
3. Expand a role binding to see assigned principals
4. Click "Add principals" or "Add members"
5. Modal opens with user/group selector
6. Select users and/or groups
7. Submit
8. Principals appear in the role binding

**API Calls Expected:**
\`\`\`
PATCH /api/rbac/v2/workspaces/ws-1/role-bindings/binding-123
{
  "add_principals": ["user3", "group1"]
}
\`\`\`
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Placeholder
    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Production');

    // TODO: Implement when M4 is available
  },
};

/**
 * Workspace Role Bindings / Remove principals from role
 *
 * ⚠️ PLACEHOLDER - Not yet implemented
 *
 * Journey:
 * 1. Navigate to workspace detail page
 * 2. Click "Roles" tab
 * 3. Expand a role binding
 * 4. Select principals to remove
 * 5. Click "Remove"
 * 6. Confirm and verify principals are removed
 */
export const RemovePrincipalsFromRole: Story = {
  name: 'Workspace Role Bindings / Remove principals from role',
  tags: ['test-skip'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **PLACEHOLDER STORY** - This feature has not been implemented yet.

## Expected Behavior

Admins should be able to remove users/groups from workspace role bindings.

**Journey:**
1. Navigate to workspace detail page
2. Switch to "Roles" tab
3. Expand a role binding to see assigned principals
4. Select checkboxes for users/groups to remove
5. Click "Remove" in bulk actions or kebab menu
6. Confirmation modal appears
7. Confirm
8. Principals removed from role binding

**API Calls Expected:**
\`\`\`
PATCH /api/rbac/v2/workspaces/ws-1/role-bindings/binding-123
{
  "remove_principals": ["user2"]
}
\`\`\`

Or potentially:
\`\`\`
DELETE /api/rbac/v2/workspaces/ws-1/role-bindings/binding-123/principals/user2
\`\`\`
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Placeholder
    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Production');

    // TODO: Implement when M4 is available
  },
};
