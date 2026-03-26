import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import {
  KESSEL_PERMISSIONS,
  KesselAppEntryWithRouter,
  type WorkspacePermissionsOverride,
  createDynamicEnvironment,
} from '../_shared/components/KesselAppEntryWithRouter';
import { navigateToPage, resetStoryState } from '../_shared/helpers';
import { waitForContentReady, waitForDrawer } from '../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';
import { expandWorkspaceRow, waitForPageToLoad } from '../../test-utils/tableHelpers';
import { expandWorkspaceInTree, openWorkspaceKebabMenu, openWorkspaceWizard } from '../../test-utils/workspaceHelpers';
import { createV2MockDb } from '../../v2/data/mocks/db';
import { createV2Handlers } from '../../v2/data/mocks/handlers';
import { DEFAULT_GROUPS, DEFAULT_USERS } from '../../shared/data/mocks/seed';
import { DEFAULT_WORKSPACES, WS_DEFAULT, WS_DEVELOPMENT, WS_PRODUCTION, WS_ROOT, WS_STAGING } from '../../v2/data/mocks/seed';
import {
  KESSEL_GROUP_PROD_ADMINS,
  KESSEL_GROUP_VIEWERS,
  defaultKesselGroupMembers,
  defaultKesselGroupRoles,
  defaultKesselGroups,
  defaultKesselRoles,
} from '../../v2/data/mocks/kesselGroupsRoles.fixtures';
import { workspaceRoleBindings } from '../../v2/data/mocks/workspaceRoleBindings.fixtures';

type Story = StoryObj<typeof meta>;

interface StoryArgs {
  typingDelay?: number;
  orgAdmin?: boolean;
  permissions?: readonly string[];
  workspacePermissions?: WorkspacePermissionsOverride;
  'platform.rbac.workspaces-list'?: boolean;
  'platform.rbac.workspace-hierarchy'?: boolean;
  'platform.rbac.workspaces-role-bindings'?: boolean;
  'platform.rbac.workspaces-role-bindings-write'?: boolean;
  'platform.rbac.workspaces'?: boolean;
  initialRoute?: string;
}

const NON_ROOT_IDS = ['default-1', 'ws-1', 'ws-2', 'ws-3'];

const allRelations = (ids: string[]): WorkspacePermissionsOverride => ({
  view: ids,
  edit: ids,
  delete: ids,
  create: ids,
  move: ids,
});

const ALL_FLAGS = {
  'platform.rbac.workspaces-list': true,
  'platform.rbac.workspace-hierarchy': true,
  'platform.rbac.workspaces-role-bindings': true,
  'platform.rbac.workspaces-role-bindings-write': true,
  'platform.rbac.workspaces': true,
} as const;

const db = createV2MockDb({
  groups: [...DEFAULT_GROUPS.filter((g) => g.system), ...defaultKesselGroups],
  workspaces: DEFAULT_WORKSPACES,
  roles: defaultKesselRoles,
  users: DEFAULT_USERS,
  groupMembers: defaultKesselGroupMembers,
  groupRoles: defaultKesselGroupRoles,
  roleBindings: workspaceRoleBindings,
});
const mswHandlers = createV2Handlers(db);

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Workspaces/Permissions',
  tags: ['prod-v2-org-admin', 'workspace-permissions'],
  decorators: [
    ((Story, context: StoryContext<StoryArgs>) => {
      db.reset();
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    }) as Decorator<StoryArgs>,
  ],
  args: {
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
    orgAdmin: true,
    workspacePermissions: allRelations(NON_ROOT_IDS),
    ...ALL_FLAGS,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
      orgAdmin: true,
      workspacePermissions: allRelations(NON_ROOT_IDS),
      ...ALL_FLAGS,
    }),
    msw: {
      handlers: mswHandlers,
    },
    docs: {
      description: {
        component: `
# Workspace Permission Boundary Tests

Tests that per-workspace Kessel permissions are enforced across the UI:
table links, kebab actions, detail page actions, and create-workspace parent selector.

Each story configures a specific \`workspacePermissions\` override so that only
certain workspaces are allowed for certain relations. The tests assert that the
UI respects these constraints.

### Design References

<img src="/mocks/workspaces/Workspace details.png" alt="Workspace detail page" width="400" />
        `,
      },
    },
  },
};

export default meta;

