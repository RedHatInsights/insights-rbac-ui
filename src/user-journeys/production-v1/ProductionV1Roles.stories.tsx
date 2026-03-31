import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { fillCreateRoleWizard } from '../../v1/features/roles/CreateRole.helpers';
import { fillCopyRoleWizard } from '../../v1/features/roles/CopyRole.helpers';
import { fillEditRoleModal } from '../../v1/features/roles/EditRole.helpers';
import { confirmDeleteRoleModal } from '../../v1/features/roles/DeleteRole.helpers';
import { rolesAddToGroupVisibilityFixtures } from '../../v1/data/mocks/rolesVisibility.fixtures';
import { expandRoleGroups, expectAddRoleLinkHidden, expectAddRoleLinkVisible, getGroupRow } from '../../test-utils/rolesTableHelpers';
import { clickWizardNext, waitForContentReady, waitForModal } from '../../test-utils/interactionHelpers';
import { createV1MockDb } from '../../v1/data/mocks/db';
import { createV1Handlers } from '../../v1/data/mocks/handlers';
import { createInventoryHandlers } from '../../shared/data/mocks/inventory.handlers';
import { defaultInventoryGroups } from '../../shared/data/mocks/inventory.fixtures';
import { ENVIRONMENTS } from '../_shared/environments';
import {
  DEFAULT_GROUPS,
  DEFAULT_USERS,
  GROUP_ADMIN_DEFAULT,
  GROUP_ENGINEERING,
  GROUP_PLATFORM_ADMINS,
  GROUP_SUPPORT_TEAM,
  Story,
  TEST_TIMEOUTS,
  V1_ROLE_ADMIN,
  V1_ROLE_CUSTOM,
  V1_ROLE_VIEWER,
  clickMenuItem,
  meta,
  navigateToPage,
  openDetailPageActionsMenu,
  openRoleActionsMenu,
  resetStoryState,
  v1Db,
  verifySuccessNotification,
  waitForPageToLoad,
} from './_v1OrgAdminSetup';
import { DEFAULT_V1_ROLES, defaultV1Seed } from '../../v1/data/mocks/seed';

const rolesAddToGroupLinkDb = createV1MockDb({
  groups: DEFAULT_GROUPS,
  users: DEFAULT_USERS,
  roles: [...rolesAddToGroupVisibilityFixtures, ...DEFAULT_V1_ROLES],
});
const rolesAddToGroupLinkHandlers = createV1Handlers(rolesAddToGroupLinkDb);

const FIXTURE_GROUP_1 = defaultInventoryGroups[0];
const createRoleWithInventorySpy = fn();
const inventoryGroupsDb = createV1MockDb(defaultV1Seed());
const inventoryGroupsHandlers = [
  ...createV1Handlers(inventoryGroupsDb, { roles: { onCreate: createRoleWithInventorySpy } }),
  ...createInventoryHandlers(defaultInventoryGroups, [], { networkDelay: 100 }),
];

export default { ...meta, title: 'User Journeys/Production/V1 (Current)/Org Admin/Roles', tags: ['prod-org-admin'] };

export const CreateRoleJourney: Story = {
  name: 'Create new role',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    featureFlags: ENVIRONMENTS.PROD_ORG_ADMIN.featureFlags,
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Roles page', async () => {
      await navigateToPage(user, canvas, 'Roles');
      await waitForPageToLoad(canvas, V1_ROLE_VIEWER.name);
    });

    await step('Open create role wizard', async () => {
      const createButton = await canvas.findByRole('button', { name: /create role/i });
      await user.click(createButton);
    });

    await step('Fill wizard and submit', async () => {
      await fillCreateRoleWizard(user, 'Automation Test Role', 'A test custom role for automation', ['insights:*:*'], step);
    });

    await step('Verify new role in list', async () => {
      await waitForPageToLoad(canvas, V1_ROLE_VIEWER.name);
      await canvas.findByText('Automation Test Role', {}, { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT });
    });
  },
};

