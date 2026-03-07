import { expect, within } from 'storybook/test';
import { delay } from 'msw';
import { Story, TEST_TIMEOUTS, meta, resetStoryState, v1Db } from './_v1OrgAdminSetup';

export default { ...meta, title: 'User Journeys/Production/V1 (Current)/Org Admin/Navigation', tags: ['prod-org-admin'] };

export const SidebarValidation: Story = {
  name: 'All admin items visible',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Validates that Org Admin sees all sidebar items.

**Checks:**
- ✅ "My User Access" link IS present
- ✅ "User Access" expandable section IS present
- ✅ "Users" link IS present
- ✅ "Groups" link IS present
- ✅ "Roles" link IS present
- ✅ "Workspaces" link IS present (requires inventory:groups:read + workspaces flag)
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(v1Db);
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    const myUserAccess = await canvas.findByRole('link', { name: /my user access/i });
    expect(myUserAccess).toBeInTheDocument();

    const userAccessSection = await canvas.findByRole('button', { name: /user access/i });
    expect(userAccessSection).toBeInTheDocument();

    const usersLink = await canvas.findByRole('link', { name: /^users$/i });
    expect(usersLink).toBeInTheDocument();

    const groupsLink = await canvas.findByRole('link', { name: /^groups$/i });
    expect(groupsLink).toBeInTheDocument();

    const rolesLink = await canvas.findByRole('link', { name: /^roles$/i });
    expect(rolesLink).toBeInTheDocument();

    const workspacesLink = await canvas.findByRole('link', { name: /workspaces/i });
    expect(workspacesLink).toBeInTheDocument();
  },
};
