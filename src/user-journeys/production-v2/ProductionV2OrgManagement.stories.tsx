import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
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
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);
    await expect(
      canvas.findByRole('heading', { name: /organization-wide access/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT }),
    ).resolves.toBeInTheDocument();

    // Verify org details are rendered (org_id: 12510751, account_number: 123456)
    await expect(canvas.findByText('12510751')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('123456')).resolves.toBeInTheDocument();

    // Wait for the role assignments table to load with real data (skeleton table is a different DOM element)
    const prodAdminsCell = await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await canvas.findByText(KESSEL_GROUP_VIEWERS.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    // No "Grant access" button should appear (no workspace context)
    expect(canvas.queryByRole('button', { name: /grant access/i })).not.toBeInTheDocument();

    // Click "Production Admins" row to open the drawer
    const productionAdminsRow = prodAdminsCell.closest('tr')!;
    await user.click(productionAdminsRow);

    // Drawer should open with group name heading
    await canvas.findByRole('heading', { name: KESSEL_GROUP_PROD_ADMINS.name }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    // Verify NO workspace-specific action buttons in drawer
    expect(canvas.queryByRole('button', { name: /edit access for this workspace/i })).not.toBeInTheDocument();
    expect(canvas.queryByRole('button', { name: /remove.*from workspace/i })).not.toBeInTheDocument();

    // Roles tab is active by default — verify role data loads
    await canvas.findByText(KESSEL_ROLE_WS_ADMIN.name!, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await canvas.findByText(KESSEL_ROLE_WS_VIEWER.name!, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    // Switch to Users tab
    const usersTab = canvas.getByRole('tab', { name: /users/i });
    await user.click(usersTab);

    // Verify member data loads
    await canvas.findByText(USER_JOHN.username, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await canvas.findByText(USER_JANE.username, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    // Close the drawer
    const closeButton = canvas.getByRole('button', { name: /close drawer/i });
    await user.click(closeButton);

    // Drawer heading should be gone
    await waitFor(() => {
      expect(canvas.queryByRole('heading', { name: KESSEL_GROUP_PROD_ADMINS.name })).not.toBeInTheDocument();
    });
  },
};
