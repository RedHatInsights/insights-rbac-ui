import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { ManagedWorkspaceSelector } from './ManagedWorkspaceSelector';
import { WorkspacesWorkspaceTypes } from '@redhat-cloud-services/rbac-client/v2/types';
import { emptyWorkspacesHandler, errorWorkspacesHandler, slowWorkspaceHandlers, workspaceHandlers } from '../../../../test/msw-handlers';
import { HttpResponse, delay, http } from 'msw';

// Mock workspace IDs used by workspaceHandlers
const ALL_WORKSPACE_IDS = ['workspace-1', 'workspace-2', 'workspace-3', 'workspace-4'];

// ============================================================================
// Shared test helpers
// ============================================================================

const SELECTOR_LABEL = 'Select workspaces';
const getBody = () => within(document.body);

/** Wait for selector to render, then open the dropdown. Returns the canvas query helper. */
async function openSelector(canvasElement: HTMLElement) {
  const canvas = within(canvasElement);
  await expect(canvas.findByText(SELECTOR_LABEL, {}, { timeout: 5000 })).resolves.toBeInTheDocument();
  const toggle = await canvas.findByText(SELECTOR_LABEL);
  await userEvent.click(toggle);
  return canvas;
}

/** Expand the root tree node (clicks the first toggle button in the portal). */
async function expandRootNode() {
  const expandButton = document.body.querySelector('.pf-v6-c-tree-view__node-toggle') as HTMLButtonElement | null;
  if (expandButton) {
    await userEvent.click(expandButton);
  }
}

/** Find a workspace node by name in the dropdown portal. */
function findWorkspace(name: string) {
  return getBody().findByText(name);
}

/** Assert a workspace node is visually disabled (wrapped in a styled span). */
async function expectDisabled(name: string) {
  const node = await findWorkspace(name);
  const span = node.closest('span[style]');
  await expect(span).not.toBeNull();
}

/** Click a workspace and assert onSelect is NOT called. */
async function clickAndExpectNoSelect(name: string, onSelect: ReturnType<typeof fn>) {
  const node = await findWorkspace(name);
  await userEvent.click(node);
  await expect(onSelect).not.toHaveBeenCalled();
}

/** Click a workspace and assert onSelect IS called with matching id/name. */
async function clickAndExpectSelect(name: string, onSelect: ReturnType<typeof fn>, expectedId: string, expectedName: string) {
  const node = await findWorkspace(name);
  await userEvent.click(node);
  await waitFor(async () => {
    await expect(onSelect).toHaveBeenCalledWith(expect.objectContaining({ id: expectedId, name: expectedName }));
  });
}

