import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { fn } from 'storybook/test';
import { ManagedSelector } from './ManagedSelector';
import WorkspaceType from './WorkspaceType';
import { emptyWorkspacesHandler, errorWorkspacesHandler, slowWorkspaceHandlers, workspaceHandlers } from '../../../../test/msw-handlers';
import { HttpResponse, delay, http } from 'msw';

// Mock data for duplicate workspaces scenario
const duplicateWorkspacesResponse = {
  data: [
    {
      id: 'F',
      type: WorkspaceType.ROOT,
      name: 'Root Workspace',
      description: 'This is a duplicate workspace',
      created: '2023-01-11T00:00:00Z',
      updated: '2023-01-12T00:00:00Z',
    },
    {
      id: 'G',
      parent_id: 'F',
      type: WorkspaceType.DEFAULT,
      name: 'Duplicate Workspace',
      description: 'This is a duplicate workspace',
      created: '2023-01-13T00:00:00Z',
      updated: '2023-01-14T00:00:00Z',
    },
    {
      id: 'H',
      parent_id: 'F',
      type: WorkspaceType.DEFAULT,
      name: 'Duplicate Workspace',
      description: 'This is a duplicate workspace',
      created: '2023-01-15T00:00:00Z',
      updated: '2023-01-16T00:00:00Z',
    },
  ],
};

// Helper function to create error responses
const createErrorHandler = (code: number, message: string) =>
  http.get('/api/rbac/v2/workspaces/*', () => {
    return HttpResponse.json({ errors: [{ detail: message }] }, { status: code });
  });

const duplicateWorkspacesHandler = http.get('/api/rbac/v2/workspaces/*', () => {
  return HttpResponse.json(duplicateWorkspacesResponse);
});