export const NoPermissionsAnywhere: Story = {
  name: 'No permissions anywhere',
  args: {
    workspacePermissions: allRelations([]),
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## No Permissions Anywhere

Verifies that a user with zero workspace permissions sees the correct disabled state.

### Checks
- "Create workspace" button is **disabled**
- Root Workspace name is plain text (not a link — no view permission)
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Workspaces and verify disabled state', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await waitForPageToLoad(canvas, WS_ROOT.name);

      const createButton = await canvas.findByRole('button', { name: /create workspace/i });
      await expect(createButton).toBeDisabled();

      const rootText = await canvas.findByText(WS_ROOT.name);
      await expect(rootText.closest('a')).toBeNull();
    });
  },
};

export const RootWorkspaceHasNoPermissions: Story = {
  name: 'Root workspace has no permissions',
  args: {
    workspacePermissions: allRelations(NON_ROOT_IDS),
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Root Workspace Has No Permissions

Root is excluded from all permission lists; standard workspaces have full permissions.

### Checks
- Root Workspace name is plain text, not a link
- Standard workspace names (e.g. Production) **are** links
- Root kebab actions (Edit, Delete) are all disabled
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Workspaces and expand hierarchy', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await waitForPageToLoad(canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);
    });

    await step('Verify Root is plain text and Production is link', async () => {
      const rootText = await canvas.findByText(WS_ROOT.name);
      await expect(rootText.closest('a')).toBeNull();

      const productionLink = await canvas.findByRole('link', { name: /^Production$/i });
      await expect(productionLink).toBeInTheDocument();
    });

    await step('Verify Root kebab actions disabled', async () => {
      const body = await openWorkspaceKebabMenu(user, canvas, WS_ROOT.name);
      const editItem = await body.findByText('Edit workspace');
      await expect(editItem.closest('button')).toHaveAttribute('disabled');
      const deleteItem = await body.findByText('Delete workspace');
      await expect(deleteItem.closest('button')).toHaveAttribute('disabled');
    });
  },
};

export const RootWorkspaceNotSelectableAsParent: Story = {
  name: 'Root workspace not selectable as parent',
  args: {
    workspacePermissions: allRelations(NON_ROOT_IDS),
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Root Workspace Not Selectable as Parent

In the Create Workspace wizard, Root should be disabled/unselectable in the parent tree
because the user has no create permission on Root.

### Checks
- Root Workspace is visually disabled (opacity styling)
- Clicking Root does not change the parent selection
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Open Create workspace wizard and verify Root disabled', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await waitForPageToLoad(canvas, WS_ROOT.name);

      const wizard = await openWorkspaceWizard(user, canvas);
      const treePanel = await (async () => {
        const parentSelector = await wizard.findByRole('button', { name: /select workspaces/i });
        await user.click(parentSelector);
        // Async popover content
        const panel = await within(document.body).findByTestId('workspace-selector-menu', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
        return within(panel);
      })();

      const rootItem = await treePanel.findByText(WS_ROOT.name);
      const disabledSpan = rootItem.closest('span[style*="opacity"]');
      await expect(disabledSpan).toBeInTheDocument();

      const toggleBefore = await wizard.findByRole('button', { name: /select workspaces/i });
      await expect(toggleBefore).toBeInTheDocument();
      await user.click(rootItem);
      const toggleAfter = await wizard.findByRole('button', { name: /select workspaces/i });
      await expect(toggleAfter).toBeInTheDocument();
    });
  },
};

export const CanCreateInSingleWorkspace: Story = {
  name: 'Can create in single workspace',
  args: {
    workspacePermissions: {
      view: NON_ROOT_IDS,
      edit: NON_ROOT_IDS,
      delete: NON_ROOT_IDS,
      create: ['ws-1'],
      move: NON_ROOT_IDS,
    },
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Can Create in Single Workspace (ws-1 / Production)

User has create permission on ws-1 only.

### Checks
- Toolbar "Create workspace" button is **enabled**
- In parent selector tree: Production is selectable, others disabled
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Workspaces and open Create wizard', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await waitForPageToLoad(canvas, WS_ROOT.name);

      const createButton = await canvas.findByRole('button', { name: /create workspace/i });
      await expect(createButton).toBeEnabled();

      const wizard = await openWorkspaceWizard(user, canvas);
      const treePanel = await (async () => {
        const parentSelector = await wizard.findByRole('button', { name: /select workspaces/i });
        await user.click(parentSelector);
        // Async popover content
        const panel = await within(document.body).findByTestId('workspace-selector-menu', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
        return within(panel);
      })();

      const rootItem = await treePanel.findByText(WS_ROOT.name);
      const disabledSpan = rootItem.closest('span[style*="opacity"]');
      await expect(disabledSpan).toBeInTheDocument();

      await expandWorkspaceInTree(user, treePanel, WS_ROOT.name);
      await expandWorkspaceInTree(user, treePanel, WS_DEFAULT.name);

      const productionItem = await treePanel.findByText(WS_PRODUCTION.name);
      await expect(productionItem.closest('span[style*="opacity"]')).toBeNull();

      const developmentItem = await treePanel.findByText(WS_DEVELOPMENT.name);
      await expect(developmentItem.closest('span[style*="opacity"]')).toBeInTheDocument();
      const stagingItem = await treePanel.findByText(WS_STAGING.name);
      await expect(stagingItem.closest('span[style*="opacity"]')).toBeInTheDocument();
    });
  },
};

