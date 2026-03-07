import { expect, within } from 'storybook/test';
import { Story, TEST_TIMEOUTS, db, meta, resetStoryState } from './_v2OrgAdminSetup';

export default { ...meta, title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin', tags: ['prod-v2-org-admin'] };

export const ManualTesting: Story = {
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Interactive entry point for exploring the full Management Fabric experience as an org admin with all M1–M5 features enabled.

Use the **Controls** panel to toggle individual V2 flags and test partial rollouts.
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);

    await expect(canvas.findByRole('tab', { name: /users/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).resolves.toBeInTheDocument();
  },
};
