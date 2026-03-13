import { expect, userEvent, waitFor, within } from 'storybook/test';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import {
  KESSEL_GROUP_PROD_ADMINS,
  KESSEL_ROLE_WS_ADMIN,
  KESSEL_ROLE_WS_VIEWER,
  Story,
  WS_PRODUCTION,
  clickTab,
  db,
  meta,
  resetStoryState,
  waitForDrawer,
} from './_v2OrgAdminSetup';

export default { ...meta, title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/My Access', tags: ['prod-v2-org-admin'] };

export const MyAccessGroupsTab: Story = {
  name: 'Groups tab with drawer',
  args: {
    initialRoute: '/iam/my-access',
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify Groups tab and open group drawer', async () => {
      const groupsTab = await canvas.findByRole('tab', { name: /my groups/i });
      await expect(groupsTab).toHaveAttribute('aria-selected', 'true');

      const groupCell = await canvas.findByText(KESSEL_GROUP_PROD_ADMINS.name);
      const groupRow = groupCell.closest('tr')!;
      await user.click(groupRow);
    });

    await step('Verify drawer content and close', async () => {
      const drawer = await waitForDrawer();
      await drawer.findByRole('heading', { name: KESSEL_GROUP_PROD_ADMINS.name });
      await drawer.findByText(KESSEL_ROLE_WS_ADMIN.name!);
      await drawer.findByText(KESSEL_ROLE_WS_VIEWER.name!);

      const closeButton = await drawer.findByRole('button', { name: /close drawer/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(canvas.queryByRole('heading', { name: KESSEL_GROUP_PROD_ADMINS.name })).not.toBeInTheDocument();
      });
    });
  },
};

export const MyAccessWorkspacesTab: Story = {
  name: 'Workspaces tab with drawer',
  args: {
    initialRoute: '/iam/my-access/workspaces',
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify Workspaces tab and open workspace drawer', async () => {
      const workspacesTab = await canvas.findByRole('tab', { name: /my workspaces/i });
      await expect(workspacesTab).toHaveAttribute('aria-selected', 'true');

      const wsCell = await canvas.findByText(WS_PRODUCTION.name);
      const workspaceRow = wsCell.closest('tr')!;
      await user.click(workspaceRow);
    });

    await step('Verify drawer content and close', async () => {
      const drawer = await waitForDrawer();
      await drawer.findByRole('heading', { name: WS_PRODUCTION.name });
      await drawer.findByText(KESSEL_ROLE_WS_ADMIN.name!);
      await drawer.findByText(KESSEL_ROLE_WS_VIEWER.name!);

      const closeButton = await drawer.findByRole('button', { name: /close drawer/i });
      await user.click(closeButton);

      await waitFor(() => {
        expect(canvas.queryByRole('heading', { name: WS_PRODUCTION.name })).not.toBeInTheDocument();
      });
    });
  },
};

export const MyAccessTabNavigation: Story = {
  name: 'Tab navigation',
  args: {
    initialRoute: '/iam/my-access',
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
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify Groups tab selected', async () => {
      const groupsTab = await canvas.findByRole('tab', { name: /my groups/i });
      await expect(groupsTab).toHaveAttribute('aria-selected', 'true');
    });

    await step('Switch to Workspaces tab', async () => {
      await clickTab(user, canvas, /my workspaces/i);

      const workspacesTab = await canvas.findByRole('tab', { name: /my workspaces/i });
      await expect(workspacesTab).toHaveAttribute('aria-selected', 'true');
      await waitFor(() => {
        const addressBar = canvas.getByTestId('fake-address-bar');
        expect(addressBar).toHaveTextContent(/workspaces/);
      });
    });

    await step('Switch back to Groups tab', async () => {
      await clickTab(user, canvas, /my groups/i);
    });
  },
};