export const CopyRoleJourney: Story = {
  name: 'Copy existing role',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    featureFlags: ENVIRONMENTS.PROD_ORG_ADMIN.featureFlags,
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
    docs: {
      description: {
        story: `
Tests the full flow of creating a role by copying an existing one.

**Regression test for:** Copy role wizard Next button stays disabled after validation.
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Roles page', async () => {
      await navigateToPage(user, canvas, 'Roles');
      await waitForPageToLoad(canvas, V1_ROLE_CUSTOM.name);
    });

    await step('Open create role wizard', async () => {
      const createButton = await canvas.findByRole('button', { name: /create role/i });
      await user.click(createButton);
    });

    await step('Fill copy wizard and submit', async () => {
      await fillCopyRoleWizard(user, V1_ROLE_CUSTOM.name, step);
    });

    await step('Verify copied role in list', async () => {
      await waitForPageToLoad(canvas, V1_ROLE_CUSTOM.name);
      await canvas.findByText('Copy of Custom Role', {}, { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT });
    });
  },
};

export const EditRoleJourney: Story = {
  name: 'Edit role',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Roles page', async () => {
      await navigateToPage(user, canvas, 'Roles');
      await waitForPageToLoad(canvas, V1_ROLE_ADMIN.name);
    });

    await step('Open edit modal from row actions', async () => {
      await openRoleActionsMenu(user, canvas, V1_ROLE_CUSTOM.name);
      await clickMenuItem(user, 'Edit');
    });

    await step('Fill form and submit', async () => {
      await fillEditRoleModal(user, 'Updated Custom Role', 'Updated description for custom role', step);
    });

    await step('Verify success notification and updated name', async () => {
      await verifySuccessNotification();
      await canvas.findByText('Updated Custom Role', {}, { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT });
    });
  },
};

export const EditRoleFromDetailPage: Story = {
  name: 'Edit from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Roles page', async () => {
      await navigateToPage(user, canvas, 'Roles');
      await waitForPageToLoad(canvas, V1_ROLE_CUSTOM.name);
    });

    await step('Open role detail page', async () => {
      const roleLink = await canvas.findByRole('link', { name: V1_ROLE_CUSTOM.name });
      await user.click(roleLink);
      await canvas.findByRole('heading', { name: V1_ROLE_CUSTOM.name });
    });

    await step('Open edit modal from detail page actions', async () => {
      await openDetailPageActionsMenu(user, canvas);
      await clickMenuItem(user, 'Edit');
    });

    await step('Fill form and submit', async () => {
      await fillEditRoleModal(user, 'Updated Custom Role', 'Updated from detail page', step);
    });

    await step('Verify success notification and updated heading', async () => {
      await Promise.all([
        verifySuccessNotification(),
        canvas.findByRole('heading', { name: 'Updated Custom Role' }, { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT }),
      ]);
    });
  },
};

export const DeleteRoleFromList: Story = {
  name: 'Delete role',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Roles page', async () => {
      await navigateToPage(user, canvas, 'Roles');
      await waitForPageToLoad(canvas, V1_ROLE_ADMIN.name);
    });

    await step('Open delete modal from row actions', async () => {
      await openRoleActionsMenu(user, canvas, V1_ROLE_CUSTOM.name);
      await clickMenuItem(user, 'Delete');
    });

    await step('Confirm delete', async () => {
      await confirmDeleteRoleModal(user);
    });

    await step('Verify success notification and role removed', async () => {
      await verifySuccessNotification();
      await waitFor(
        () => {
          expect(canvas.queryByText(V1_ROLE_CUSTOM.name)).not.toBeInTheDocument();
          expect(canvas.queryByText(V1_ROLE_ADMIN.name)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });
  },
};

export const DeleteRoleFromDetailPage: Story = {
  name: 'Delete from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Roles page', async () => {
      await navigateToPage(user, canvas, 'Roles');
      await waitForPageToLoad(canvas, V1_ROLE_CUSTOM.name);
    });

    await step('Open role detail page', async () => {
      const roleLink = await canvas.findByRole('link', { name: V1_ROLE_CUSTOM.name });
      await user.click(roleLink);
      await canvas.findByRole('heading', { name: V1_ROLE_CUSTOM.name });
    });

    await step('Delete role from detail page', async () => {
      await openDetailPageActionsMenu(user, canvas);
      await clickMenuItem(user, 'Delete');
      await confirmDeleteRoleModal(user);
    });

    await step('Verify success notification and redirect', async () => {
      await verifySuccessNotification();
      await waitForPageToLoad(canvas, V1_ROLE_ADMIN.name);
      await waitFor(
        () => {
          expect(canvas.queryByText(V1_ROLE_CUSTOM.name)).not.toBeInTheDocument();
          expect(canvas.queryByText(V1_ROLE_ADMIN.name)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });
  },
};

export const RolesAddToGroupLinkVisibility: Story = {
  name: 'Add to group link visibility',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    msw: {
      handlers: rolesAddToGroupLinkHandlers,
    },
    docs: {
      description: {
        story: `
Tests the visibility logic for the "Add role to this group" link in the expanded roles view.

**Business Logic:**
- The link should NOT appear for the admin default group (Default admin access)
- The admin group is special - it grants all permissions to org admins automatically
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(rolesAddToGroupLinkDb);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Roles page', async () => {
      await navigateToPage(user, canvas, 'Roles');
      await waitForPageToLoad(canvas, 'Test Role With Groups');
    });

    await step('Expand first role and verify add to group link visibility', async () => {
      const main = within(canvasElement).queryByRole('main');
      const mainContent = main ? within(main) : within(canvasElement);
      const testRoleLink = await mainContent.findByRole('link', { name: 'Test Role With Groups' });
      const { groupsToggle, expandedContent } = await expandRoleGroups(user, testRoleLink);

      const platformAdminsLink = await expandedContent.findByRole('link', { name: GROUP_PLATFORM_ADMINS.name });
      const adminAccessLink = await expandedContent.findByRole('link', { name: GROUP_ADMIN_DEFAULT.name });
      const supportTeamLink = await expandedContent.findByRole('link', { name: GROUP_SUPPORT_TEAM.name });

      const addRoleLinks = expandedContent.queryAllByRole('link', { name: /add role to this group/i });
      expect(addRoleLinks).toHaveLength(2);

      expectAddRoleLinkHidden(getGroupRow(adminAccessLink));
      expectAddRoleLinkVisible(getGroupRow(platformAdminsLink));
      expectAddRoleLinkVisible(getGroupRow(supportTeamLink));

      await user.click(groupsToggle);
    });

    await step('Expand second role and verify add to group link visibility', async () => {
      const main = within(canvasElement).queryByRole('main');
      const mainContent = main ? within(main) : within(canvasElement);
      const anotherTestRoleLink = await mainContent.findByRole('link', { name: 'Another Test Role' });
      const { expandedContent: otherExpandedContent } = await expandRoleGroups(user, anotherTestRoleLink);

      const engineeringLink = await otherExpandedContent.findByRole('link', { name: GROUP_ENGINEERING.name });
      expectAddRoleLinkVisible(getGroupRow(engineeringLink));
    });
  },
};

