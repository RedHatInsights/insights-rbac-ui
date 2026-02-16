/**
 * WorkspaceSelector - Federated Module Stories
 *
 * These stories document the WorkspaceSelector federated module as consumed by
 * external teams. This is the primary documentation offered to peers.
 *
 * The module is fully self-contained: it bundles IntlProvider, AccessCheck.Provider,
 * ServiceProvider, and QueryClientProvider so consumers only need AsyncComponent.
 */

import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { delay } from 'msw';
import WorkspaceSelector, { type WorkspaceSelectorProps } from './WorkspaceSelector';
import { workspaceHandlers } from '../test/msw-handlers';

// Mock workspace IDs from the default MSW fixtures
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

const meta: Meta<WorkspaceSelectorProps> = {
  title: 'Federated Modules/WorkspaceSelector',
  component: WorkspaceSelector,
  tags: ['autodocs'],
  parameters: {
    noWrapping: true,
    msw: {
      handlers: workspaceHandlers,
    },
    // Full permissions for the default story set
    workspacePermissions: {
      view: ALL_WORKSPACE_IDS,
      edit: ALL_WORKSPACE_IDS,
      delete: ALL_WORKSPACE_IDS,
      create: ALL_WORKSPACE_IDS,
      move: ALL_WORKSPACE_IDS,
      rename: ALL_WORKSPACE_IDS,
    },
    docs: {
      description: {
        component: `
## WorkspaceSelector – Federated Module

A self-contained workspace selector designed for **module federation**. External consumers
can render it via \`AsyncComponent\` without providing any React context – all necessary
providers are bundled internally.

### External Consumer Usage

\`\`\`tsx
import { AsyncComponent } from '@redhat-cloud-services/frontend-components';

// Basic – all workspaces selectable
<AsyncComponent
  scope="rbac"
  module="./modules/WorkspaceSelector"
  onSelect={(ws) => console.log('Selected:', ws)}
  fallback={<Skeleton />}
/>

// With permission filtering – only "create"-permitted workspaces are selectable
<AsyncComponent
  scope="rbac"
  module="./modules/WorkspaceSelector"
  onSelect={(ws) => console.log('Selected:', ws)}
  requiredPermission="create"
  fallback={<Skeleton />}
/>
\`\`\`

### Bundled Providers

| Provider | Purpose |
|----------|---------|
| **IntlProvider** | Internationalization (react-intl) |
| **AccessCheck.Provider** | Kessel permission resolution (6 workspace relations) |
| **ServiceProvider** | Axios instance for RBAC API |
| **QueryClientProvider** | React Query data fetching & caching |

### Props (ManagedWorkspaceSelectorProps)

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| \`onSelect\` | \`(workspace) => void\` | – | Callback when a workspace is selected |
| \`initialSelectedWorkspace\` | \`TreeViewWorkspaceItem\` | – | Pre-selected workspace on mount |
| \`sourceWorkspace\` | \`TreeViewWorkspaceItem\` | – | Workspace to exclude from tree |
| \`requiredPermission\` | \`WorkspaceRelation\` | – | Limits selectable workspaces to those with this permission |

### Kessel Workspace Permissions

The selector resolves **6 Kessel relations** per workspace and makes them available
through the enriched \`WorkspaceWithPermissions\` type:

| Relation | Description |
|----------|-------------|
| \`view\` | Can view workspace details |
| \`edit\` | Can edit workspace metadata |
| \`delete\` | Can delete the workspace |
| \`create\` | Can create child workspaces |
| \`move\` | Can move workspace to another parent |
| \`rename\` | Can rename the workspace |

When \`requiredPermission\` is set, workspaces lacking that permission appear **dimmed**
and are **not selectable**, preserving the full hierarchy for context.

### Component Stories

For low-level component tests, see **Features/Workspaces/Components/Managed Selector/ManagedWorkspaceSelector**.
        `,
      },
    },
  },
  argTypes: {
    onSelect: {
      description: 'Callback fired when a workspace is selected from the tree',
      action: 'workspace-selected',
    },
    requiredPermission: {
      description: 'Only workspaces with this Kessel relation are selectable. Others are shown dimmed.',
      control: { type: 'select' },
      options: [undefined, 'view', 'edit', 'delete', 'create', 'move', 'rename'],
      table: {
        type: { summary: 'WorkspaceRelation' },
        defaultValue: { summary: 'undefined' },
      },
    },
    initialSelectedWorkspace: {
      description: 'Pre-selected workspace item to display on mount',
      control: { type: 'object' },
    },
    sourceWorkspace: {
      description: 'Workspace to exclude from the tree (used in move-workspace flows)',
      control: { type: 'object' },
    },
  },
};

export default meta;
type Story = StoryObj<WorkspaceSelectorProps>;

// ============================================================================
// Default / Smoke Test
// ============================================================================

