import { expect, within } from 'storybook/test';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import { Story, meta, resetStoryState, v1Db } from './_v1OrgAdminSetup';

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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify My User Access page loads', async () => {
      await expect(canvas.findByText(/your red hat enterprise linux/i)).resolves.toBeInTheDocument();
    });
  },
};
