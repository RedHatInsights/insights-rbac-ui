/**
 * Create User Group Journey
 * Based on: static/mocks/Create user group/
 *
 * Features tested:
 * - Click "Create user group" button
 * - Fill in group name and description
 * - Add users to new group
 * - Add service accounts to new group
 * - Submit form and create group
 * - Verify created group in drawer
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { withFeatureGap } from '../_shared/components/FeatureGapBanner';
import { TEST_TIMEOUTS, resetStoryState } from '../_shared/helpers';
import {
  clickCancelButton,
  clickCreateUserGroupButton,
  clickSubmitButton,
  defaultHandlers,
  fillGroupDescription,
  fillGroupName,
  getDrawerScope,
  mockGroups,
  mockServiceAccounts,
  mockUsers,
  openGroupDrawer,
  verifyNoApiCalls,
  verifyUserGroupsTabSelected,
} from './_shared';

// =============================================================================
// API SPIES
// =============================================================================
const createGroupSpy = fn();
const listGroupsSpy = fn();
const addMembersSpy = fn();
const addServiceAccountsSpy = fn();

// =============================================================================
// MUTABLE STATE FOR TEST ISOLATION
// =============================================================================
interface CreatedGroup {
  uuid: string;
  name: string;
  description: string;
  principalCount: number;
  roleCount: number;
  serviceAccountCount: number;
  workspaceCount: number;
  created: string;
  modified: string;
  platform_default: boolean;
  admin_default: boolean;
  system: boolean;
}

// Mutable state to track created groups during tests
const createdGroups: CreatedGroup[] = [];
// Track members added to groups (groupId -> usernames)
const groupMembers: Record<string, string[]> = {};
// Track service accounts added to groups (groupId -> clientIds)
const groupServiceAccounts: Record<string, string[]> = {};

/**
 * Resets the mutable state for test isolation
 */
