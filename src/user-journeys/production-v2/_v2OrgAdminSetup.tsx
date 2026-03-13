import type { Decorator, StoryContext } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, waitFor } from 'storybook/test';
import type { UserEvent } from '../../test-utils/testUtils';
import type { StoryObj } from '@storybook/react-webpack5';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { navigateToPage } from '../_shared/helpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';
import type { ScopedQueries } from '../../test-utils/interactionHelpers';
import { expandWorkspaceRow, waitForPageToLoad } from '../../test-utils/tableHelpers';
import { createV2MockDb } from '../../v2/data/mocks/db';
import { createV2Handlers } from '../../v2/data/mocks/handlers';
import { DEFAULT_GROUPS, DEFAULT_PERMISSIONS, DEFAULT_USERS } from '../../shared/data/mocks/seed';
import { DEFAULT_V2_ROLES, DEFAULT_WORKSPACES, WS_DEFAULT, WS_ROOT } from '../../v2/data/mocks/seed';
import {
  KESSEL_GROUP_PROD_ADMINS,
  KESSEL_GROUP_VIEWERS,
  defaultKesselGroupMembers,
  defaultKesselGroupRoles,
  defaultKesselGroups,
  defaultKesselRoles,
} from '../../v2/data/mocks/kesselGroupsRoles.fixtures';
import { workspaceRoleBindings } from '../../v2/data/mocks/workspaceRoleBindings.fixtures';

export type Story = StoryObj<typeof KesselAppEntryWithRouter>;

export interface StoryArgs {
  typingDelay?: number;
  orgAdmin?: boolean;
  userAccessAdministrator?: boolean;
  'platform.rbac.workspaces-list'?: boolean;
  'platform.rbac.workspace-hierarchy'?: boolean;
  'platform.rbac.workspaces-role-bindings'?: boolean;
  'platform.rbac.workspaces-role-bindings-write'?: boolean;
  'platform.rbac.workspaces'?: boolean;
  'platform.rbac.group-service-accounts'?: boolean;
  'platform.rbac.group-service-accounts.stable'?: boolean;
  'platform.rbac.common-auth-model'?: boolean;
  initialRoute?: string;
}

export const batchCreateRoleBindingsSpy = fn();
export const updateRoleBindingsSpy = fn();
export const batchDeleteRolesSpy = fn();
export const changeUsersStatusSpy = fn();
export const inviteUsersSpyV2 = fn();

export const db = createV2MockDb({
  groups: [...DEFAULT_GROUPS.filter((g) => g.system), ...defaultKesselGroups],
  users: DEFAULT_USERS,
  roles: [...DEFAULT_V2_ROLES, ...defaultKesselRoles],
  workspaces: DEFAULT_WORKSPACES,
  permissions: DEFAULT_PERMISSIONS,
  groupMembers: defaultKesselGroupMembers,
  groupRoles: defaultKesselGroupRoles,
  roleBindings: workspaceRoleBindings,
});

export const mswHandlers = createV2Handlers(db, {
  roleBindings: {
    onBatchCreate: batchCreateRoleBindingsSpy,
    onUpdate: updateRoleBindingsSpy,
  },
  roles: { onBatchDelete: batchDeleteRolesSpy },
  users: { onChangeStatus: changeUsersStatusSpy },
  accountManagement: {
    onInvite: (request, body) => {
      const b = body as { emails?: string[]; roles?: string[] };
      inviteUsersSpyV2({ url: request.url, emails: b.emails, roles: b.roles });
    },
  },
});

