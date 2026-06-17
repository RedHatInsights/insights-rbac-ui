import { expect, userEvent, waitFor, within } from 'storybook/test';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import { Story, db, meta, resetStoryState } from './_v2OrgAdminSetup';

export default { ...meta, title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Overview', tags: ['prod-v2-org-admin'] };

export const OverviewLinkNavigation: Story = {
  name: 'Link navigation',
  args: {
    initialRoute: '/iam/overview',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the Overview page content and link navigation.

**Journey Flow:**
1. Wait for overview page to load (Access Management heading + service cards)
2. Verify "View roles" link is present
3. Click "View roles" → verify navigation to roles page
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

    await step('Verify overview page content', async () => {
      const headings = await canvas.findAllByRole('heading', { name: /access management/i });
      expect(headings.length).toBeGreaterThan(0);

      const viewRolesLink = await canvas.findByRole('link', { name: /view roles/i });
      expect(viewRolesLink).toBeInTheDocument();

      const viewGroupsLink = await canvas.findByRole('link', { name: /view groups/i });
      expect(viewGroupsLink).toBeInTheDocument();
    });

    await step('Click View roles and verify navigation', async () => {
      const viewRolesLink = await canvas.findByRole('link', { name: /view roles/i });
      await user.click(viewRolesLink);

      await waitFor(() => {
        const addressBar = canvas.queryByTestId('fake-address-bar');
        expect(addressBar).toHaveTextContent(/roles/);
      });
    });
  },
};