const resetCreatedGroups = () => {
  createdGroups.length = 0;
  for (const key of Object.keys(groupMembers)) {
    delete groupMembers[key];
  }
  for (const key of Object.keys(groupServiceAccounts)) {
    delete groupServiceAccounts[key];
  }
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Selects a user in the create form's Users table by clicking their checkbox
 */
async function selectUserInForm(canvas: ReturnType<typeof within>, user: ReturnType<typeof userEvent.setup>, username: string): Promise<void> {
  const userText = await canvas.findByText(username);
  const userRow = userText.closest('tr');
  expect(userRow).not.toBeNull();
  const checkbox = within(userRow as HTMLElement).getByRole('checkbox');
  await user.click(checkbox);
}

/**
 * Selects a service account in the create form's Service Accounts table
 */
async function selectServiceAccountInForm(
  canvas: ReturnType<typeof within>,
  user: ReturnType<typeof userEvent.setup>,
  clientIdOrName: string,
): Promise<void> {
  const saText = await canvas.findByText(clientIdOrName);
  const saRow = saText.closest('tr');
  expect(saRow).not.toBeNull();
  const checkbox = within(saRow as HTMLElement).getByRole('checkbox');
  await user.click(checkbox);
}

/**
 * Switches to the Service Accounts tab in the create form
 */
async function switchToServiceAccountsTab(canvas: ReturnType<typeof within>, user: ReturnType<typeof userEvent.setup>): Promise<void> {
  // Find the Service accounts tab within the form (not the drawer)
  const serviceAccountsTab = await canvas.findByRole('tab', { name: /service accounts/i });
  await user.click(serviceAccountsTab);
  await delay(TEST_TIMEOUTS.AFTER_CLICK);
}

// =============================================================================
// MSW HANDLERS WITH SPIES
// =============================================================================
const createGroupSpyHandler = http.post('/api/rbac/v1/groups/', async ({ request }) => {
  const body = (await request.json()) as { name: string; description?: string };
  createGroupSpy(body);

  const newGroup: CreatedGroup = {
    uuid: `group-new-${Date.now()}`,
    name: body.name,
    description: body.description || '',
    principalCount: 0,
    roleCount: 0,
    serviceAccountCount: 0,
    workspaceCount: 0,
    created: new Date().toISOString(),
    modified: new Date().toISOString(),
    platform_default: false,
    admin_default: false,
    system: false,
  };

  // Add to mutable state so it appears in subsequent list requests
  createdGroups.push(newGroup);
  groupMembers[newGroup.uuid] = [];
  groupServiceAccounts[newGroup.uuid] = [];

  return HttpResponse.json(newGroup, { status: 201 });
});

const addMembersHandler = http.post('/api/rbac/v1/groups/:uuid/principals/', async ({ request, params }) => {
  const groupId = params.uuid as string;
  const body = (await request.json()) as { principals: Array<{ username: string }> };

  addMembersSpy({ groupId, principals: body.principals });

  // Track members in mutable state
  if (!groupMembers[groupId]) {
    groupMembers[groupId] = [];
  }
  body.principals.forEach((p) => {
    if (!groupMembers[groupId].includes(p.username)) {
      groupMembers[groupId].push(p.username);
    }
  });

  // Update principal count on created group
  const createdGroup = createdGroups.find((g) => g.uuid === groupId);
  if (createdGroup) {
    createdGroup.principalCount = groupMembers[groupId].length;
  }

  return HttpResponse.json({ data: body.principals }, { status: 200 });
});

const addServiceAccountsHandler = http.post('/api/rbac/v2/groups/:uuid/service-accounts/', async ({ request, params }) => {
  const groupId = params.uuid as string;
  const body = (await request.json()) as { service_accounts: Array<{ clientId: string }> };

  addServiceAccountsSpy({ groupId, serviceAccounts: body.service_accounts });

  // Track service accounts in mutable state
  if (!groupServiceAccounts[groupId]) {
    groupServiceAccounts[groupId] = [];
  }
  body.service_accounts.forEach((sa) => {
    if (!groupServiceAccounts[groupId].includes(sa.clientId)) {
      groupServiceAccounts[groupId].push(sa.clientId);
    }
  });

  // Update service account count on created group
  const createdGroup = createdGroups.find((g) => g.uuid === groupId);
  if (createdGroup) {
    createdGroup.serviceAccountCount = groupServiceAccounts[groupId].length;
  }

  return HttpResponse.json({ data: body.service_accounts }, { status: 200 });
});

const listGroupsSpyHandler = http.get('/api/rbac/v1/groups/', async ({ request }) => {
  await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);
  const nameFilter = url.searchParams.get('name');
  const username = url.searchParams.get('username');

  listGroupsSpy({ limit, offset, nameFilter, username });

  // Combine mock groups with any newly created groups
  let allGroups = [...mockGroups, ...createdGroups];

  // Filter by name
  if (nameFilter) {
    allGroups = allGroups.filter((g) => g.name.toLowerCase().includes(nameFilter.toLowerCase()));
  }

  // Filter by username (groups user belongs to)
  if (username) {
    allGroups = allGroups.filter((g) => {
      // Check if user is in any of the created groups
      const createdGroup = createdGroups.find((cg) => cg.uuid === g.uuid);
      if (createdGroup) {
        return groupMembers[g.uuid]?.includes(username);
      }
      return false; // For mock groups, we'll handle membership separately
    });
  }

  const paginatedGroups = allGroups.slice(offset, offset + limit);

  return HttpResponse.json({
    data: paginatedGroups,
    meta: {
      count: allGroups.length,
      limit,
      offset,
    },
  });
});

// Handler for group members/service accounts (used in drawer)
// This handler serves both users and service accounts based on principalType query param
const groupMembersHandler = http.get('/api/rbac/v1/groups/:uuid/principals/', async ({ request, params }) => {
  const groupId = params.uuid as string;
  const url = new URL(request.url);
  const principalType = url.searchParams.get('principal_type');

  // If principalType is 'service-account', return service accounts
  if (principalType === 'service-account') {
    const sas = groupServiceAccounts[groupId] || [];
    const saData = sas.map((clientId) => {
      const sa = mockServiceAccounts.find((s) => s.clientId === clientId);
      return sa || { clientId, name: '', description: '' };
    });
    return HttpResponse.json({
      data: saData,
      meta: { count: saData.length },
    });
  }

  // Otherwise return users
  const members = groupMembers[groupId] || [];
  const memberData = members.map((username) => {
    const user = mockUsers.find((u) => u.username === username);
    return user || { username, email: '', first_name: '', last_name: '' };
  });

  return HttpResponse.json({
    data: memberData,
    meta: { count: memberData.length },
  });
});