export const CanCreateInMultipleWorkspaces: Story = {
  name: 'Can create in multiple workspaces',
  args: {
    workspacePermissions: {
      view: NON_ROOT_IDS,
      edit: NON_ROOT_IDS,
      delete: NON_ROOT_IDS,
      create: ['ws-1', 'ws-2'],
      move: NON_ROOT_IDS,
    },
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Can Create in Multiple Workspaces (ws-1 + ws-2)

User has create permission on Production and Development.

### Checks
- Root and Staging are disabled in parent selector
- Production and Development are selectable
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Open Create wizard and verify parent selector states', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await waitForPageToLoad(canvas, WS_ROOT.name);

      const wizard = await openWorkspaceWizard(user, canvas);
      const treePanel = await (async () => {
        const parentSelector = await wizard.findByRole('button', { name: /select workspaces/i });
        await user.click(parentSelector);
        // Async popover content
        const panel = await within(document.body).findByTestId('workspace-selector-menu', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
        return within(panel);
      })();

      const rootItem = await treePanel.findByText(WS_ROOT.name);
      const disabledSpan = rootItem.closest('span[style*="opacity"]');
      await expect(disabledSpan).toBeInTheDocument();

      await expandWorkspaceInTree(user, treePanel, WS_ROOT.name);
      await expandWorkspaceInTree(user, treePanel, WS_DEFAULT.name);

      const productionItem = await treePanel.findByText(WS_PRODUCTION.name);
      await expect(productionItem.closest('span[style*="opacity"]')).toBeNull();
      const developmentItem = await treePanel.findByText(WS_DEVELOPMENT.name);
      await expect(developmentItem.closest('span[style*="opacity"]')).toBeNull();

      const stagingItem = await treePanel.findByText(WS_STAGING.name);
      await expect(stagingItem.closest('span[style*="opacity"]')).toBeInTheDocument();
    });
  },
};