const meta: Meta<typeof ManagedSelector> = {
  component: ManagedSelector,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Smart component that manages workspace selection with API integration, state management, and search filtering.

## Test Coverage
This component includes comprehensive testing for:
- Tree expansion and collapse interactions
- Search/filter functionality 
- Error handling for various HTTP status codes
- Empty state handling
- Duplicate workspace name scenarios
- Selection callbacks and state management

## Converted from Cypress Tests
These stories replace the previous Cypress component tests for more integrated development workflow.
        `,
      },
    },
    msw: {
      handlers: workspaceHandlers,
    },
  },
  argTypes: {
    onSelect: {
      description: 'Callback function when a workspace is selected',
      action: 'workspace-selected',
    },
    initialSelectedWorkspace: {
      description: 'Initial workspace to be selected',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<typeof ManagedSelector>;

// Default args
const defaultArgs = {
  onSelect: fn(),
  initialSelectedWorkspace: undefined,
};

export const LoadingAndLoaded: Story = {
  args: defaultArgs,
  parameters: {
    msw: {
      handlers: slowWorkspaceHandlers,
    },
    docs: {
      description: {
        story: 'Tests the loading state transition and basic tree rendering after data loads.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Stage 1: wait until the component has mounted and rendered anything (look for menu toggle skeleton)
    await waitFor(
      async () => {
        const toggleNode = canvasElement.querySelector('.pf-v6-c-menu-toggle');
        await expect(toggleNode).not.toBeNull();
      },
      { timeout: 15000 },
    );

    // Stage 2: wait for the toggle text to appear once MSW data arrives
    await expect(canvas.findByText('Select workspaces', {}, { timeout: 15000 })).resolves.toBeInTheDocument();

    // Click to expand the selector
    const toggle = await canvas.findByText('Select workspaces');
    await userEvent.click(toggle);

    // Wait for loading spinner to appear in the dropdown panel (rendered in portal)
    await expect(within(document.body).findByRole('progressbar', {}, { timeout: 5000 })).resolves.toBeInTheDocument();

    // Wait for loading to complete and content to appear (dropdown renders via portal)
    await expect(within(document.body).findByPlaceholderText('Find a workspace by name')).resolves.toBeInTheDocument();
    await expect(within(document.body).findByText('Production Environment')).resolves.toBeInTheDocument();

    // Expand the Production Environment to see its children
    const expandButton = document.body.querySelector('.pf-v6-c-tree-view__node-toggle') as HTMLButtonElement;
    await userEvent.click(expandButton);

    // Now check for child workspaces that should be visible after expansion
    await expect(within(document.body).findByText('Web Services')).resolves.toBeInTheDocument();
    await expect(within(document.body).findByText('API Services')).resolves.toBeInTheDocument();
    await expect(within(document.body).findByText('Development Environment')).resolves.toBeInTheDocument();
  },
};

export const TreeExpansionAndCollapse: Story = {
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story: 'Tests detailed tree expansion and collapse behavior, ensuring proper hierarchical navigation.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for loading to complete
    await expect(canvas.findByText('Select workspaces', {}, { timeout: 3000 })).resolves.toBeInTheDocument();

    // Click to expand the selector
    const toggle = await canvas.findByText('Select workspaces');
    await userEvent.click(toggle);

    // Wait for tree to be visible (dropdown renders via portal)
    await expect(within(document.body).findByText('Production Environment')).resolves.toBeInTheDocument();

    // Initially, child workspaces should not be visible
    await expect(within(document.body).queryByText('Web Services')).not.toBeInTheDocument();
    await expect(within(document.body).queryByText('API Services')).not.toBeInTheDocument();

    // Click to expand Production Environment
    const expandButton = document.body.querySelector('.pf-v6-c-tree-view__node-toggle') as HTMLButtonElement;
    await userEvent.click(expandButton);

    // Now child workspaces should be visible
    await expect(within(document.body).findByText('Web Services')).resolves.toBeInTheDocument();
    await expect(within(document.body).findByText('API Services')).resolves.toBeInTheDocument();

    // Click to collapse again
    await userEvent.click(expandButton);

    // Child workspaces should be hidden again
    await expect(within(document.body).queryByText('Web Services')).not.toBeInTheDocument();
    await expect(within(document.body).queryByText('API Services')).not.toBeInTheDocument();
  },
};

export const WithInitialSelection: Story = {
  args: {
    ...defaultArgs,
    initialSelectedWorkspace: {
      id: 'workspace-1',
      name: 'Production Environment',
      workspace: {
        id: 'workspace-1',
        name: 'Production Environment',
        description: 'Main production workspace',
        parent_id: undefined,
        type: WorkspaceType.ROOT,
        created: '2024-01-01T00:00:00Z',
        updated: '2024-01-01T00:00:00Z',
      },
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Tests initialization with a pre-selected workspace.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for loading to complete
    await expect(canvas.findByText('Production Environment', {}, { timeout: 3000 })).resolves.toBeInTheDocument();

    // Should show the initially selected workspace in toggle
    await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();
  },
};

export const SelectionCallback: Story = {
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story: 'Tests workspace selection callbacks and toggle text updates.',
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for loading to complete
    await expect(canvas.findByText('Select workspaces')).resolves.toBeInTheDocument();

    // Click to expand dropdown
    const toggle = await canvas.findByText('Select workspaces');
    await userEvent.click(toggle);

    // Test 1: Select top-level "Production Environment" workspace
    // Wait for the workspace to appear and click it (dropdown renders via portal)
    const prodEnvButton = await within(document.body).findByText('Production Environment');
    await userEvent.click(prodEnvButton);

    // Should call onSelect with correct Production Environment workspace data
    await waitFor(async () => {
      await expect(args.onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'workspace-1',
          name: 'Production Environment',
          workspace: expect.objectContaining({
            id: 'workspace-1',
            name: 'Production Environment',
            type: WorkspaceType.ROOT,
          }),
        }),
      );
    });

    // Should update the toggle text
    let menuToggle = canvasElement.querySelector('.pf-v6-c-menu-toggle');
    await expect(menuToggle).toHaveTextContent('Production Environment');

    // Reset mock for second test
    (args.onSelect as ReturnType<typeof fn>).mockClear();

    // Test 2: Expand tree and select "API Services" workspace (dropdown renders via portal)
    const expandButton = document.body.querySelector('.pf-v6-c-tree-view__node-toggle') as HTMLButtonElement;
    await userEvent.click(expandButton);

    // Wait for child workspaces to appear and select API Services (dropdown renders via portal)
    const apiServicesButton = await within(document.body).findByText('API Services');
    await userEvent.click(apiServicesButton);

    // Should call onSelect with correct API Services workspace data
    await waitFor(async () => {
      await expect(args.onSelect).toHaveBeenCalledWith(
        expect.objectContaining({
          id: 'workspace-3',
          name: 'API Services',
          workspace: expect.objectContaining({
            id: 'workspace-3',
            name: 'API Services',
            parent_id: 'workspace-1',
            type: WorkspaceType.STANDARD,
          }),
        }),
      );
    });

    // Should update the toggle text to show new selection
    menuToggle = canvasElement.querySelector('.pf-v6-c-menu-toggle');
    await expect(menuToggle).toHaveTextContent('API Services');
  },
};

export const SearchIntegration: Story = {
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story: 'Tests workspace filtering and search functionality.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for loading to complete
    await expect(canvas.findByText('Select workspaces')).resolves.toBeInTheDocument();

    // Click to expand
    const toggle = await canvas.findByText('Select workspaces');
    await userEvent.click(toggle);

    // Wait for search input to appear (dropdown renders via portal)
    const searchInput = await within(document.body).findByPlaceholderText('Find a workspace by name');

    // Type in search
    await userEvent.type(searchInput, 'API');

    // Should show filtered results - API Services matches, parent should be visible for context
    await expect(within(document.body).findByText('Production Environment')).resolves.toBeInTheDocument();
    await expect(within(document.body).findByText('API Services')).resolves.toBeInTheDocument();

    // Other child nodes should NOT be visible since they don't match "API"
    await waitFor(
      async () => {
        await expect(within(document.body).queryByText('Web Services')).not.toBeInTheDocument();
        await expect(within(document.body).queryByText('Development Environment')).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  },
};

export const EmptyWorkspaces: Story = {
  args: defaultArgs,
  parameters: {
    msw: {
      handlers: [emptyWorkspacesHandler],
    },
    docs: {
      description: {
        story: 'Tests the empty state when no workspaces are available.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for loading to complete
    await expect(canvas.findByText('Select workspaces')).resolves.toBeInTheDocument();

    // Click to expand
    const toggle = await canvas.findByText('Select workspaces');
    await userEvent.click(toggle);

    // Should show empty state message (dropdown renders via portal)
    await expect(within(document.body).findByText('No workspaces to show.')).resolves.toBeInTheDocument();
  },
};

export const DuplicateWorkspaceNames: Story = {
  args: defaultArgs,
  parameters: {
    msw: {
      handlers: [duplicateWorkspacesHandler],
    },
    docs: {
      description: {
        story: 'Tests handling of workspaces with identical names and descriptions.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for loading to complete
    await expect(canvas.findByText('Select workspaces')).resolves.toBeInTheDocument();

    // Click to expand
    const toggle = await canvas.findByText('Select workspaces');
    await userEvent.click(toggle);

    // Should show the root workspace (dropdown renders via portal)
    await expect(within(document.body).findByText('Root Workspace')).resolves.toBeInTheDocument();

    // Expand the root workspace to see duplicate children
    const expandButton = document.body.querySelector('.pf-v6-c-tree-view__node-toggle') as HTMLButtonElement;
    await userEvent.click(expandButton);

    // Should show both duplicate workspaces
    const duplicateWorkspaces = await within(document.body).findAllByText('Duplicate Workspace');
    await expect(duplicateWorkspaces).toHaveLength(2);

    // Both should be visible and distinct elements
    duplicateWorkspaces.forEach(async (element) => {
      await expect(element).toBeInTheDocument();
    });
  },
};

// Explicit error scenario stories (replacing dynamic generation)
export const ApiError: Story = {
  args: defaultArgs,
  parameters: {
    msw: {
      handlers: [errorWorkspacesHandler],
    },
    docs: {
      description: {
        story: 'Tests general API error handling (default error scenario).',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for loading to complete with error
    await expect(canvas.findByText('Select workspaces')).resolves.toBeInTheDocument();

    // Click to expand
    const toggle = await canvas.findByText('Select workspaces');
    await userEvent.click(toggle);

    // Should show error state
    await expect(within(document.body).findByText('Failed to load workspaces')).resolves.toBeInTheDocument();
  },
};

// Explicit error scenario stories
export const ApiError400: Story = {
  args: defaultArgs,
  parameters: {
    msw: {
      handlers: [createErrorHandler(400, 'Bad Request')],
    },
    docs: {
      description: {
        story: 'Tests error handling for HTTP 400 Bad Request responses.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for loading to complete with error
    await expect(canvas.findByText('Select workspaces')).resolves.toBeInTheDocument();

    // Click to expand
    const toggle = await canvas.findByText('Select workspaces');
    await userEvent.click(toggle);

    // Should show error state
    await expect(within(document.body).findByText('Failed to load workspaces')).resolves.toBeInTheDocument();
  },
};

export const ApiError401: Story = {
  args: defaultArgs,
  parameters: {
    msw: {
      handlers: [createErrorHandler(401, 'Unauthorized')],
    },
    docs: {
      description: {
        story: 'Tests error handling for HTTP 401 Unauthorized responses.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for loading to complete with error
    await expect(canvas.findByText('Select workspaces')).resolves.toBeInTheDocument();

    // Click to expand
    const toggle = await canvas.findByText('Select workspaces');
    await userEvent.click(toggle);

    // Should show error state
    await expect(within(document.body).findByText('Failed to load workspaces')).resolves.toBeInTheDocument();
  },
};

export const ApiError403: Story = {
  args: defaultArgs,
  parameters: {
    msw: {
      handlers: [createErrorHandler(403, 'Forbidden')],
    },
    docs: {
      description: {
        story: 'Tests error handling for HTTP 403 Forbidden responses.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for loading to complete with error
    await expect(canvas.findByText('Select workspaces')).resolves.toBeInTheDocument();

    // Click to expand
    const toggle = await canvas.findByText('Select workspaces');
    await userEvent.click(toggle);

    // Should show error state
    await expect(within(document.body).findByText('Failed to load workspaces')).resolves.toBeInTheDocument();
  },
};

export const ApiError500: Story = {
  args: defaultArgs,
  parameters: {
    msw: {
      handlers: [createErrorHandler(500, 'Internal Server Error')],
    },
    docs: {
      description: {
        story: 'Tests error handling for HTTP 500 Internal Server Error responses.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for loading to complete with error
    await expect(canvas.findByText('Select workspaces')).resolves.toBeInTheDocument();

    // Click to expand
    const toggle = await canvas.findByText('Select workspaces');
    await userEvent.click(toggle);

    // Should show error state
    await expect(within(document.body).findByText('Failed to load workspaces')).resolves.toBeInTheDocument();
  },
};