// Legacy handler for group service accounts (keep for backward compatibility)
const groupServiceAccountsHandler = http.get('/api/rbac/v1/groups/:uuid/service_accounts/', async ({ params }) => {
  const groupId = params.uuid as string;
  const sas = groupServiceAccounts[groupId] || [];

  const saData = sas.map((clientId) => {
    const sa = mockServiceAccounts.find((s) => s.clientId === clientId);
    return sa || { clientId, name: '', description: '' };
  });

  return HttpResponse.json({
    data: saData,
    meta: { count: saData.length },
  });
});

// Handler for users list in the form
const usersListHandler = http.get('/api/rbac/v1/principals/', async ({ request }) => {
  await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);
  const url = new URL(request.url);
  const limit = parseInt(url.searchParams.get('limit') || '20', 10);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  return HttpResponse.json({
    data: mockUsers.slice(offset, offset + limit),
    meta: { count: mockUsers.length, limit, offset },
  });
});

// Handler for service accounts list in the form
const serviceAccountsListHandler = http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', async () => {
  await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);
  return HttpResponse.json(mockServiceAccounts);
});

const serviceAccountsListHandlerStage = http.get('https://sso.stage.redhat.com/realms/redhat-external/apis/service_accounts/v1', async () => {
  await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);
  return HttpResponse.json(mockServiceAccounts);
});

