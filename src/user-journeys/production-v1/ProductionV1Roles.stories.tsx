import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
import { fillCreateRoleWizard } from '../../v1/features/roles/CreateRole.helpers';
import { fillCopyRoleWizard } from '../../v1/features/roles/CopyRole.helpers';
import { fillEditRoleModal } from '../../v1/features/roles/EditRole.helpers';
import { confirmDeleteRoleModal } from '../../v1/features/roles/DeleteRole.helpers';
import { rolesAddToGroupVisibilityFixtures } from '../../v1/data/mocks/rolesVisibility.fixtures';
import { expandRoleGroups, expectAddRoleLinkHidden, expectAddRoleLinkVisible, getGroupRow } from '../_shared/helpers/rolesTableHelpers';
import { pollUntilTrue } from '../_shared/helpers';
import { createV1MockDb } from '../../v1/data/mocks/db';
import { createV1Handlers } from '../../v1/data/mocks/handlers';
import { createInventoryHandlers } from '../../v1/data/mocks/inventory.handlers';
import { defaultInventoryGroups } from '../../v1/data/mocks/inventory.fixtures';
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
  play: async (context) => {
    await resetStoryState(v1Db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Roles');
    await waitForPageToLoad(canvas, V1_ROLE_VIEWER.name);

    const createButton = await canvas.findByRole('button', { name: /create role/i });
    await user.click(createButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await fillCreateRoleWizard(user, 'Automation Test Role', 'A test custom role for automation', ['insights:*:*']);

    await waitForPageToLoad(canvas, V1_ROLE_VIEWER.name);

    await waitFor(
      () => {
        expect(canvas.getByText('Automation Test Role')).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );
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
  play: async (context) => {
    await resetStoryState(v1Db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Roles');
    await waitForPageToLoad(canvas, V1_ROLE_CUSTOM.name);

    const createButton = await canvas.findByRole('button', { name: /create role/i });
    await user.click(createButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await fillCopyRoleWizard(user, V1_ROLE_CUSTOM.name);

    await waitForPageToLoad(canvas, V1_ROLE_CUSTOM.name);

    await waitFor(
      () => {
        expect(canvas.getByText('Copy of Custom Role')).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
    );
  },
};

export const EditRoleJourney: Story = {
  name: 'Edit role',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState(v1Db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Roles');
    await waitForPageToLoad(canvas, V1_ROLE_ADMIN.name);

    await openRoleActionsMenu(user, canvas, V1_ROLE_CUSTOM.name);
    await clickMenuItem(user, 'Edit');

    await fillEditRoleModal(user, 'Updated Custom Role', 'Updated description for custom role');

    await verifySuccessNotification();
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    await waitFor(async () => {
      await expect(canvas.getByText('Updated Custom Role')).toBeInTheDocument();
    });
  },
};

export const EditRoleFromDetailPage: Story = {
  name: 'Edit from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState(v1Db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Roles');
    await waitForPageToLoad(canvas, V1_ROLE_CUSTOM.name);

    const roleLink = canvas.getByRole('link', { name: V1_ROLE_CUSTOM.name });
    await user.click(roleLink);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: V1_ROLE_CUSTOM.name })).toBeInTheDocument();
    });

    await openDetailPageActionsMenu(user, canvas);
    await clickMenuItem(user, 'Edit');

    await fillEditRoleModal(user, 'Updated Custom Role', 'Updated from detail page');

    await Promise.all([
      verifySuccessNotification(),
      waitFor(async () => {
        await expect(canvas.getByRole('heading', { name: 'Updated Custom Role' })).toBeInTheDocument();
      }),
    ]);
  },
};

