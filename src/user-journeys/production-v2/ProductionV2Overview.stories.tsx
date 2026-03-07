import { expect, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
import { Story, TEST_TIMEOUTS, db, meta, resetStoryState } from './_v2OrgAdminSetup';

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
1. Wait for overview page to load (heading + Get Started card)
2. Verify "View roles" button is present
3. Click "View roles" → verify navigation to roles page
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    const headings = await canvas.findAllByRole('heading', { name: /user access/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    expect(headings.length).toBeGreaterThan(0);

    await waitFor(
      () => {
        const rolesBtn = canvas.getByRole('button', { name: /view roles/i });
        expect(rolesBtn).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    const viewGroupsButton = canvas.getByRole('button', { name: /view groups/i });
    expect(viewGroupsButton).toBeInTheDocument();

    const viewRolesButton = canvas.getByRole('button', { name: /view roles/i });
    await user.click(viewRolesButton);
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    await waitFor(() => {
      const addressBar = canvas.getByTestId('fake-address-bar');
      expect(addressBar).toHaveTextContent(/roles/);
    });
  },
};