// =============================================================================
// STORY META
// =============================================================================
const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Access Management/Create user group',
  tags: ['access-management', 'user-groups', 'form'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
  ],
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups/user-groups',
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
    orgAdmin: true,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.common.userstable': true,
    'platform.rbac.workspaces-organization-management': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.workspaces-organization-management': true,
      'platform.rbac.common.userstable': true,
    }),
    msw: {
      handlers: [
        // Spy handlers FIRST to intercept before defaultHandlers
        createGroupSpyHandler,
        addMembersHandler,
        addServiceAccountsHandler,
        listGroupsSpyHandler,
        groupMembersHandler,
        groupServiceAccountsHandler,
        usersListHandler,
        serviceAccountsListHandler,
        serviceAccountsListHandlerStage,
        // Filter out handlers we're replacing
        ...defaultHandlers.filter((h) => {
          const info = h.info as { path?: string };
          const path = info?.path?.toString() || '';
          return (
            !path.includes('/user-access/groups/') &&
            !path.includes('/principals/') &&
            !path.includes('/service-accounts/') &&
            !path.includes('sso.redhat.com') &&
            !path.includes('sso.stage.redhat.com')
          );
        }),
      ],
    },
    docs: {
      description: {
        component: `
# Create User Group Journey

Tests the workflow for creating a new user group with users and service accounts.

## Design Reference

| Create button | Create form |
|:---:|:---:|
| [![Create button](/mocks/Create%20user%20group/Frame%20126.png)](/mocks/Create%20user%20group/Frame%20126.png) | [![Create form](/mocks/Create%20user%20group/Frame%20129.png)](/mocks/Create%20user%20group/Frame%20129.png) |

| Add users step | Add service accounts step |
|:---:|:---:|
| [![Add users step](/mocks/Create%20user%20group/Frame%20189.png)](/mocks/Create%20user%20group/Frame%20189.png) | [![Add service accounts step](/mocks/Create%20user%20group/Frame%20192.png)](/mocks/Create%20user%20group/Frame%20192.png) |

## API Spies
- \`createGroupSpy\` - Tracks POST /api/rbac/v1/groups/ calls
- \`addMembersSpy\` - Tracks POST /api/rbac/v1/groups/:uuid/principals/ calls
- \`listGroupsSpy\` - Tracks GET /api/rbac/v1/groups/ calls

## Features
| Feature | Status | API |
|---------|--------|-----|
| Create user group button | ✅ Implemented | - |
| Group name field | ✅ Implemented | - |
| Description field | ✅ Implemented | - |
| Add users to group | ✅ Implemented | V1 |
| List service accounts | ✅ Implemented | SSO API |
| Add service accounts to group | ⚠️ GAP | V2 (guessed) |
| Create group API | ✅ Implemented | V1 |
| Success redirect | ✅ Implemented | - |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Complete create group flow with users and service accounts
 *
 * Tests the full workflow from clicking create to form submission and verification
 */
export const CompleteFlow: Story = {
  name: '⚠️ [V2 GAP] Complete Flow',
  tags: ['autodocs', 'gap:guessed-v2-api'],
  decorators: [
    withFeatureGap({
      title: 'Add Service Accounts to Group - Guessed V2 API',
      currentState: (
        <>
          <p style={{ margin: '0 0 8px 0' }}>
            <strong>Guessed Endpoint:</strong>
          </p>
          <code
            style={{
              display: 'block',
              background: 'rgba(0,0,0,0.08)',
              padding: '4px 8px',
              borderRadius: '3px',
              fontSize: '11px',
              marginBottom: '8px',
            }}
          >
            POST /api/rbac/v2/groups/:uuid/service-accounts/
          </code>
          <p style={{ margin: '8px 0 4px 0' }}>
            <strong>Request Body:</strong>
          </p>
          <pre
            style={{
              background: 'rgba(0,0,0,0.08)',
              padding: '8px',
              borderRadius: '3px',
              fontSize: '10px',
              margin: '0 0 8px 0',
              whiteSpace: 'pre-wrap',
            }}
          >
            {`{
  "service_accounts": [
    { "clientId": "sa-12345-abcde" },
    { "clientId": "sa-67890-fghij" }
  ]
}`}
          </pre>
          <p style={{ margin: '8px 0 4px 0' }}>
            <strong>Expected Response:</strong>
          </p>
          <pre style={{ background: 'rgba(0,0,0,0.08)', padding: '8px', borderRadius: '3px', fontSize: '10px', margin: 0, whiteSpace: 'pre-wrap' }}>
            {`{
  "data": [
    { "clientId": "sa-12345-abcde" },
    { "clientId": "sa-67890-fghij" }
  ],
  "meta": { "count": 2 }
}`}
          </pre>
        </>
      ),
      expectedBehavior: [
        'This endpoint is guessed based on the principals API pattern',
        'The actual V2 RBAC API may use a different endpoint or payload format',
      ],
    }),
  ],
  parameters: {
    docs: {
      description: {
        story: `
⚠️ **V2 GAP: Uses guessed API for service accounts**

Tests the complete "Create user group" workflow including user and service account selection:

1. Click "Create user group" button
2. Fill in group name and description
3. Select users to add to the group (adumble, bbunny)
4. Switch to Service Accounts tab
5. Select service accounts to add (CI/CD Pipeline, Monitoring Agent)
6. Submit form
7. Verify createGroupSpy was called with correct data
8. Verify addMembersSpy was called with selected users
9. Verify addServiceAccountsSpy was called with selected service accounts
10. Verify redirect back to groups table
11. Open drawer for created group
12. Verify selected users appear in drawer
13. Verify selected service accounts appear in drawer

**Guessed APIs used:**
- \`POST /api/rbac/v2/groups/:uuid/service-accounts/\` (for service accounts) [guessed V2 API]

**Design references:**
- Frame 126: Create button
- Frame 129: Create form
- Frame 189: Add users
- Frame 192: Add service accounts
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    resetCreatedGroups();
    createGroupSpy.mockClear();
    addMembersSpy.mockClear();
    addServiceAccountsSpy.mockClear();
    listGroupsSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Use unique name to avoid conflicts with previous runs
    const testGroupName = `Test Group ${Date.now()}`;
    const testGroupDescription = 'This is a test group for the user journey';
    // Users to select: adumble, bbunny
    // Service accounts to select: CI/CD Pipeline, Monitoring Agent

    // Wait for data to load
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Step 1: Click "Create user group" button
    await clickCreateUserGroupButton(canvas, user);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Step 2: Verify we're on the create form page
    await expect(canvas.findByRole('heading', { name: /Create user group/i })).resolves.toBeInTheDocument();

    // Step 3: Fill in group name
    await fillGroupName(canvas, user, testGroupName);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Step 4: Fill in description
    await fillGroupDescription(canvas, user, testGroupDescription);
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Step 5: Wait for users to load in the form and select users
    await expect(canvas.findByText('adumble')).resolves.toBeInTheDocument();

    // Select first user (adumble)
    await selectUserInForm(canvas, user, 'adumble');
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Select second user (bbunny)
    await selectUserInForm(canvas, user, 'bbunny');
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Step 6: Switch to Service Accounts tab
    await switchToServiceAccountsTab(canvas, user);

    // Step 7: Wait for service accounts to load and select them
    await expect(canvas.findByText('CI/CD Pipeline')).resolves.toBeInTheDocument();

    // Select first service account (CI/CD Pipeline)
    await selectServiceAccountInForm(canvas, user, 'CI/CD Pipeline');
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Select second service account (Monitoring Agent)
    await selectServiceAccountInForm(canvas, user, 'Monitoring Agent');
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Step 8: Submit form
    await clickSubmitButton(canvas, user);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // ==========================================================================
    // API SPY VERIFICATION
    // ==========================================================================

    // Verify createGroupSpy: POST /api/rbac/v1/groups/
    // Should be called once with the group name and description
    expect(createGroupSpy).toHaveBeenCalledTimes(1);
    expect(createGroupSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: testGroupName,
        description: testGroupDescription,
      }),
    );

    // Verify listGroupsSpy: GET /api/rbac/v1/groups/
    // Should be called at least twice: initial load + refresh after create
    expect(listGroupsSpy).toHaveBeenCalled();
    // First call: initial page load with default params
    expect(listGroupsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        limit: 20,
        offset: 0,
      }),
    );

    // ==========================================================================
    // VERIFY MEMBERS WERE ADDED
    // ==========================================================================

    // The addMembersSpy should have been called with the selected users
    expect(addMembersSpy).toHaveBeenCalled();
    expect(addMembersSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        principals: expect.arrayContaining([expect.objectContaining({ username: 'adumble' }), expect.objectContaining({ username: 'bbunny' })]),
      }),
    );

    // ==========================================================================
    // VERIFY SERVICE ACCOUNTS WERE ADDED
    // ==========================================================================

    // The addServiceAccountsSpy should have been called with the selected service accounts
    // Note: The clientIds are 'pipeline-client-001' and 'monitoring-agent-002'
    expect(addServiceAccountsSpy).toHaveBeenCalled();
    expect(addServiceAccountsSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        serviceAccounts: expect.arrayContaining([
          expect.objectContaining({ clientId: 'pipeline-client-001' }),
          expect.objectContaining({ clientId: 'monitoring-agent-002' }),
        ]),
      }),
    );

    // ==========================================================================
    // VERIFY SUCCESS NOTIFICATIONS
    // ==========================================================================

    // Notifications are rendered at document.body level, not within the canvas
    const body = within(document.body);

    // Verify group created notification
    await waitFor(
      async () => {
        const groupNotification = body.getByText(/group created successfully/i);
        await expect(groupNotification).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    // Verify members added notification
    await waitFor(
      async () => {
        const membersNotification = body.getByText(/success adding members to group/i);
        await expect(membersNotification).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    // Verify service accounts added notification
    await waitFor(
      async () => {
        const serviceAccountsNotification = body.getByText(/success adding service accounts to group/i);
        await expect(serviceAccountsNotification).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );

    // ==========================================================================
    // POST-SUBMISSION VERIFICATION
    // ==========================================================================

    // Step 10: Wait for redirect back to groups table
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);
    await verifyUserGroupsTabSelected(canvas);

    // Step 11: Find and click on the newly created group to open drawer
    await openGroupDrawer(canvas, user, testGroupName);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Step 12: Verify group details in drawer
    const drawerScope = getDrawerScope(context.canvasElement);

    // Verify group name is shown
    await expect(drawerScope.findByText(testGroupName)).resolves.toBeInTheDocument();

    // Step 13: Verify the Users tab is selected and shows the selected users
    const usersTab = await drawerScope.findByRole('tab', { name: /^users$/i });
    expect(usersTab).toBeInTheDocument();
    await user.click(usersTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify the users we selected during creation are shown in the drawer
    await expect(drawerScope.findByText('adumble')).resolves.toBeInTheDocument();
    await expect(drawerScope.findByText('bbunny')).resolves.toBeInTheDocument();

    // Step 14: Verify service accounts are shown in the drawer
    const serviceAccountsTab = await drawerScope.findByRole('tab', { name: /service accounts/i });
    await user.click(serviceAccountsTab);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify the service accounts we selected during creation are shown in the drawer
    // Note: mockServiceAccounts uses 'name' as the display field
    await expect(drawerScope.findByText('CI/CD Pipeline')).resolves.toBeInTheDocument();
    await expect(drawerScope.findByText('Monitoring Agent')).resolves.toBeInTheDocument();
  },
};

/**
 * Create group with only name (minimum required)
 *
 * Tests creating a group with just the name field filled
 */
export const MinimalCreation: Story = {
  name: 'Minimal Creation (Name Only)',
  parameters: {
    docs: {
      description: {
        story: `
Tests creating a group with only the required name field.

**Expected behavior:**
1. Fill in name only
2. Submit form
3. Group is created
4. Redirected to groups table
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    resetCreatedGroups();
    createGroupSpy.mockClear();
    listGroupsSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Navigate to create form
    await clickCreateUserGroupButton(canvas, user);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Fill in only the name
    await fillGroupName(canvas, user, 'Minimal Group');
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Submit form
    await clickSubmitButton(canvas, user);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // ==========================================================================
    // API SPY VERIFICATION
    // ==========================================================================

    // Verify createGroupSpy: POST /api/rbac/v1/groups/
    expect(createGroupSpy).toHaveBeenCalledTimes(1);
    expect(createGroupSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Minimal Group',
      }),
    );

    // Verify listGroupsSpy was called for initial load
    expect(listGroupsSpy).toHaveBeenCalled();

    // Verify redirect
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);
    await verifyUserGroupsTabSelected(canvas);
  },
};

