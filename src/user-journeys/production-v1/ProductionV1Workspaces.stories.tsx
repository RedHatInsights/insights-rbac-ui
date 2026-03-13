import { expect, within } from 'storybook/test';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import { createResettableCollection } from '../../shared/data/mocks/db';
import { createV1Handlers } from '../../v1/data/mocks/handlers';
import { createWorkspacesHandlers } from '../../v2/data/mocks/workspaces.handlers';
import { Story, meta, resetStoryState, v1Db, waitForPageToLoad } from './_v1OrgAdminSetup';
import { DEFAULT_WORKSPACES, WS_ROOT } from '../../v2/data/mocks/seed';

const workspacesCollection = createResettableCollection(DEFAULT_WORKSPACES);
const viewWorkspacesDb = {
  reset: () => {
    v1Db.reset();
    workspacesCollection.reset();
  },
};
const viewWorkspacesHandlers = [...createV1Handlers(v1Db), ...createWorkspacesHandlers(workspacesCollection)];

export default { ...meta, title: 'User Journeys/Production/V1 (Current)/Org Admin/Workspaces', tags: ['prod-org-admin'] };

export const ViewWorkspacesList: Story = {
  name: 'View workspaces list',
  args: {
    initialRoute: '/iam/user-access/workspaces',
  },
  parameters: {
    msw: {
      handlers: viewWorkspacesHandlers,
    },
    docs: {
      description: {
        story: `
Tests that V1 Org Admin can access the Workspaces page.

**What this tests:**
- Workspaces page loads correctly in V1 navigation
- Workspaces list renders with data from API
- Create workspace button is visible for admin
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(viewWorkspacesDb);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for page to load', async () => {
      await waitForPageToLoad(canvas, WS_ROOT.name);
    });

    await step('Verify workspaces list and create button', async () => {
      const workspacesHeading = await canvas.findByRole('heading', { name: /workspaces/i, level: 1 });
      expect(workspacesHeading).toBeInTheDocument();
      expect(canvas.getByText(WS_ROOT.name)).toBeInTheDocument();
      const createButton = await canvas.findByRole('button', { name: /create workspace/i });
      expect(createButton).toBeInTheDocument();
    });
  },
};