export const DeleteRoleFromList: Story = {
  name: 'Delete role',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState(v1Db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Roles');
    await waitForPageToLoad(canvas, V1_ROLE_ADMIN.name);

    await openRoleActionsMenu(user, canvas, V1_ROLE_CUSTOM.name);
    await clickMenuItem(user, 'Delete');

    await confirmDeleteRoleModal(user);

    await verifySuccessNotification();

    await waitFor(() => {
      expect(canvas.queryByText(V1_ROLE_CUSTOM.name)).not.toBeInTheDocument();
      expect(canvas.getByText(V1_ROLE_ADMIN.name)).toBeInTheDocument();
    });
  },
};

export const DeleteRoleFromDetailPage: Story = {
  name: 'Delete from detail page',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  play: async (context) => {
    await resetStoryState(v1Db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Roles');
    await waitForPageToLoad(canvas, V1_ROLE_CUSTOM.name);

    const roleLink = canvas.getByRole('link', { name: V1_ROLE_CUSTOM.name });
    await user.click(roleLink);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await waitFor(async () => {
      await expect(canvas.getByRole('heading', { name: V1_ROLE_CUSTOM.name })).toBeInTheDocument();
    });

    await openDetailPageActionsMenu(user, canvas);
    await clickMenuItem(user, 'Delete');

    await confirmDeleteRoleModal(user);

    await verifySuccessNotification();

    await waitForPageToLoad(canvas, V1_ROLE_ADMIN.name);

    await waitFor(() => {
      expect(canvas.queryByText(V1_ROLE_CUSTOM.name)).not.toBeInTheDocument();
      expect(canvas.getByText(V1_ROLE_ADMIN.name)).toBeInTheDocument();
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
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await resetStoryState(rolesAddToGroupLinkDb);

    await navigateToPage(user, canvas, 'Roles');
    await waitForPageToLoad(canvas, 'Test Role With Groups');

    const mainElement = document.querySelector('main') || context.canvasElement;
    const mainContent = within(mainElement as HTMLElement);

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

    const anotherTestRoleLink = await mainContent.findByRole('link', { name: 'Another Test Role' });
    const { expandedContent: otherExpandedContent } = await expandRoleGroups(user, anotherTestRoleLink);

    const engineeringLink = await otherExpandedContent.findByRole('link', { name: GROUP_ENGINEERING.name });
    expectAddRoleLinkVisible(getGroupRow(engineeringLink));
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
  play: async (context) => {
    await resetStoryState(inventoryGroupsDb);
    createRoleWithInventorySpy.mockClear();

    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await navigateToPage(user, canvas, 'Roles');
    await waitForPageToLoad(canvas, V1_ROLE_CUSTOM.name);

    const createButton = await canvas.findByRole('button', { name: /create role/i });
    await user.click(createButton);
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // --- Copy wizard: select "Copy an existing role" and pick Custom Role ---
    await pollUntilTrue(() => {
      const d = document.querySelector('[role="dialog"]');
      return !!d && !!within(d as HTMLElement).queryByRole('radio', { name: /copy an existing role/i });
    }, 5000);
    const modal = document.querySelector('[role="dialog"]') as HTMLElement;
    await delay(300);

    const copyRadio = within(modal).getByRole('radio', { name: /copy an existing role/i });
    await user.click(copyRadio);
    await delay(500);

    await pollUntilTrue(() => !!within(modal).queryByRole('grid'), 5000);
    await delay(300);

    const sourceRoleRadio = within(modal).getByRole('radio', { name: new RegExp(V1_ROLE_CUSTOM.name, 'i') });
    await user.click(sourceRoleRadio);
    await delay(300);

    const primaryNext = () => {
      const allNext = within(modal).queryAllByRole('button', { name: /^next$/i });
      return allNext.find((btn) => btn.classList.contains('pf-m-primary'));
    };

    // Step 1 → Name & description
    await pollUntilTrue(() => {
      const btn = primaryNext();
      return !!btn && !btn.hasAttribute('disabled');
    }, 5000);
    primaryNext()!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await delay(500);

    // Step 2 → auto-generated name is fine, click Next
    await pollUntilTrue(() => !!within(modal).queryByLabelText(/role name/i), 5000);
    await delay(1000);
    await pollUntilTrue(() => {
      const btn = primaryNext();
      return !!btn && !btn.hasAttribute('disabled');
    }, 10000);
    primaryNext()!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await delay(500);

    // Step 3 → Permissions (inherited), click Next
    if (within(modal).queryByRole('heading', { name: /add permissions/i })) {
      await pollUntilTrue(() => {
        const btn = primaryNext();
        return !!btn && !btn.hasAttribute('disabled');
      }, 5000);
      primaryNext()!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
      await delay(500);
    }

    // Step 4 → "Define Inventory group access"
    await pollUntilTrue(() => !!within(modal).queryByRole('heading', { name: /inventory group access|workspaces access/i }), 5000);

    // Wait for the dropdown combobox to appear (data loaded)
    await pollUntilTrue(() => !!modal.querySelector('[role="combobox"]'), 5000);
    await delay(300);

    // Open the first dropdown
    const combobox = modal.querySelector('[role="combobox"]') as HTMLElement;
    await user.click(combobox);
    await delay(300);

    // Wait for menu options
    await pollUntilTrue(() => {
      const menu = document.querySelector('[role="menu"]');
      return !!menu && !!menu.querySelector('[role="option"]');
    }, 3000);

    // Select "Ungrouped systems"
    const bodyScope = within(document.body);
    const ungroupedOption = await bodyScope.findByText(/ungrouped systems/i);
    await user.click(ungroupedOption);
    await delay(200);

    // Select the first fixture group
    const groupOption = await bodyScope.findByText(FIXTURE_GROUP_1.name);
    await user.click(groupOption);
    await delay(200);

    // Close dropdown
    const toggleBtn = combobox.closest('.rbac-c-resource-type-select')?.querySelector('button[aria-expanded="true"]');
    if (toggleBtn) {
      (toggleBtn as HTMLElement).click();
      await delay(200);
    }

    // "Copy to all" so all inventory permission rows are satisfied
    const copyToAll = within(modal).queryByText(/copy to all/i);
    if (copyToAll) {
      await user.click(copyToAll);
      await delay(300);
    }

    // Next → Review
    await pollUntilTrue(() => {
      const btn = primaryNext();
      return !!btn && !btn.hasAttribute('disabled');
    }, 5000);
    primaryNext()!.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    await delay(500);

    // Step 5 → Review and submit
    await pollUntilTrue(() => !!within(modal).queryByRole('heading', { name: /review details/i }), 5000);
    await delay(300);

    const submitBtn = within(modal).getByRole('button', { name: /submit/i });
    await pollUntilTrue(() => !submitBtn.hasAttribute('disabled'), 5000);
    submitBtn.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));

    // Wait for success
    await pollUntilTrue(() => {
      const d = document.querySelector('[role="dialog"]');
      return !!d && !!within(d as HTMLElement).queryByText(/you have successfully created a new role/i);
    }, 5000);

    // --- Verify the API payload includes null (Ungrouped systems) in resourceDefinitions ---
    await expect(createRoleWithInventorySpy).toHaveBeenCalledWith(
      expect.objectContaining({
        access: expect.arrayContaining([
          expect.objectContaining({
            permission: 'inventory:hosts:read',
            resourceDefinitions: [
              expect.objectContaining({
                attributeFilter: expect.objectContaining({
                  key: 'group.id',
                  operation: 'in',
                  value: expect.arrayContaining([null, FIXTURE_GROUP_1.id]),
                }),
              }),
            ],
          }),
        ]),
      }),
    );

    // Exit wizard
    await delay(300);
    const successDialog = document.querySelector('[role="dialog"]') as HTMLElement;
    const exitButton = within(successDialog).getByRole('button', { name: /exit/i });
    await user.click(exitButton);
    await pollUntilTrue(() => !document.querySelector('[role="dialog"]'), 5000);
  },
};