/**
 * Validation - required name
 *
 * Tests that the name field is required
 */
export const ValidationRequiredName: Story = {
  name: 'Validation - Required Name',
  parameters: {
    docs: {
      description: {
        story: `
Tests that the group name is required.

**Expected behavior:**
1. Leave name empty
2. Try to submit
3. Validation error appears
4. Form does not submit
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    resetCreatedGroups();
    createGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Navigate to create form
    await clickCreateUserGroupButton(canvas, user);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Try to submit without filling name
    const submitButton = await canvas.findByRole('button', { name: /submit|create|save/i });

    // Submit button should be disabled when form is pristine or invalid
    expect(submitButton).toBeDisabled();

    // Verify no API call was made
    verifyNoApiCalls(createGroupSpy);
  },
};

/**
 * Validation - duplicate name
 *
 * Tests that duplicate group names are rejected
 */
export const ValidationDuplicateName: Story = {
  name: 'Validation - Duplicate Name',
  parameters: {
    docs: {
      description: {
        story: `
Tests that duplicate group names show validation error.

**Expected behavior:**
1. Enter an existing group name
2. Move focus away (blur) to trigger validation
3. Validation error appears
4. Form cannot be submitted
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    resetCreatedGroups();
    createGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Navigate to create form
    await clickCreateUserGroupButton(canvas, user);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Enter duplicate name (Admin group exists in mockGroups)
    await fillGroupName(canvas, user, 'Admin group');

    // Blur the name field to trigger validation (tab to description)
    await user.tab();
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify validation error appears
    await expect(canvas.findByText(/already exists|taken/i)).resolves.toBeInTheDocument();

    // Submit button should be disabled
    const submitButton = await canvas.findByRole('button', { name: /submit|create|save/i });
    expect(submitButton).toBeDisabled();

    // Verify no API call was made
    verifyNoApiCalls(createGroupSpy);
  },
};

/**
 * Cancel creation
 *
 * Tests canceling the create form
 */
export const CancelCreation: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Tests canceling the create group form.

**Expected behavior:**
1. Open create form
2. Fill in some data
3. Click Cancel
4. Return to groups table
5. No API call made
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState();
    resetCreatedGroups();
    createGroupSpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for data to load
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Navigate to create form
    await clickCreateUserGroupButton(canvas, user);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Fill in some data
    await fillGroupName(canvas, user, 'Test Group');
    await delay(TEST_TIMEOUTS.AFTER_MENU_OPEN);

    // Click Cancel
    await clickCancelButton(canvas, user);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Verify we're back on groups table
    await verifyUserGroupsTabSelected(canvas);
    await expect(canvas.findByText('Admin group')).resolves.toBeInTheDocument();

    // Verify no API call was made
    verifyNoApiCalls(createGroupSpy);
  },
};
