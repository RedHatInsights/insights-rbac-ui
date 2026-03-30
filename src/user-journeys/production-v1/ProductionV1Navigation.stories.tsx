import { expect, within } from 'storybook/test';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import { Story, meta, resetStoryState, v1Db } from './_v1OrgAdminSetup';

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
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for sidebar to expand', async () => {
      await canvas.findByRole('link', { name: /my user access/i });
    });

    await step('Verify all admin sidebar items visible', async () => {
      const myUserAccess = canvas.getByRole('link', { name: /my user access/i });
      expect(myUserAccess).toBeInTheDocument();

      const userAccessSection = await canvas.findByRole('button', { name: /user access/i });
      expect(userAccessSection).toBeInTheDocument();

      const usersLink = await canvas.findByRole('link', { name: /^users$/i });
      expect(usersLink).toBeInTheDocument();

      const groupsLink = await canvas.findByRole('link', { name: /^groups$/i });
      expect(groupsLink).toBeInTheDocument();

      const rolesLink = await canvas.findByRole('link', { name: /^roles$/i });
      expect(rolesLink).toBeInTheDocument();
    });
  },
};