// Mock data for duplicate workspaces scenario
const duplicateWorkspacesResponse = {
  data: [
    {
      id: 'F',
      type: WorkspacesWorkspaceTypes.Root,
      name: 'Root Workspace',
      description: 'This is a duplicate workspace',
      created: '2023-01-11T00:00:00Z',
      updated: '2023-01-12T00:00:00Z',
    },
    {
      id: 'G',
      parent_id: 'F',
      type: WorkspacesWorkspaceTypes.Default,
      name: 'Duplicate Workspace',
      description: 'This is a duplicate workspace',
      created: '2023-01-13T00:00:00Z',
      updated: '2023-01-14T00:00:00Z',
    },
    {
      id: 'H',
      parent_id: 'F',
      type: WorkspacesWorkspaceTypes.Default,
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

const meta: Meta<typeof ManagedWorkspaceSelector> = {
  component: ManagedWorkspaceSelector,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Smart component that manages workspace selection with API integration, Kessel permission resolution, and search filtering.

## Features

- **Hierarchical tree view** – Workspaces are displayed in a collapsible tree reflecting their parent/child relationships.
- **Kessel permission integration** – Each workspace is enriched with 6 permission checks (view, edit, delete, create, move, rename) via \`useWorkspacesWithPermissions\`.
- **Permission-based filtering** – Set the \`requiredPermission\` prop to disable workspaces where the user lacks that permission. Non-permitted workspaces are visually dimmed and non-selectable, preserving hierarchy.
- **Self-contained federated module** – When used via \`WorkspaceSelector\` federated module, all providers (IntlProvider, AccessCheck.Provider, ServiceProvider, QueryClientProvider) are included automatically.

## Props

| Prop | Type | Description |
|------|------|-------------|
| \`onSelect\` | \`(workspace) => void\` | Callback when a workspace is selected |
| \`initialSelectedWorkspace\` | \`TreeViewWorkspaceItem\` | Pre-selected workspace on mount |
| \`sourceWorkspace\` | \`TreeViewWorkspaceItem\` | Workspace to exclude from the tree (e.g., for move operations) |
| \`requiredPermission\` | \`WorkspaceRelation\` | When set, only workspaces with this permission are selectable |

## Test Coverage
- Tree expansion and collapse interactions
- Search/filter functionality
- Error handling for various HTTP status codes
- Empty state handling
- Duplicate workspace name scenarios
- Selection callbacks and state management
- **Permission-based disabling** – workspaces without the required permission are shown but disabled
- **All selectable** – default behavior with no permission requirement

## Kessel Workspace Relations

The following relations are resolved per workspace:

| Relation | Description |
|----------|-------------|
| \`view\` | Can view workspace details |
| \`edit\` | Can edit workspace metadata |
| \`delete\` | Can delete the workspace |
| \`create\` | Can create child workspaces |
| \`move\` | Can move workspace to another parent |
| \`rename\` | Can rename the workspace |

## Usage Examples

\`\`\`tsx
// Basic usage – all workspaces selectable
<ManagedWorkspaceSelector onSelect={handleSelect} />

// Only show selectable workspaces the user can create in
<ManagedWorkspaceSelector
  onSelect={handleSelect}
  requiredPermission="create"
/>

// Only allow editing targets
<ManagedWorkspaceSelector
  onSelect={handleSelect}
  requiredPermission="edit"
/>
\`\`\`
        `,
      },
    },
    msw: {
      handlers: workspaceHandlers,
    },
    // Default: full permissions on all workspaces
    workspacePermissions: {
      view: ALL_WORKSPACE_IDS,
      edit: ALL_WORKSPACE_IDS,
      delete: ALL_WORKSPACE_IDS,
      create: ALL_WORKSPACE_IDS,
      move: ALL_WORKSPACE_IDS,
      rename: ALL_WORKSPACE_IDS,
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
    requiredPermission: {
      description: 'When set, only workspaces with this permission are selectable',
      control: { type: 'select' },
      options: [undefined, 'view', 'edit', 'delete', 'create', 'move', 'rename'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ManagedWorkspaceSelector>;

// Default args
const defaultArgs = {
  onSelect: fn(),
  initialSelectedWorkspace: undefined,
};

// ============================================================================
// Core Behavior Stories
// ============================================================================

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
        type: WorkspacesWorkspaceTypes.Root,
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
            type: WorkspacesWorkspaceTypes.Root,
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
            type: WorkspacesWorkspaceTypes.Standard,
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
    workspacePermissions: {
      view: ['F', 'G', 'H'],
      edit: ['F', 'G', 'H'],
      delete: ['F', 'G', 'H'],
      create: ['F', 'G', 'H'],
      move: ['F', 'G', 'H'],
      rename: ['F', 'G', 'H'],
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

// ============================================================================
// Permission-Based Behavior Stories
// ============================================================================

export const RequiredPermissionCreate: Story = {
  args: {
    ...defaultArgs,
    requiredPermission: 'create',
  },
  parameters: {
    // Only workspace-1 (root) has create permission; children do not
    workspacePermissions: {
      view: ALL_WORKSPACE_IDS,
      edit: ALL_WORKSPACE_IDS,
      delete: [],
      create: ['workspace-1'],
      move: [],
      rename: [],
    },
    docs: {
      description: {
        story: `Tests the \`requiredPermission="create"\` prop.

Only **Production Environment** (workspace-1) has the \`create\` permission.
The child workspaces (Web Services, API Services, Development Environment) are still visible in the tree to preserve hierarchy, but they appear **dimmed** and are **not selectable**.

This is the common use case for "choose where to create a new workspace" flows.`,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    await delay(300);
    await openSelector(canvasElement);
    await expandRootNode();

    // Children should be visible but disabled
    await expectDisabled('Web Services');

    // Click disabled child – should NOT trigger onSelect
    await clickAndExpectNoSelect('Web Services', args.onSelect as ReturnType<typeof fn>);

    // Click root (has create permission) – SHOULD trigger onSelect
    await clickAndExpectSelect('Production Environment', args.onSelect as ReturnType<typeof fn>, 'workspace-1', 'Production Environment');
  },
};

export const RequiredPermissionEdit: Story = {
  args: {
    ...defaultArgs,
    requiredPermission: 'edit',
  },
  parameters: {
    // Only workspace-1 and workspace-2 have edit permission
    workspacePermissions: {
      view: ALL_WORKSPACE_IDS,
      edit: ['workspace-1', 'workspace-2'],
      delete: [],
      create: [],
      move: [],
      rename: [],
    },
    docs: {
      description: {
        story: `Tests the \`requiredPermission="edit"\` prop.

**Production Environment** and **Web Services** have edit permissions.
**API Services** and **Development Environment** are disabled (dimmed, not selectable).

This scenario is useful for "choose a workspace to edit" flows.`,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    await delay(300);
    await openSelector(canvasElement);
    await expandRootNode();

    // Web Services (has edit) – should be selectable
    await clickAndExpectSelect('Web Services', args.onSelect as ReturnType<typeof fn>, 'workspace-2', 'Web Services');
    (args.onSelect as ReturnType<typeof fn>).mockClear();

    // API Services (no edit) – should NOT be selectable
    await clickAndExpectNoSelect('API Services', args.onSelect as ReturnType<typeof fn>);
  },
};

export const AllPermissionsDenied: Story = {
  args: {
    ...defaultArgs,
    requiredPermission: 'edit',
  },
  parameters: {
    // No workspaces have edit permission – all should be disabled
    workspacePermissions: {
      view: ALL_WORKSPACE_IDS,
      edit: [],
      delete: [],
      create: [],
      move: [],
      rename: [],
    },
    docs: {
      description: {
        story: `Tests the scenario where **no workspaces** have the required permission.

All workspaces are displayed in the tree (preserving hierarchy) but every one is disabled.
Clicking any workspace does **not** trigger \`onSelect\`.

This can happen for users with read-only access trying to select a workspace for an edit operation.`,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    await delay(300);
    await openSelector(canvasElement);

    // Root should be visible but disabled
    await expectDisabled('Production Environment');
    await clickAndExpectNoSelect('Production Environment', args.onSelect as ReturnType<typeof fn>);

    // Expand and verify children are also disabled
    await expandRootNode();
    await clickAndExpectNoSelect('Web Services', args.onSelect as ReturnType<typeof fn>);
  },
};

export const NoRequiredPermission: Story = {
  args: defaultArgs,
  parameters: {
    docs: {
      description: {
        story: `Tests default behavior when **no** \`requiredPermission\` is set.

All workspaces are selectable regardless of their individual permission levels.
This is the standard mode for read-only selection (e.g., "view workspace details").`,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    await delay(300);
    await openSelector(canvasElement);

    // Root should be selectable
    await clickAndExpectSelect('Production Environment', args.onSelect as ReturnType<typeof fn>, 'workspace-1', 'Production Environment');
    (args.onSelect as ReturnType<typeof fn>).mockClear();

    // Expand and verify children are also selectable
    await expandRootNode();
    await clickAndExpectSelect('Web Services', args.onSelect as ReturnType<typeof fn>, 'workspace-2', 'Web Services');
  },
};

// ============================================================================
// Error Handling Stories
// ============================================================================

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
