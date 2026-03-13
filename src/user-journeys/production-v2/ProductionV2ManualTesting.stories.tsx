import { expect, within } from 'storybook/test';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import { Story, db, meta, resetStoryState } from './_v2OrgAdminSetup';

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
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify Users tab visible', async () => {
      await expect(canvas.findByRole('tab', { name: /users/i })).resolves.toBeInTheDocument();
    });
  },
};
