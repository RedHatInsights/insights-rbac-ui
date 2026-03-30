import { expect, userEvent, waitFor, within } from 'storybook/test';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import {
  KESSEL_GROUP_DEV_TEAM,
  KESSEL_GROUP_PROD_ADMINS,
  KESSEL_GROUP_VIEWERS,
  KESSEL_ROLE_WS_ADMIN,
  KESSEL_ROLE_WS_VIEWER,
  Story,
  TEST_TIMEOUTS,
  USER_JANE,
  USER_JOHN,
  batchCreateRoleBindingsSpy,
  db,
  meta,
  resetStoryState,
  waitForModal,
} from './_v2OrgAdminSetup';

export default { ...meta, title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Organization Management', tags: ['prod-v2-org-admin'] };

export const OrganizationManagementContent: Story = {
  name: 'Content & drawer',
  args: {
    initialRoute: '/iam/organization-management/organization-wide-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the Organization-Wide Access page content and group details drawer.

**Journey Flow:**
1. Wait for Organization-Wide Access heading
2. Verify organization details (name, account number, org ID)
3. Verify role assignments table loads with group data
4. Click a group row to open the drawer
5. Verify drawer shows group name, roles tab with role data
6. Switch to Users tab, verify member data
7. Verify NO workspace-specific actions (no "Edit access", no "Remove access")
8. Close the drawer
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

    await step('Wait for page and verify org details', async () => {
      await expect(canvas.findByRole('heading', { name: /organization-wide access/i })).resolves.toBeInTheDocument();

      await expect(canvas.findByText('12510751')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('123456')).resolves.toBeInTheDocument();
    });

    await step('Verify role assignments table and open drawer', async () => {
      const prodAdminsCell = await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await canvas.findByText(KESSEL_GROUP_VIEWERS.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

      await expect(canvas.findByRole('button', { name: /grant access/i })).resolves.toBeInTheDocument();

      const productionAdminsRow = prodAdminsCell.closest('tr')!;
      await user.click(productionAdminsRow);
    });

    await step('Verify drawer content and roles tab', async () => {
      await canvas.findByRole('heading', { name: KESSEL_GROUP_PROD_ADMINS.name });

      expect(canvas.queryByRole('button', { name: /^edit access$/i })).not.toBeInTheDocument();
      expect(canvas.queryByRole('button', { name: /^remove access$/i })).not.toBeInTheDocument();

      await canvas.findByText(KESSEL_ROLE_WS_ADMIN.name!);
      await canvas.findByText(KESSEL_ROLE_WS_VIEWER.name!);
    });

    await step('Switch to Users tab and verify member data', async () => {
      const usersTab = await canvas.findByRole('tab', { name: /users/i });
      await user.click(usersTab);

      await canvas.findByText(USER_JOHN.username);
      await canvas.findByText(USER_JANE.username);
    });

    await step('Close drawer and verify it closes', async () => {
      const closeButton = await canvas.findByRole('button', { name: /close drawer/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(canvas.queryByRole('heading', { name: KESSEL_GROUP_PROD_ADMINS.name })).not.toBeInTheDocument();
      });
    });
  },
};

export const GrantOrgAccess: Story = {
  tags: ['skip-test'],
  name: 'Grant organization-wide access',
  args: {
    initialRoute: '/iam/organization-management/organization-wide-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
## Grant Organization-Wide Access

Tests the grant access wizard at the tenant/organization level.

### Journey Flow
1. Navigate to Organization-Wide Access page
2. Click **Grant access** button
3. Select **Development Team** group
4. Click **Next** to roles step
5. Select a role from the tenant-scoped list
6. Click **Next** to review step
7. Verify selections, click **Submit**
8. Verify \`batchCreateRoleBindings\` API spy called with resource type "tenant"
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
      batchCreateRoleBindingsSpy.mockClear();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page and open grant access wizard', async () => {
      await expect(canvas.findByRole('heading', { name: /organization-wide access/i })).resolves.toBeInTheDocument();

      await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

      const grantBtn = await canvas.findByRole('button', { name: /grant access/i });
      await user.click(grantBtn);

      const body = within(document.body);
      await body.findByText(/grant organization-wide access/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });

    await step('Select Development Team and advance to roles step', async () => {
      const body = within(document.body);

      const devTeamText = await body.findByText(KESSEL_GROUP_DEV_TEAM.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      const devTeamRow = devTeamText.closest('tr') as HTMLElement;
      await user.click(within(devTeamRow).getByRole('checkbox'));

      const wizardScope = await waitForModal();
      const nextButton = await wizardScope.findByRole('button', { name: /^next$/i });
      await user.click(nextButton);

      await expect(body.findByRole('heading', { name: /select role\(s\)/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).resolves.toBeInTheDocument();
    });

    await step('Select a role, advance to review, and submit', async () => {
      const body = within(document.body);

      await waitFor(
        () => {
          const checkboxes = body.queryAllByRole('checkbox');
          expect(checkboxes.length).toBeGreaterThan(0);
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );

      const checkboxes = body.getAllByRole('checkbox');
      await user.click(checkboxes[0]);

      const wizardScope2 = await waitForModal();
      const nextButton2 = await wizardScope2.findByRole('button', { name: /^next$/i });
      await user.click(nextButton2);

      await body.findByText(KESSEL_GROUP_DEV_TEAM.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

      const submitButton = await body.findByRole('button', { name: /submit/i });
      await user.click(submitButton);
    });

    await step('Verify API spy called with tenant resource type', async () => {
      await waitFor(
        () => {
          expect(batchCreateRoleBindingsSpy).toHaveBeenCalledTimes(1);
          expect(batchCreateRoleBindingsSpy).toHaveBeenCalledWith(
            expect.objectContaining({
              requests: expect.arrayContaining([
                expect.objectContaining({
                  subject: expect.objectContaining({ id: KESSEL_GROUP_DEV_TEAM.uuid, type: 'group' }),
                  resource: expect.objectContaining({ type: 'tenant' }),
                }),
              ]),
            }),
          );
        },
        { timeout: TEST_TIMEOUTS.NOTIFICATION_WAIT },
      );
    });
  },
};
