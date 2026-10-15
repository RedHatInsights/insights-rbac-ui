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
import { HttpResponse, http } from 'msw';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { resetStoryState } from '../_shared/helpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';
import { clickTab, selectTableRow, waitForContentReady, waitForDrawer, waitForNotification } from '../../test-utils/interactionHelpers';
import {
  clickCancelButton,
  clickCreateUserGroupButton,
  clickSubmitButton,
  fillGroupDescription,
  fillGroupName,
  mockGroups,
  mockServiceAccounts,
  mockUsers,
  openGroupDrawer,
  v2DefaultHandlers,
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

const addPrincipalsHandler = http.post('/api/rbac/v1/groups/:uuid/principals/', async ({ request, params }) => {
  const groupId = params.uuid as string;
  const body = (await request.json()) as { principals: Array<{ username?: string; clientId?: string; type?: string }> };

  const isServiceAccountRequest = body.principals.some((p) => p.type === 'service-account');

  if (isServiceAccountRequest) {
    addServiceAccountsSpy({ groupId, serviceAccounts: body.principals.map((p) => ({ clientId: p.clientId })) });

    if (!groupServiceAccounts[groupId]) {
      groupServiceAccounts[groupId] = [];
    }
    body.principals.forEach((p) => {
      if (p.clientId && !groupServiceAccounts[groupId].includes(p.clientId)) {
        groupServiceAccounts[groupId].push(p.clientId);
      }
    });

    const createdGroup = createdGroups.find((g) => g.uuid === groupId);
    if (createdGroup) {
      createdGroup.serviceAccountCount = groupServiceAccounts[groupId].length;
    }
  } else {
    addMembersSpy({ groupId, principals: body.principals });

    if (!groupMembers[groupId]) {
      groupMembers[groupId] = [];
    }
    body.principals.forEach((p) => {
      if (p.username && !groupMembers[groupId].includes(p.username)) {
        groupMembers[groupId].push(p.username);
      }
    });

    const createdGroup = createdGroups.find((g) => g.uuid === groupId);
    if (createdGroup) {
      createdGroup.principalCount = groupMembers[groupId].length;
    }
  }

  return HttpResponse.json({ data: body.principals }, { status: 200 });
});

const listGroupsSpyHandler = http.get('/api/rbac/v1/groups/', async ({ request }) => {
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
  return HttpResponse.json(mockServiceAccounts);
});

const serviceAccountsListHandlerStage = http.get('https://sso.stage.redhat.com/realms/redhat-external/apis/service_accounts/v1', async () => {
  return HttpResponse.json(mockServiceAccounts);
});

// =============================================================================
// STORY META
// =============================================================================
const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Users and Groups/Create User Group',
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
    'platform.rbac.workspaces': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.workspaces': true,
    }),
    msw: {
      handlers: [
        // Spy handlers FIRST to intercept before v2DefaultHandlers
        createGroupSpyHandler,
        addPrincipalsHandler,
        listGroupsSpyHandler,
        groupMembersHandler,
        groupServiceAccountsHandler,
        usersListHandler,
        serviceAccountsListHandler,
        serviceAccountsListHandlerStage,
        // Filter out handlers we're replacing
        ...v2DefaultHandlers.filter((h) => {
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
| Add service accounts to group | ✅ Implemented | V1 |
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
  tags: ['autodocs'],
  decorators: [],
  parameters: {
    docs: {
      description: {
        story: `
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
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    // Use unique name to avoid conflicts with previous runs
    const testGroupName = `Test Group ${Date.now()}`;
    const testGroupDescription = 'This is a test group for the user journey';

    await step('Reset state', async () => {
      await resetStoryState();
      resetCreatedGroups();
      createGroupSpy.mockClear();
      addMembersSpy.mockClear();
      addServiceAccountsSpy.mockClear();
      listGroupsSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to page', async () => {
      await canvas.findByRole('button', { name: /create user group/i });
    });

    await step('Open create form', async () => {
      await clickCreateUserGroupButton(canvas, user);
      await expect(canvas.findByRole('heading', { name: /Create user group/i })).resolves.toBeInTheDocument();
    });

    await step('Fill form fields', async () => {
      await fillGroupName(canvas, user, testGroupName);
      await fillGroupDescription(canvas, user, testGroupDescription);
    });

    await step('Select users', async () => {
      await expect(canvas.findByText('adumble')).resolves.toBeInTheDocument();
      await selectTableRow(user, canvas, 'adumble');
      await selectTableRow(user, canvas, 'bbunny');
    });

    await step('Switch to Service Accounts and select', async () => {
      await clickTab(user, canvas, /service accounts/i);
      await expect(canvas.findByText('CI/CD Pipeline')).resolves.toBeInTheDocument();
      await selectTableRow(user, canvas, 'CI/CD Pipeline');
      await selectTableRow(user, canvas, 'Monitoring Agent');
    });

    await step('Submit form', async () => {
      await clickSubmitButton(canvas, user);
    });

    await step('Verify create API call', async () => {
      await waitFor(
        () => {
          expect(createGroupSpy).toHaveBeenCalledTimes(1);
          expect(createGroupSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              name: testGroupName,
              description: testGroupDescription,
            }),
          );
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Verify list API call', async () => {
      await waitFor(
        () => {
          expect(listGroupsSpy).toHaveBeenCalled();
          expect(listGroupsSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              limit: 20,
              offset: 0,
            }),
          );
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Verify add members API call', async () => {
      await waitFor(
        () => {
          expect(addMembersSpy).toHaveBeenCalled();
          expect(addMembersSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              principals: expect.arrayContaining([expect.objectContaining({ username: 'adumble' }), expect.objectContaining({ username: 'bbunny' })]),
            }),
          );
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Verify add service accounts API call', async () => {
      await waitFor(
        () => {
          expect(addServiceAccountsSpy).toHaveBeenCalled();
          expect(addServiceAccountsSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              serviceAccounts: expect.arrayContaining([
                expect.objectContaining({ clientId: 'pipeline-client-001' }),
                expect.objectContaining({ clientId: 'monitoring-agent-002' }),
              ]),
            }),
          );
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Verify success notifications', async () => {
      await waitForNotification(/group created successfully/i);
      await waitForNotification(/success adding members to group/i);
      await waitForNotification(/success adding service accounts to group/i);
    });

    await step('Verify redirect to groups table', async () => {
      await verifyUserGroupsTabSelected(canvas);
    });

    await step('Open group drawer', async () => {
      await openGroupDrawer(canvas, user, testGroupName, { timeout: TEST_TIMEOUTS.POST_MUTATION_REFRESH });
    });

    await step('Verify group details in drawer', async () => {
      const drawerScope = await waitForDrawer();
      // Drawer content loads after API mutation
      await expect(drawerScope.findByText(testGroupName, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).resolves.toBeInTheDocument();

      await clickTab(user, drawerScope, /^users$/i);
      await expect(drawerScope.findByText('adumble')).resolves.toBeInTheDocument();
      await expect(drawerScope.findByText('bbunny')).resolves.toBeInTheDocument();

      await clickTab(user, drawerScope, /service accounts/i);
      await expect(drawerScope.findByText('CI/CD Pipeline')).resolves.toBeInTheDocument();
      await expect(drawerScope.findByText('Monitoring Agent')).resolves.toBeInTheDocument();
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      resetCreatedGroups();
      createGroupSpy.mockClear();
      listGroupsSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to create form', async () => {
      await canvas.findByRole('button', { name: /create user group/i });
      await clickCreateUserGroupButton(canvas, user);
    });

    await step('Fill name only', async () => {
      await fillGroupName(canvas, user, 'Minimal Group');
    });

    await step('Submit form', async () => {
      await clickSubmitButton(canvas, user);
    });

    await step('Verify API calls', async () => {
      await waitFor(
        () => {
          expect(createGroupSpy).toHaveBeenCalledTimes(1);
          expect(createGroupSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              name: 'Minimal Group',
            }),
          );
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
      await waitFor(
        () => {
          expect(listGroupsSpy).toHaveBeenCalled();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Verify redirect to groups table', async () => {
      await verifyUserGroupsTabSelected(canvas);
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      resetCreatedGroups();
      createGroupSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to create form', async () => {
      await canvas.findByRole('button', { name: /create user group/i });
      await clickCreateUserGroupButton(canvas, user);
    });

    await step('Verify submit disabled and no API call', async () => {
      const submitButton = await canvas.findByRole('button', { name: /submit|create|save/i });
      expect(submitButton).toBeDisabled();
      verifyNoApiCalls(createGroupSpy);
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      resetCreatedGroups();
      createGroupSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to create form', async () => {
      await canvas.findByRole('button', { name: /create user group/i });
      await clickCreateUserGroupButton(canvas, user);
    });

    await step('Enter duplicate name and blur', async () => {
      await fillGroupName(canvas, user, 'Admin group');
      await user.tab();
    });

    await step('Verify validation error and no API call', async () => {
      await expect(canvas.findByText(/already exists|taken/i)).resolves.toBeInTheDocument();
      const submitButton = await canvas.findByRole('button', { name: /submit|create|save/i });
      expect(submitButton).toBeDisabled();
      verifyNoApiCalls(createGroupSpy);
    });
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
      resetCreatedGroups();
      createGroupSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to create form', async () => {
      await canvas.findByRole('button', { name: /create user group/i });
      await clickCreateUserGroupButton(canvas, user);
    });

    await step('Fill form and click Cancel', async () => {
      await fillGroupName(canvas, user, 'Test Group');
      await clickCancelButton(canvas, user);
    });

    await step('Verify redirect and no API call', async () => {
      await verifyUserGroupsTabSelected(canvas);
      await expect(canvas.findByText('Admin group')).resolves.toBeInTheDocument();
      verifyNoApiCalls(createGroupSpy);
    });
  },
};