/** Full-permission smoke test – all workspaces selectable */
export const Default: Story = {
  args: {
    onSelect: fn(),
  },
  parameters: {
    docs: {
      description: {
        story: `Smoke test that validates the federated module renders with all providers.

All workspaces have full permissions, so every item in the tree is selectable.
This is the base scenario for consumers that don't use \`requiredPermission\`.`,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    await delay(300);
    await openSelector(canvasElement);

    // Select root workspace – should fire onSelect callback
    await clickAndExpectSelect('Production Environment', args.onSelect as ReturnType<typeof fn>, 'workspace-1', 'Production Environment');
  },
};

// ============================================================================
// Permission Filtering Stories
// ============================================================================

/** Only workspaces with `create` permission are selectable */
export const FilterByCreatePermission: Story = {
  args: {
    onSelect: fn(),
    requiredPermission: 'create',
  },
  parameters: {
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
        story: `Demonstrates \`requiredPermission="create"\` – the primary use case for
"choose where to create a new workspace" flows.

Only **Production Environment** (root) has the \`create\` permission.
Child workspaces are visible but **dimmed and non-selectable**, preserving the hierarchy.

\`\`\`tsx
<AsyncComponent
  scope="rbac"
  module="./modules/WorkspaceSelector"
  onSelect={handleParentWorkspaceSelected}
  requiredPermission="create"
/>
\`\`\``,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    await delay(300);
    await openSelector(canvasElement);
    await expandRootNode();

    // Children should be disabled
    await expectDisabled('Web Services');

    // Click disabled child – onSelect should NOT fire
    await clickAndExpectNoSelect('Web Services', args.onSelect as ReturnType<typeof fn>);

    // Click root workspace – onSelect SHOULD fire
    await clickAndExpectSelect('Production Environment', args.onSelect as ReturnType<typeof fn>, 'workspace-1', 'Production Environment');
  },
};

/** Only workspaces with `edit` permission are selectable */
export const FilterByEditPermission: Story = {
  args: {
    onSelect: fn(),
    requiredPermission: 'edit',
  },
  parameters: {
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
        story: `Demonstrates \`requiredPermission="edit"\` – useful for "choose a workspace to edit" flows.

**Production Environment** and **Web Services** have edit permissions.
**API Services** and **Development Environment** are disabled.

\`\`\`tsx
<AsyncComponent
  scope="rbac"
  module="./modules/WorkspaceSelector"
  onSelect={handleWorkspaceToEdit}
  requiredPermission="edit"
/>
\`\`\``,
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

/** Only workspaces with `move` permission are selectable */
export const FilterByMovePermission: Story = {
  args: {
    onSelect: fn(),
    requiredPermission: 'move',
  },
  parameters: {
    workspacePermissions: {
      view: ALL_WORKSPACE_IDS,
      edit: ALL_WORKSPACE_IDS,
      delete: [],
      create: [],
      move: ['workspace-2', 'workspace-3'],
      rename: [],
    },
    docs: {
      description: {
        story: `Demonstrates \`requiredPermission="move"\` – for "choose a destination workspace" in move flows.

Only **Web Services** and **API Services** have the \`move\` permission.
The root workspace and Development Environment are disabled.

\`\`\`tsx
<AsyncComponent
  scope="rbac"
  module="./modules/WorkspaceSelector"
  onSelect={handleMoveDestination}
  requiredPermission="move"
  sourceWorkspace={workspaceBeingMoved}
/>
\`\`\``,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    await delay(300);
    await openSelector(canvasElement);

    // Root is disabled for move
    await expectDisabled('Production Environment');
    await clickAndExpectNoSelect('Production Environment', args.onSelect as ReturnType<typeof fn>);

    // Expand
    await expandRootNode();

    // Web Services (has move) – should be selectable
    await clickAndExpectSelect('Web Services', args.onSelect as ReturnType<typeof fn>, 'workspace-2', 'Web Services');
  },
};

/** All workspaces denied – nothing is selectable */
export const AllPermissionsDenied: Story = {
  args: {
    onSelect: fn(),
    requiredPermission: 'delete',
  },
  parameters: {
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
        story: `Edge case: **no workspaces** have the required permission (\`delete\`).

Every workspace in the tree is dimmed and non-selectable. The tree is still rendered
to provide context, but the consumer should typically handle this gracefully
(e.g., display a warning message that the user lacks permissions).`,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    await delay(300);
    await openSelector(canvasElement);

    // Root should be disabled
    await expectDisabled('Production Environment');
    await clickAndExpectNoSelect('Production Environment', args.onSelect as ReturnType<typeof fn>);
  },
};

// ============================================================================
// Search + Permissions Combined
// ============================================================================

/** Search and permission filtering work together */
export const SearchWithPermissions: Story = {
  args: {
    onSelect: fn(),
    requiredPermission: 'edit',
  },
  parameters: {
    workspacePermissions: {
      view: ALL_WORKSPACE_IDS,
      edit: ['workspace-1', 'workspace-3'],
      delete: [],
      create: [],
      move: [],
      rename: [],
    },
    docs: {
      description: {
        story: `Demonstrates how search filtering and permission-based disabling compose together.

With \`requiredPermission="edit"\`, only **Production Environment** and **API Services**
have the \`edit\` permission. When the user searches, the tree is filtered by name
**and** non-permitted results remain disabled.`,
      },
    },
  },
  play: async ({ canvasElement, args }) => {
    await delay(300);
    await openSelector(canvasElement);

    // Search for "Services" – should match Web Services and API Services
    const searchInput = await getBody().findByPlaceholderText('Find a workspace by name');
    await userEvent.type(searchInput, 'Services');

    // API Services (has edit) – should be selectable
    await clickAndExpectSelect('API Services', args.onSelect as ReturnType<typeof fn>, 'workspace-3', 'API Services');
    (args.onSelect as ReturnType<typeof fn>).mockClear();

    // Web Services (no edit) – should be disabled
    await clickAndExpectNoSelect('Web Services', args.onSelect as ReturnType<typeof fn>);
  },
};
