import { expect, within } from 'storybook/test';
import { Story, TEST_TIMEOUTS, meta, resetStoryState, v1Db } from './_v1OrgAdminSetup';

export default { ...meta, title: 'User Journeys/Production/V1 (Current)/Org Admin', tags: ['prod-org-admin'] };

export const ManualTesting: Story = {
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Interactive entry point for exploring the V1 Org Admin environment.

### Automated Checks
- My User Access page loads successfully
        `,
      },
    },
  },
  play: async (context) => {
    await resetStoryState(v1Db);
    const canvas = within(context.canvasElement);

    await expect(canvas.findByText(/your red hat enterprise linux/i, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).resolves.toBeInTheDocument();
  },
};
