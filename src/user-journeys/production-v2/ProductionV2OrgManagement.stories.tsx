import { expect, userEvent, waitFor, within } from 'storybook/test';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import {
  KESSEL_GROUP_PROD_ADMINS,
  KESSEL_GROUP_VIEWERS,
  KESSEL_ROLE_WS_ADMIN,
  KESSEL_ROLE_WS_VIEWER,
  Story,
  TEST_TIMEOUTS,
  USER_JANE,
  USER_JOHN,
  db,
  meta,
  resetStoryState,
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
7. Verify NO workspace-specific actions (no "Edit access", no "Remove from workspace")
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

      expect(canvas.queryByRole('button', { name: /grant access/i })).not.toBeInTheDocument();

      const productionAdminsRow = prodAdminsCell.closest('tr')!;
      await user.click(productionAdminsRow);
    });

    await step('Verify drawer content and roles tab', async () => {
      await canvas.findByRole('heading', { name: KESSEL_GROUP_PROD_ADMINS.name });

      expect(canvas.queryByRole('button', { name: /edit access for this workspace/i })).not.toBeInTheDocument();
      expect(canvas.queryByRole('button', { name: /remove.*from workspace/i })).not.toBeInTheDocument();

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