export const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin',
  tags: ['prod-v2-org-admin'],
  decorators: [
    ((Story, context: StoryContext<StoryArgs>) => {
      db.reset();
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    }) as Decorator<StoryArgs>,
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
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.workspaces': {
      control: 'boolean',
      description: 'Kessel M5 - Full workspace management',
      table: { category: 'Kessel Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.group-service-accounts': {
      control: 'boolean',
      description: 'Group service accounts feature',
      table: { category: 'Other Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.group-service-accounts.stable': {
      control: 'boolean',
      description: 'Group service accounts stable release',
      table: { category: 'Other Flags', defaultValue: { summary: 'true' } },
    },
    'platform.rbac.common-auth-model': {
      control: 'boolean',
      description: 'Common authentication model',
      table: { category: 'Other Flags', defaultValue: { summary: 'true' } },
    },
  },
  args: {
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
    orgAdmin: true,
    'platform.rbac.workspaces-organization-management': true,
    'platform.rbac.workspaces-list': true,
    'platform.rbac.workspace-hierarchy': true,
    'platform.rbac.workspaces-role-bindings': true,
    'platform.rbac.workspaces-role-bindings-write': true,
    'platform.rbac.workspaces': true,
    'platform.rbac.group-service-accounts': true,
    'platform.rbac.group-service-accounts.stable': true,
    'platform.rbac.common-auth-model': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
      orgAdmin: true,
      'platform.rbac.workspaces-organization-management': true,
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces-role-bindings': true,
      'platform.rbac.workspaces-role-bindings-write': true,
      'platform.rbac.workspaces': true,
      'platform.rbac.group-service-accounts': true,
      'platform.rbac.group-service-accounts.stable': true,
      'platform.rbac.common-auth-model': true,
    }),
    msw: {
      handlers: mswHandlers,
    },
    docs: {
      description: {
        component: 'V2 Org Admin with all Management Fabric features (M1–M5). See the Documentation page for full details.',
      },
    },
  },
};

/**
 * Navigate to the Production workspace detail page's role assignments table.
 * Shared setup used by multiple role-binding write stories.
 */
export async function navigateToProductionWorkspaceDetail(user: UserEvent, canvas: ScopedQueries): Promise<void> {
  await navigateToPage(user, canvas, 'Workspaces');
  await waitForPageToLoad(canvas, WS_ROOT.name);

  await expandWorkspaceRow(user, canvas, WS_ROOT.name);
  await expandWorkspaceRow(user, canvas, WS_DEFAULT.name);

  const productionLink = await canvas.findByRole('link', { name: /^production$/i });
  await user.click(productionLink);

  await waitFor(() => {
    const addressBar = canvas.getByTestId('fake-address-bar');
    expect(addressBar).toHaveTextContent(/workspaces\/detail/i);
  });

  await canvas.findByLabelText('Role Assignments Table', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

  await waitFor(
    async () => {
      const hasData = canvas.queryByText(KESSEL_GROUP_PROD_ADMINS.name) || canvas.queryByText(KESSEL_GROUP_VIEWERS.name);
      await expect(hasData).toBeTruthy();
    },
    { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
  );
}

// Re-exports for story files
export { navigateToPage, resetStoryState } from '../_shared/helpers';
export { TEST_TIMEOUTS } from '../../test-utils/testUtils';
export { clickTab, clickWizardNext, selectTableRow, waitForDrawer, waitForModal } from '../../test-utils/interactionHelpers';
export { expandWorkspaceRow, verifySuccessNotification, waitForPageToLoad } from '../../test-utils/tableHelpers';
export {
  expandWorkspaceInTree,
  fillWorkspaceForm,
  openWorkspaceKebabMenu,
  openWorkspaceWizard,
  selectParentWorkspace,
  selectWorkspaceFromTree,
} from '../../test-utils/workspaceHelpers';
export { USER_JANE, USER_JOHN } from '../../shared/data/mocks/seed';
export {
  DEFAULT_V2_ROLES,
  DEFAULT_WORKSPACES,
  V2_ROLE_INVENTORY_VIEWER,
  V2_ROLE_RHEL_DEVOPS,
  WS_DEFAULT,
  WS_DEVELOPMENT,
  WS_PRODUCTION,
  WS_ROOT,
  WS_STAGING,
} from '../../v2/data/mocks/seed';
export {
  KESSEL_GROUP_DEV_TEAM,
  KESSEL_GROUP_MARKETING,
  KESSEL_GROUP_PROD_ADMINS,
  KESSEL_GROUP_VIEWERS,
  KESSEL_PROD_ADMINS_MEMBERS,
  KESSEL_ROLE_WS_ADMIN,
  KESSEL_ROLE_WS_EDITOR,
  KESSEL_ROLE_WS_VIEWER,
  KESSEL_VIEWERS_MEMBERS,
} from '../../v2/data/mocks/kesselGroupsRoles.fixtures';