export const CannotCreateWorkspaceWithoutPermissions: Story = {
  name: 'Cannot create workspace without permissions',
  args: {
    permissions: KESSEL_PERMISSIONS.READ_ONLY,
    orgAdmin: false,
    workspacePermissions: allRelations([]),
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.READ_ONLY,
      orgAdmin: false,
      workspacePermissions: allRelations([]),
      ...ALL_FLAGS,
    }),
    msw: { handlers: mswHandlers },
    docs: {
      description: {
        story: `
## Cannot Create Workspace Without Permissions

Read-only user — no \`inventory:groups:write\` permission.

### Checks
- "Create workspace" button is visible but **disabled**

### Design References

<img src="/mocks/workspaces/Workspace list.png" alt="Workspace list page" width="400" />
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Workspaces and verify Create button disabled', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await waitForPageToLoad(canvas, WS_ROOT.name);

      const createButton = await canvas.findByRole('button', { name: /create workspace/i });
      expect(createButton).toBeInTheDocument();
      expect(createButton).toBeDisabled();
    });
  },
};

// ---------------------------------------------------------------------------
// Detail-page permission boundary stories
// ---------------------------------------------------------------------------

/** Navigate to a workspace's detail page via the list table. */
async function navigateToWorkspaceDetail(user: ReturnType<typeof userEvent.setup>, canvas: ReturnType<typeof within>, workspaceName: string) {
  await navigateToPage(user, canvas, 'Workspaces');
  await waitForPageToLoad(canvas, WS_ROOT.name);
  await expandWorkspaceRow(user, canvas, WS_ROOT.name);
  await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);
  const link = await canvas.findByRole('link', { name: new RegExp(`^${workspaceName}$`, 'i') });
  await user.click(link);
  await waitFor(() => {
    const addressBar = canvas.queryByTestId('fake-address-bar');
    expect(addressBar).toHaveTextContent(/workspaces\/detail/i);
  });
  await canvas.findByLabelText('Role Assignments Table', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
}

export const DetailPageViewOnly: Story = {
  name: 'Detail page — view only (all actions disabled)',
  args: {
    workspacePermissions: { view: NON_ROOT_IDS, edit: [], delete: [], create: [], move: [] },
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Detail Page — View Only

User has \`view\` on all non-root workspaces but no \`create\`, \`edit\`, or \`delete\`.

### Checks
- "Grant access" toolbar button: disabled
- Row kebab "Edit access" and "Remove access": disabled
- Drawer "Edit access" and "Remove access" buttons: disabled
- Header menu "Edit workspace", "Grant access", "Delete workspace": disabled
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Production detail', async () => {
      await navigateToWorkspaceDetail(user, canvas, WS_PRODUCTION.name);
    });

    await step('Verify toolbar Grant access button is disabled', async () => {
      const grantAccessButton = await canvas.findByRole('button', { name: /grant access/i });
      await expect(grantAccessButton).toBeDisabled();
    });

    await step('Verify row kebab actions are disabled', async () => {
      await waitFor(
        async () => {
          const hasData = canvas.queryByText(KESSEL_GROUP_PROD_ADMINS.name) || canvas.queryByText(KESSEL_GROUP_VIEWERS.name);
          expect(hasData).toBeTruthy();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      const groupText = await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name);
      const row = groupText.closest('tr') as HTMLElement;
      const kebab = within(row).getByLabelText(new RegExp(`actions for ${KESSEL_GROUP_PROD_ADMINS.name}`, 'i'));
      await user.click(kebab);

      const body = within(document.body);
      const editItem = await body.findByText(/^edit access$/i);
      await expect(editItem.closest('button')).toHaveAttribute('disabled');
      const removeItem = await body.findByText(/^remove access$/i);
      await expect(removeItem.closest('button')).toHaveAttribute('disabled');

      await user.keyboard('{Escape}');
    });

    await step('Verify drawer buttons are disabled', async () => {
      const groupText = await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name);
      await user.click(groupText);

      const drawer = await waitForDrawer();
      const editAccessButton = await drawer.findByRole('button', { name: /edit access for this workspace/i });
      await expect(editAccessButton).toBeDisabled();

      expect(drawer.queryByRole('button', { name: /remove from workspace/i })).not.toBeInTheDocument();
    });

    await step('Verify header actions menu items are disabled', async () => {
      const actionsButtons = await canvas.findAllByRole('button', { name: /^actions$/i });
      await user.click(actionsButtons[0]);

      const body = within(document.body);
      const editWs = await body.findByText(/edit workspace/i);
      await expect(editWs.closest('button')).toHaveAttribute('disabled');

      const grantAccess = await body.findByText(/grant access to workspace/i);
      await expect(grantAccess.closest('button')).toHaveAttribute('disabled');

      const deleteWs = await body.findByText(/delete workspace/i);
      await expect(deleteWs.closest('button')).toHaveAttribute('disabled');
    });
  },
};

export const DetailPageCanCreateOnly: Story = {
  name: 'Detail page — create only (grant/edit enabled, delete disabled)',
  args: {
    workspacePermissions: { view: NON_ROOT_IDS, edit: [], delete: [], create: NON_ROOT_IDS, move: [] },
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Detail Page — Create Only

User has \`view\` and \`create\` but no \`edit\`, \`delete\`, or \`move\`.

### Checks
- "Grant access" toolbar button: enabled
- Row kebab "Edit access": enabled; "Remove access": disabled
- Header menu "Grant access" and "Create subworkspace": enabled; "Edit workspace", "Delete workspace": disabled
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Production detail', async () => {
      await navigateToWorkspaceDetail(user, canvas, WS_PRODUCTION.name);
    });

    await step('Verify toolbar Grant access button is enabled', async () => {
      const grantAccessButton = await canvas.findByRole('button', { name: /grant access/i });
      await expect(grantAccessButton).toBeEnabled();
    });

    await step('Verify row kebab: edit enabled, remove disabled', async () => {
      await waitFor(
        async () => {
          expect(canvas.queryByText(KESSEL_GROUP_PROD_ADMINS.name)).toBeTruthy();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      const groupText = await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name);
      const row = groupText.closest('tr') as HTMLElement;
      const kebab = within(row).getByLabelText(new RegExp(`actions for ${KESSEL_GROUP_PROD_ADMINS.name}`, 'i'));
      await user.click(kebab);

      const body = within(document.body);
      const editItem = await body.findByText(/^edit access$/i);
      await expect(editItem.closest('button')).not.toHaveAttribute('disabled');
      const removeItem = await body.findByText(/^remove access$/i);
      await expect(removeItem.closest('button')).toHaveAttribute('disabled');

      await user.keyboard('{Escape}');
    });

    await step('Verify header menu: grant access enabled, delete disabled', async () => {
      const actionsButtons = await canvas.findAllByRole('button', { name: /^actions$/i });
      await user.click(actionsButtons[0]);

      const body = within(document.body);
      const grantAccess = await body.findByText(/grant access to workspace/i);
      await expect(grantAccess.closest('button')).not.toHaveAttribute('disabled');

      const createSub = await body.findByText(/create sub-workspace/i);
      await expect(createSub.closest('button')).not.toHaveAttribute('disabled');

      const editWs = await body.findByText(/edit workspace/i);
      await expect(editWs.closest('button')).toHaveAttribute('disabled');

      const deleteWs = await body.findByText(/delete workspace/i);
      await expect(deleteWs.closest('button')).toHaveAttribute('disabled');
    });
  },
};

export const DetailPageCanDeleteOnly: Story = {
  name: 'Detail page — delete only (remove enabled, grant/edit disabled)',
  args: {
    workspacePermissions: { view: NON_ROOT_IDS, edit: [], delete: NON_ROOT_IDS, create: [], move: [] },
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Detail Page — Delete Only

User has \`view\` and \`delete\` but no \`create\`, \`edit\`, or \`move\`.

### Checks
- "Grant access" toolbar button: disabled
- Row kebab "Edit access": disabled; "Remove access": enabled
- Header menu "Delete workspace": enabled; "Grant access", "Edit workspace": disabled
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Production detail', async () => {
      await navigateToWorkspaceDetail(user, canvas, WS_PRODUCTION.name);
    });

    await step('Verify toolbar Grant access button is disabled', async () => {
      const grantAccessButton = await canvas.findByRole('button', { name: /grant access/i });
      await expect(grantAccessButton).toBeDisabled();
    });

    await step('Verify row kebab: edit disabled, remove enabled', async () => {
      await waitFor(
        async () => {
          expect(canvas.queryByText(KESSEL_GROUP_PROD_ADMINS.name)).toBeTruthy();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      const groupText = await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name);
      const row = groupText.closest('tr') as HTMLElement;
      const kebab = within(row).getByLabelText(new RegExp(`actions for ${KESSEL_GROUP_PROD_ADMINS.name}`, 'i'));
      await user.click(kebab);

      const body = within(document.body);
      const editItem = await body.findByText(/^edit access$/i);
      await expect(editItem.closest('button')).toHaveAttribute('disabled');
      const removeItem = await body.findByText(/^remove access$/i);
      await expect(removeItem.closest('button')).not.toHaveAttribute('disabled');

      await user.keyboard('{Escape}');
    });

    await step('Verify header menu: delete enabled, grant access disabled', async () => {
      const actionsButtons = await canvas.findAllByRole('button', { name: /^actions$/i });
      await user.click(actionsButtons[0]);

      const body = within(document.body);
      const deleteWs = await body.findByText(/delete workspace/i);
      await expect(deleteWs.closest('button')).not.toHaveAttribute('disabled');

      const grantAccess = await body.findByText(/grant access to workspace/i);
      await expect(grantAccess.closest('button')).toHaveAttribute('disabled');

      const editWs = await body.findByText(/edit workspace/i);
      await expect(editWs.closest('button')).toHaveAttribute('disabled');
    });
  },
};

// ---------------------------------------------------------------------------
// Mixed-permission scenario
// ---------------------------------------------------------------------------

export const MixedPermissionsAcrossWorkspaces: Story = {
  name: 'Mixed permissions — full access on Production, read-only on siblings',
  args: {
    workspacePermissions: {
      view: NON_ROOT_IDS,
      edit: ['ws-1'],
      delete: ['ws-1'],
      create: ['ws-1'],
      move: ['ws-1'],
    },
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Mixed Permissions Across Workspaces

Production (ws-1) has full access; siblings (ws-2, ws-3) and parents are view-only.

### Phases
1. **List table** — Production kebab: all enabled. Staging kebab: all disabled. Root: plain text (no view).
2. **Production detail** — All buttons enabled (Grant access, Edit access, Remove, header actions).
3. **Staging detail** — All buttons disabled.
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('List table — verify mixed row actions', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await waitForPageToLoad(canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

      const rootText = await canvas.findByText(WS_ROOT.name);
      await expect(rootText.closest('a')).toBeNull();

      const productionKebab = await openWorkspaceKebabMenu(user, canvas, WS_PRODUCTION.name);
      const prodEdit = await productionKebab.findByText('Edit workspace');
      await expect(prodEdit.closest('button')).not.toHaveAttribute('disabled');
      const prodDelete = await productionKebab.findByText('Delete workspace');
      await expect(prodDelete.closest('button')).not.toHaveAttribute('disabled');
      await user.keyboard('{Escape}');

      const stagingKebab = await openWorkspaceKebabMenu(user, canvas, WS_STAGING.name);
      const stagingEdit = await stagingKebab.findByText('Edit workspace');
      await expect(stagingEdit.closest('button')).toHaveAttribute('disabled');
      const stagingDelete = await stagingKebab.findByText('Delete workspace');
      await expect(stagingDelete.closest('button')).toHaveAttribute('disabled');
      await user.keyboard('{Escape}');
    });

    await step('Production detail — verify full-access buttons', async () => {
      const productionLink = await canvas.findByRole('link', { name: /^Production$/i });
      await user.click(productionLink);

      await waitFor(() => {
        const addressBar = canvas.queryByTestId('fake-address-bar');
        expect(addressBar).toHaveTextContent(/workspaces\/detail/i);
      });
      await canvas.findByLabelText('Role Assignments Table', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

      const grantAccessButton = await canvas.findByRole('button', { name: /grant access/i });
      await expect(grantAccessButton).toBeEnabled();

      await waitFor(
        async () => {
          expect(canvas.queryByText(KESSEL_GROUP_PROD_ADMINS.name)).toBeTruthy();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      const groupText = await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name);
      const row = groupText.closest('tr') as HTMLElement;
      const kebab = within(row).getByLabelText(new RegExp(`actions for ${KESSEL_GROUP_PROD_ADMINS.name}`, 'i'));
      await user.click(kebab);

      const body = within(document.body);
      const editItem = await body.findByText(/^edit access$/i);
      await expect(editItem.closest('button')).not.toHaveAttribute('disabled');
      const removeItem = await body.findByText(/^remove access$/i);
      await expect(removeItem.closest('button')).not.toHaveAttribute('disabled');
      await user.keyboard('{Escape}');

      await user.click(groupText);
      const drawer = await waitForDrawer();
      const drawerEdit = await drawer.findByRole('button', { name: /edit access for this workspace/i });
      await expect(drawerEdit).toBeEnabled();
      expect(drawer.queryByRole('button', { name: /remove from workspace/i })).not.toBeInTheDocument();
    });

    await step('Navigate to Staging detail — verify read-only buttons', async () => {
      const workspacesLinks = await canvas.findAllByRole('link', { name: /workspaces/i });
      await user.click(workspacesLinks[workspacesLinks.length - 1]);
      await waitForPageToLoad(canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_ROOT.name);
      await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

      const stagingLink = await canvas.findByRole('link', { name: /^Staging$/i });
      await user.click(stagingLink);

      await waitFor(() => {
        const addressBar = canvas.queryByTestId('fake-address-bar');
        expect(addressBar).toHaveTextContent(/workspaces\/detail/i);
      });
      await canvas.findByLabelText('Role Assignments Table', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

      const grantAccessButton = await canvas.findByRole('button', { name: /grant access/i });
      await expect(grantAccessButton).toBeDisabled();

      await waitFor(
        async () => {
          expect(canvas.queryByText(KESSEL_GROUP_VIEWERS.name)).toBeTruthy();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      const viewersText = await canvas.findByText(KESSEL_GROUP_VIEWERS.name);
      const viewersRow = viewersText.closest('tr') as HTMLElement;
      const viewersKebab = within(viewersRow).getByLabelText(new RegExp(`actions for ${KESSEL_GROUP_VIEWERS.name}`, 'i'));
      await user.click(viewersKebab);

      const body = within(document.body);
      const editItem = await body.findByText(/^edit access$/i);
      await expect(editItem.closest('button')).toHaveAttribute('disabled');
      const removeItem = await body.findByText(/^remove access$/i);
      await expect(removeItem.closest('button')).toHaveAttribute('disabled');
      await user.keyboard('{Escape}');

      await user.click(viewersText);
      const drawer = await waitForDrawer();
      const drawerEdit = await drawer.findByRole('button', { name: /edit access for this workspace/i });
      await expect(drawerEdit).toBeDisabled();
      expect(drawer.queryByRole('button', { name: /remove from workspace/i })).not.toBeInTheDocument();

      const actionsButtons = await canvas.findAllByRole('button', { name: /^actions$/i });
      await user.click(actionsButtons[0]);
      const editWs = await body.findByText(/edit workspace/i);
      await expect(editWs.closest('button')).toHaveAttribute('disabled');
      const deleteWs = await body.findByText(/delete workspace/i);
      await expect(deleteWs.closest('button')).toHaveAttribute('disabled');
      const grantAccessMenu = await body.findByText(/grant access to workspace/i);
      await expect(grantAccessMenu.closest('button')).toHaveAttribute('disabled');
    });
  },
};

// ---------------------------------------------------------------------------
// Direct-URL defense & kebab-driven edit access
// ---------------------------------------------------------------------------

export const RoleAccessModalDirectUrlDenied: Story = {
  name: 'Direct URL to role-access modal — denied without edit permission',
  args: {
    workspacePermissions: { view: NON_ROOT_IDS, edit: [], delete: [], create: [], move: [] },
    initialRoute: `/iam/access-management/workspaces/detail/${WS_PRODUCTION.id}/role-access/${KESSEL_GROUP_PROD_ADMINS.uuid}`,
  },
  parameters: {
    docs: {
      description: {
        story: `
## Direct-URL Defense — RoleAccessModal

User navigates directly to the role-access modal URL without \`edit\` permission.
The workspace-level edit guard blocks at the routing level before the modal mounts.

### Checks
- The modal does NOT render
- The route-level guard shows "unauthorized access" instead
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify route-level guard blocks access', async () => {
      const body = within(document.body);

      await waitFor(
        () => {
          const unauthorized = body.queryAllByText(/you don.t have permission to view this page/i);
          expect(unauthorized.length).toBeGreaterThan(0);
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      const modal = body.queryByRole('dialog');
      await expect(modal).toBeNull();
    });
  },
};

export const EditAccessViaKebab: Story = {
  tags: ['skip-test'],
  name: 'Edit access via row kebab — opens RoleAccessModal',
  args: {
    workspacePermissions: allRelations(NON_ROOT_IDS),
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Edit Access via Row Kebab

User with full permissions navigates to Production detail, opens the row kebab for
${KESSEL_GROUP_PROD_ADMINS.name}, clicks "Edit access", and
verifies the RoleAccessModal opens.

### Checks
- Row kebab "Edit access" is enabled and clickable
- After clicking, the URL changes to the role-access route
- The RoleAccessModal renders with the roles selection table
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Production detail', async () => {
      await navigateToWorkspaceDetail(user, canvas, WS_PRODUCTION.name);
    });

    await step('Open row kebab and click Edit access', async () => {
      await waitFor(
        async () => {
          expect(canvas.queryByText(KESSEL_GROUP_PROD_ADMINS.name)).toBeTruthy();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      const groupText = await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name);
      const row = groupText.closest('tr') as HTMLElement;
      const kebab = within(row).getByLabelText(new RegExp(`actions for ${KESSEL_GROUP_PROD_ADMINS.name}`, 'i'));
      await user.click(kebab);

      const body = within(document.body);
      const editItem = await body.findByText(/^edit access$/i);
      await expect(editItem.closest('button')).not.toHaveAttribute('disabled');
      await user.click(editItem);
    });

    await step('Verify RoleAccessModal opens', async () => {
      await waitFor(() => {
        const addressBar = canvas.queryByTestId('fake-address-bar');
        expect(addressBar).toHaveTextContent(/role-access/i);
      });

      const body = within(document.body);
      await waitFor(
        () => {
          const tables = body.queryAllByLabelText('Roles selection table');
          expect(tables.length).toBeGreaterThan(0);
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });
  },
};
