import type { Decorator, StoryContext, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import {
  KESSEL_PERMISSIONS,
  KesselAppEntryWithRouter,
  type WorkspacePermissionsOverride,
  createDynamicEnvironment,
} from '../_shared/components/KesselAppEntryWithRouter';
import {
  TEST_TIMEOUTS,
  expandWorkspaceInTree,
  expandWorkspaceRow,
  navigateToPage,
  openWorkspaceKebabMenu,
  openWorkspaceWizard,
  resetStoryState,
  waitForPageToLoad,
} from '../_shared/helpers';
import { defaultWorkspaces } from '../../../.storybook/fixtures/workspaces';
import { defaultKesselRoles } from '../../../.storybook/fixtures/kessel-groups-roles';
import { createStatefulHandlers } from '../../../.storybook/helpers/stateful-handlers';
import { delay } from 'msw';

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

const M3_FLAGS = {
  'platform.rbac.workspaces-list': true,
  'platform.rbac.workspace-hierarchy': true,
  'platform.rbac.workspaces-role-bindings': true,
  'platform.rbac.workspaces-role-bindings-write': false,
  'platform.rbac.workspaces': false,
  'platform.rbac.workspaces-organization-management': true,
} as const;

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Workspaces (Kessel)/Kessel M3: RBAC Detail Pages/Workspace Permissions',
  tags: ['kessel-m3-permissions'],
  decorators: [
    ((Story, context: StoryContext<StoryArgs>) => {
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
    ...M3_FLAGS,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
      orgAdmin: true,
      workspacePermissions: allRelations(NON_ROOT_IDS),
      ...M3_FLAGS,
    }),
    msw: {
      handlers: createStatefulHandlers({
        workspaces: defaultWorkspaces,
        roles: defaultKesselRoles,
      }),
    },
    docs: {
      description: {
        component: `
# Kessel M3: Workspace Permission Scenarios

Tests that per-workspace Kessel permissions are enforced across the UI:
table links, kebab actions, detail page actions, and create-workspace parent selector.

Each story configures a specific \`workspacePermissions\` override so that only
certain workspaces are allowed for certain relations. The tests assert that the
UI respects these constraints.

These tests validate that permission guards remain enforced across workspace surfaces.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * No permissions on any workspace.
 *
 * Asserts:
 * - "Create workspace" toolbar button is disabled
 * - Root Workspace name is plain text (NOT a link)
 */
export const NoPermissionsAnywhere: Story = {
  name: 'No permissions anywhere',
  args: {
    workspacePermissions: allRelations([]),
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Root Workspace');

    const createButton = await canvas.findByRole('button', { name: /create workspace/i });
    await expect(createButton).toBeDisabled();

    // Root name should NOT be a link (no view permission on root)
    const rootText = await canvas.findByText('Root Workspace');
    await expect(rootText.closest('a')).toBeNull();
  },
};

/**
 * Root workspace excluded from all permission lists.
 * Standard workspaces have full permissions.
 *
 * Asserts:
 * - Root Workspace name is plain text, not a clickable link
 * - Standard workspace names ARE links — passes
 * - Root kebab actions are all disabled — passes (type check + no permission)
 */
export const RootWorkspaceHasNoPermissions: Story = {
  name: 'Root workspace has no permissions',
  args: {
    workspacePermissions: allRelations(NON_ROOT_IDS),
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Root Workspace');
    await expandWorkspaceRow(user, canvas, 'Root Workspace');
    await expandWorkspaceRow(user, canvas, 'Default Workspace');

    // Root name should NOT be a link (no view permission on root)
    const rootText = await canvas.findByText('Root Workspace');
    await expect(rootText.closest('a')).toBeNull();

    // Standard workspace name SHOULD be a link
    const productionLink = await canvas.findByRole('link', { name: /^Production$/i });
    await expect(productionLink).toBeInTheDocument();

    // Root kebab — all modification actions should be disabled
    const body = await openWorkspaceKebabMenu(user, canvas, 'Root Workspace');
    const editItem = await body.findByText('Edit workspace');
    await expect(editItem.closest('button')).toHaveAttribute('disabled');
    const deleteItem = await body.findByText('Delete workspace');
    await expect(deleteItem.closest('button')).toHaveAttribute('disabled');
  },
};

/**
 * Root workspace is NOT selectable as a parent in the Create Workspace wizard.
 *
 * Asserts:
 * - Root Workspace is disabled/unselectable in the parent selector tree (no create permission)
 */
export const RootWorkspaceNotSelectableAsParent: Story = {
  name: 'Root workspace not selectable as parent',
  args: {
    workspacePermissions: allRelations(NON_ROOT_IDS),
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Root Workspace');

    const wizard = await openWorkspaceWizard(user, canvas);
    const treePanel = await (async () => {
      const parentSelector = await wizard.findByRole('button', { name: /select workspaces/i });
      await user.click(parentSelector);
      await delay(TEST_TIMEOUTS.AFTER_EXPAND);
      const panel = document.querySelector('.rbac-c-workspace-selector-menu');
      expect(panel).toBeInTheDocument();
      return within(panel as HTMLElement);
    })();

    // Root Workspace should be disabled in the tree (no create permission)
    const rootItem = await treePanel.findByText('Root Workspace');
    // TODO: Replace with aria-disabled check when PatternFly adds disabled TreeView item support.
    // Current workaround: disabled names are wrapped in a <span> with opacity: 0.5.
    const disabledSpan = rootItem.closest('span[style*="opacity"]');
    await expect(disabledSpan).toBeInTheDocument();

    // Behavioral assertion: clicking the disabled item must not change selection
    const toggleBefore = wizard.getByRole('button', { name: /select workspaces/i });
    await expect(toggleBefore).toBeInTheDocument();
    await user.click(rootItem);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
    const toggleAfter = wizard.getByRole('button', { name: /select workspaces/i });
    await expect(toggleAfter).toBeInTheDocument();
  },
};

/**
 * User can create in a single workspace only (ws-1 / Production).
 *
 * Asserts:
 * - Toolbar button enabled (canCreateAny = true)
 * - In parent selector: Production is selectable, others are disabled
 */
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
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Root Workspace');

    const createButton = await canvas.findByRole('button', { name: /create workspace/i });
    await expect(createButton).toBeEnabled();

    const wizard = await openWorkspaceWizard(user, canvas);
    const treePanel = await (async () => {
      const parentSelector = await wizard.findByRole('button', { name: /select workspaces/i });
      await user.click(parentSelector);
      await delay(TEST_TIMEOUTS.AFTER_EXPAND);
      const panel = document.querySelector('.rbac-c-workspace-selector-menu');
      expect(panel).toBeInTheDocument();
      return within(panel as HTMLElement);
    })();

    // Root Workspace should be disabled (no create permission on root)
    const rootItem = await treePanel.findByText('Root Workspace');
    // TODO: Replace with aria-disabled check when PatternFly adds disabled TreeView item support.
    // Current workaround: disabled names are wrapped in a <span> with opacity: 0.5.
    const disabledSpan = rootItem.closest('span[style*="opacity"]');
    await expect(disabledSpan).toBeInTheDocument();

    // Expand tree to reveal child workspaces (Root → Default → children)
    await expandWorkspaceInTree(user, treePanel, 'Root Workspace');
    await expandWorkspaceInTree(user, treePanel, 'Default Workspace');

    // Production (ws-1) should be selectable (has create permission)
    const productionItem = await treePanel.findByText('Production');
    await expect(productionItem.closest('span[style*="opacity"]')).toBeNull();

    // Development (ws-2) and Staging (ws-3) should be disabled (no create permission)
    const developmentItem = await treePanel.findByText('Development');
    await expect(developmentItem.closest('span[style*="opacity"]')).toBeInTheDocument();
    const stagingItem = await treePanel.findByText('Staging');
    await expect(stagingItem.closest('span[style*="opacity"]')).toBeInTheDocument();
  },
};

/**
 * User can create in multiple workspaces (ws-1 and ws-2).
 *
 * Asserts:
 * - Root Workspace and ws-3 (Staging) are disabled in parent selector
 * - ws-1 (Production) and ws-2 (Development) are selectable
 */
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
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Workspaces');
    await waitForPageToLoad(canvas, 'Root Workspace');

    const wizard = await openWorkspaceWizard(user, canvas);
    const treePanel = await (async () => {
      const parentSelector = await wizard.findByRole('button', { name: /select workspaces/i });
      await user.click(parentSelector);
      await delay(TEST_TIMEOUTS.AFTER_EXPAND);
      const panel = document.querySelector('.rbac-c-workspace-selector-menu');
      expect(panel).toBeInTheDocument();
      return within(panel as HTMLElement);
    })();

    // Root should be disabled (no create permission on root)
    const rootItem = await treePanel.findByText('Root Workspace');
    // TODO: Replace with aria-disabled check when PatternFly adds disabled TreeView item support.
    // Current workaround: disabled names are wrapped in a <span> with opacity: 0.5.
    const disabledSpan = rootItem.closest('span[style*="opacity"]');
    await expect(disabledSpan).toBeInTheDocument();

    // Expand tree to reveal child workspaces (Root → Default → children)
    await expandWorkspaceInTree(user, treePanel, 'Root Workspace');
    await expandWorkspaceInTree(user, treePanel, 'Default Workspace');

    // Production (ws-1) and Development (ws-2) should be selectable
    const productionItem = await treePanel.findByText('Production');
    await expect(productionItem.closest('span[style*="opacity"]')).toBeNull();
    const developmentItem = await treePanel.findByText('Development');
    await expect(developmentItem.closest('span[style*="opacity"]')).toBeNull();

    // Staging (ws-3) should be disabled (no create permission)
    const stagingItem = await treePanel.findByText('Staging');
    await expect(stagingItem.closest('span[style*="opacity"]')).toBeInTheDocument();
  },
};