/**
 * Copies a role with inventory:hosts:read, selects "Ungrouped systems" + a
 * named group on the "Define Inventory group access" step, submits, and
 * verifies the API payload contains null in the resourceDefinitions value
 * array (the restored V1 "Ungrouped systems" semantics).
 */
export const CopyRoleWithUngroupedSystems: Story = {
  name: 'Copy role – ungrouped systems',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    featureFlags: ENVIRONMENTS.PROD_ORG_ADMIN.featureFlags,
    msw: { handlers: inventoryGroupsHandlers },
    test: { dangerouslyIgnoreUnhandledErrors: true },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(inventoryGroupsDb);
      createRoleWithInventorySpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Roles page', async () => {
      await navigateToPage(user, canvas, 'Roles');
      await waitForPageToLoad(canvas, V1_ROLE_CUSTOM.name);
    });

    await step('Open create role wizard', async () => {
      const createButton = await canvas.findByRole('button', { name: /create role/i });
      await user.click(createButton);
    });

    await step('Select copy existing role and pick Custom Role', async () => {
      const modalScope = await waitForModal({ timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      const copyRadio = await modalScope.findByRole('radio', { name: /copy an existing role/i });
      await user.click(copyRadio);
      // Wizard step content loads asynchronously
      await modalScope.findByRole('grid', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      const sourceRoleRadio = await modalScope.findByRole('radio', { name: new RegExp(V1_ROLE_CUSTOM.name, 'i') });
      await user.click(sourceRoleRadio);
      await clickWizardNext(user, modalScope, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });

    await step('Fill name and description step', async () => {
      const modalScope = await waitForModal({ timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      // Data-driven-forms content loads asynchronously
      await modalScope.findByLabelText(/role name/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await clickWizardNext(user, modalScope, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });

    await step('Wait for permissions and advance', async () => {
      const modalScope = await waitForModal({ timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await waitFor(
        () => {
          expect(modalScope.queryByRole('heading', { name: /add permissions/i })).not.toBeNull();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
      await waitFor(
        () => {
          expect(modalScope.queryAllByText('inventory').length).toBeGreaterThan(0);
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
      await clickWizardNext(user, modalScope, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });

    await step('Define inventory group access with Ungrouped systems', async () => {
      const modalScope = await waitForModal({ timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      const bodyScope = within(document.body);
      await waitFor(
        () => {
          expect(modalScope.queryByRole('heading', { name: /inventory group access|workspaces access/i })).not.toBeNull();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      // Wizard step content (combobox) loads asynchronously
      const combobox = await modalScope.findByRole('combobox', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await user.click(combobox);

      const ungroupedOption = await bodyScope.findByText(/ungrouped systems/i, {}, { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT });
      await user.click(ungroupedOption);

      const groupOption = await bodyScope.findByText(FIXTURE_GROUP_1.name);
      await user.click(groupOption);

      const toggleBtn = combobox.closest('.rbac-c-resource-type-select')?.querySelector('button[aria-expanded="true"]');
      if (toggleBtn) {
        await user.click(toggleBtn as HTMLElement);
      }

      const copyToAll = modalScope.queryByText(/copy to all/i);
      if (copyToAll) {
        await user.click(copyToAll);
      }

      await clickWizardNext(user, modalScope, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });

    await step('Submit wizard', async () => {
      const modalScope = await waitForModal({ timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      // Wizard review step content loads asynchronously
      await modalScope.findByRole('heading', { name: /review details/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      const submitBtn = await modalScope.findByRole('button', { name: /submit/i });
      await waitFor(() => expect(submitBtn).toBeEnabled(), { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await user.click(submitBtn);
    });

    await step('Verify success and API payload', async () => {
      const bodyScope = within(document.body);
      // Success message appears after API mutation (role creation)
      await bodyScope.findByText(/you have successfully created a new role/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

      await waitFor(
        () => {
          const calls = createRoleWithInventorySpy.mock.calls;
          expect(calls.length).toBeGreaterThan(0);
          const payload = calls[0]?.[0];
          const accessItem = payload?.access?.find((a: { permission?: string }) => a.permission === 'inventory:hosts:read');
          const rd = accessItem?.resourceDefinitions?.[0]?.attributeFilter?.value;
          expect(Array.isArray(rd)).toBe(true);
          expect(rd).toContain(null);
          expect(rd).toContain(FIXTURE_GROUP_1.id);
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Close success modal', async () => {
      const successModal = await waitForModal();
      const exitButton = successModal.getByRole('button', { name: /exit/i });
      await user.click(exitButton);
      await waitFor(
        () => {
          expect(within(document.body).queryByRole('dialog')).toBeNull();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });
  },
};
