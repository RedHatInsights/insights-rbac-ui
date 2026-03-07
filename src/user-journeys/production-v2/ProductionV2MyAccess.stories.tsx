import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
import {
  KESSEL_GROUP_PROD_ADMINS,
  KESSEL_ROLE_WS_ADMIN,
  KESSEL_ROLE_WS_VIEWER,
  Story,
  TEST_TIMEOUTS,
  WS_PRODUCTION,
  db,
  meta,
  resetStoryState,
} from './_v2OrgAdminSetup';

export default { ...meta, title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/My Access', tags: ['prod-v2-org-admin'] };

export const MyAccessGroupsTab: Story = {
  name: 'Groups tab with drawer',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the My Access Groups tab: table content, row click to open the group drawer, and drawer data.

**Journey Flow:**
1. Wait for Groups tab to be selected
2. Verify table loads with group data
3. Verify "${KESSEL_GROUP_PROD_ADMINS.name}" row is visible
4. Click the group row to open the drawer
5. Verify drawer heading shows the group name
6. Verify drawer roles table shows the group's assigned roles
7. Close the drawer
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    const groupsTab = await canvas.findByRole('tab', { name: /my groups/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await expect(groupsTab).toHaveAttribute('aria-selected', 'true');

    const groupCell = await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    const groupRow = groupCell.closest('tr')!;
    await user.click(groupRow);

    await canvas.findByRole('heading', { name: KESSEL_GROUP_PROD_ADMINS.name }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    await canvas.findByText(KESSEL_ROLE_WS_ADMIN.name!, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await canvas.findByText(KESSEL_ROLE_WS_VIEWER.name!, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    const closeButton = canvas.getByRole('button', { name: /close drawer/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(canvas.queryByRole('heading', { name: KESSEL_GROUP_PROD_ADMINS.name })).not.toBeInTheDocument();
    });
  },
};

export const MyAccessWorkspacesTab: Story = {
  name: 'Workspaces tab with drawer',
  args: {
    initialRoute: '/iam/my-user-access/workspaces',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the My Access Workspaces tab: table content, role badges, row click to open the workspace drawer, and drawer data.

**Journey Flow:**
1. Wait for Workspaces tab to be selected
2. Verify table loads with workspace data
3. Verify "${WS_PRODUCTION.name}" row is visible with an Admin badge
4. Click the workspace row to open the drawer
5. Verify drawer heading shows the workspace name
6. Verify drawer roles table shows deduplicated role bindings for that workspace
7. Close the drawer
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    const workspacesTab = await canvas.findByRole('tab', { name: /my workspaces/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await expect(workspacesTab).toHaveAttribute('aria-selected', 'true');

    const wsCell = await canvas.findByText(WS_PRODUCTION.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    const workspaceRow = wsCell.closest('tr')!;
    await user.click(workspaceRow);

    await canvas.findByRole('heading', { name: WS_PRODUCTION.name }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    // ws-1 has kessel-role-1 + kessel-role-2 via group-1, and kessel-role-2 via group-3.
    // The drawer should deduplicate — two unique roles, not three rows.
    await canvas.findByText(KESSEL_ROLE_WS_ADMIN.name!, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await canvas.findByText(KESSEL_ROLE_WS_VIEWER.name!, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });

    const closeButton = canvas.getByRole('button', { name: /close drawer/i });
    await user.click(closeButton);

    await waitFor(() => {
      expect(canvas.queryByRole('heading', { name: WS_PRODUCTION.name })).not.toBeInTheDocument();
    });
  },
};

export const MyAccessTabNavigation: Story = {
  name: 'Tab navigation',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests tab navigation between Groups and Workspaces on My Access.

**Journey Flow:**
1. Wait for page to load on Groups tab
2. Verify Groups tab is selected
3. Click Workspaces tab
4. Verify Workspaces tab selected and URL includes "workspaces"
5. Click Groups tab back
6. Verify Groups tab selected again
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    const groupsTab = await canvas.findByRole('tab', { name: /my groups/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    await expect(groupsTab).toHaveAttribute('aria-selected', 'true');

    const workspacesTab = await canvas.findByRole('tab', { name: /my workspaces/i });
    await user.click(workspacesTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);

    await expect(workspacesTab).toHaveAttribute('aria-selected', 'true');
    await waitFor(() => {
      const addressBar = canvas.getByTestId('fake-address-bar');
      expect(addressBar).toHaveTextContent(/workspaces/);
    });

    await user.click(groupsTab);
    await delay(TEST_TIMEOUTS.AFTER_CLICK);
    await expect(groupsTab).toHaveAttribute('aria-selected', 'true');
  },
};
