import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import {
  KESSEL_PERMISSIONS,
  KesselAppEntryWithRouter,
  type WorkspacePermissionsOverride,
  createDynamicEnvironment,
} from '../_shared/components/KesselAppEntryWithRouter';
import { navigateToPage, resetStoryState } from '../_shared/helpers';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';
import { expandWorkspaceRow, waitForPageToLoad } from '../../test-utils/tableHelpers';
import { expandWorkspaceInTree, openWorkspaceKebabMenu, openWorkspaceWizard } from '../../test-utils/workspaceHelpers';
import { createV2MockDb } from '../../v2/data/mocks/db';
import { createV2Handlers } from '../../v2/data/mocks/handlers';
import { DEFAULT_USERS } from '../../shared/data/mocks/seed';
import { DEFAULT_WORKSPACES, WS_DEFAULT, WS_DEVELOPMENT, WS_PRODUCTION, WS_ROOT, WS_STAGING } from '../../v2/data/mocks/seed';
import { defaultKesselRoles } from '../../v2/data/mocks/kesselGroupsRoles.fixtures';

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
  'platform.rbac.workspaces-organization-management'?: boolean;
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
  'platform.rbac.workspaces-organization-management': true,
} as const;

const db = createV2MockDb({
  workspaces: DEFAULT_WORKSPACES,
  roles: defaultKesselRoles,
  users: DEFAULT_USERS,
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
