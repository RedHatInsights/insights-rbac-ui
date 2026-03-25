import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { WorkspaceList } from './WorkspaceList';

// Import shared test functions and mock data from helper file
import { getSkeletonCount, queryByOuiaId } from '../../../test-utils/interactionHelpers';
import { mockWorkspaces, testDefaultWorkspaceDisplay, testEmptyState, testLoadingState } from './workspaceTestHelpers';
import { BrowserRouter } from 'react-router-dom';
import { workspacesErrorHandlers, workspacesHandlers, workspacesLoadingHandlers } from '../../data/mocks/workspaces.handlers';
import type { WorkspacesWorkspace } from '../../data/mocks/db';

// Convert workspaceTestHelpers format to WorkspacesWorkspace format for handlers
const workspaceDataForHandlers: WorkspacesWorkspace[] = mockWorkspaces.map((ws) => ({
  id: ws.id,
  name: ws.name,
  description: ws.description ?? '',
  parent_id: ws.parent_id || undefined,
  type: ws.type === 'root' ? ('root' as const) : ('standard' as const),
  created: ws.created,
  modified: ws.modified || ws.created,
}));

// Minimal decorator - only provide Router
const withRouter = (Story: StoryFn) => {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '600px' }}>
        <Story />
      </div>
    </BrowserRouter>
  );
};

const meta: Meta<typeof WorkspaceList> = {
  component: WorkspaceList,
  tags: ['ff:platform.rbac.workspaces', 'env:prod', 'perm:org-admin'],
  decorators: [withRouter],
  parameters: {
    // Workspace routes require inventory:groups:* permissions
    permissions: ['inventory:groups:read', 'inventory:groups:write'],
    orgAdmin: true,
    // Workspace IDs from mockWorkspaces that user can edit/create/delete/move in
    workspacePermissions: {
      view: ['root-1', '1', '2'],
      edit: ['root-1', '1', '2'],
      delete: ['1', '2'],
      create: ['root-1', '1', '2'],
      move: ['1', '2'],
    },
    chrome: {
      environment: 'prod',
    },
    featureFlags: {
      'platform.rbac.workspaces': true,
    },
    docs: {
      description: {
        component: `
**WorkspaceList** is a feature container component that provides the main interface for viewing and managing workspaces.

This component demonstrates:
- **Container Pattern**: Simple orchestration of header and data components
- **Content Layout**: Uses PatternFly ContentHeader for consistent page layout
- **Component Integration**: Composes WorkspaceListTable for data display
- **Internationalization**: All text content uses react-intl for localization
- **External Links**: Includes learn more link for user guidance

### Key Features
- **Page Header**: Shows workspaces title, subtitle, and learn more link
- **Table Integration**: Embeds WorkspaceListTable for workspace data management
- **Responsive Layout**: Uses PatternFly PageSection for proper spacing
- **Accessibility**: Proper heading structure and semantic markup

The table functionality is tested separately in WorkspaceListTable stories.

### Design References

<img src="/mocks/workspaces/Workspace list.png" alt="Workspace list page" width="400" />
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Complete workspace list container with React Query integration. Orchestrates data fetching, page layout, header composition, and fully functional workspace table.

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[Loading](?path=/story/features-workspaces-workspacelist--loading)**: Tests container behavior during API loading via React Query
- **[Empty](?path=/story/features-workspaces-workspacelist--empty)**: Tests container response to empty workspace data
- **[Error](?path=/story/features-workspaces-workspacelist--error)**: Tests container error state management
- **[PermissionIntegration](?path=/story/features-workspaces-workspacelist--permission-integration)**: Tests container permission handling and access control
- **[MoveWorkspaceModal](?path=/story/features-workspaces-workspacelist--move-workspace-modal)**: Tests move workspace modal workflow
        `,
      },
    },
    msw: {
      handlers: [...workspacesHandlers(workspaceDataForHandlers)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify initial render', async () => {
      await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();
      await expect(canvas.findByText(mockWorkspaces[0].name)).resolves.toBeInTheDocument();
      await testDefaultWorkspaceDisplay(canvasElement);
    });
  },
};

// Container stories that reuse table story data and test React Query integration

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story: 'Tests container loading states. The component should show skeleton loading indicators while data is being fetched.',
      },
    },
    msw: {
      handlers: [...workspacesLoadingHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify loading state', async () => {
      await testLoadingState(canvasElement);
    });
  },
};

export const Empty: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests container handling of empty workspace data. When no workspaces are available, the container should coordinate with the table to display appropriate empty state messaging.',
      },
    },
    msw: {
      handlers: [...workspacesHandlers([])],
    },
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify empty state', async () => {
      await testEmptyState(canvasElement);
    });
  },
};

export const Error: Story = {
  parameters: {
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
    docs: {
      description: {
        story:
          'Tests container error handling when API requests fail. The container should manage error state and coordinate error display with the table component.',
      },
    },
    msw: {
      handlers: [...workspacesErrorHandlers(500)],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // For error states, we might still have skeletons or they might not disappear
    // Focus on finding the actual error state instead
    // Wait for loading to complete first, then check for error state
    await waitFor(
      () => {
        // First check that we're not in loading state anymore
        expect(getSkeletonCount(canvasElement)).toBe(0);
      },
      { timeout: 5000 },
    );

    // Now wait for the error state to appear
    const errorTitle = await canvas.findByText(/failed to load workspaces/i);
    await expect(errorTitle).toBeInTheDocument();
  },
};

export const PermissionIntegration: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests container permission integration with Kessel access checks. Users with read-only permissions should see disabled create/edit actions. Validates container fetches and filters permissions correctly.',
      },
    },
    // Mock Kessel permissions - read-only user (cannot edit or create workspaces)
    workspacePermissions: { view: ['root-1', '1', '2'], edit: [], delete: [], create: [], move: [] },
    chrome: {
      environment: 'prod',
    },
    msw: {
      handlers: [...workspacesHandlers(workspaceDataForHandlers)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify page and workspace list', async () => {
      await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();
      await expect(canvas.findByText(mockWorkspaces[1].name)).resolves.toBeInTheDocument();
      await expect(canvas.getByText('Workspaces')).toBeInTheDocument();
      await expect(canvas.getByText(mockWorkspaces[0].name)).toBeInTheDocument();
      await expect(canvas.getByText(mockWorkspaces[1].name)).toBeInTheDocument();
      await expect(canvas.getByText(mockWorkspaces[2].name)).toBeInTheDocument();
    });
    await step('Verify read-only buttons are disabled', async () => {
      const createButton = canvas.getByRole('button', { name: /create workspace/i });
      expect(createButton).toBeInTheDocument();
      expect(createButton).toBeDisabled(); // Read-only users cannot create
    });
    await step('Verify kebab menu structure', async () => {
      const kebabButtons = canvas.getAllByLabelText('Kebab toggle');
      expect(kebabButtons.length).toBeGreaterThan(0);
      await userEvent.click(kebabButtons[0]);
      await expect(within(document.body).getByText('Edit workspace')).toBeInTheDocument();
      await expect(within(document.body).getByText('Delete workspace')).toBeInTheDocument();
      await expect(within(document.body).getByText('Move workspace')).toBeInTheDocument();
    });
  },
};

// Create spy for move workspace API calls
const moveWorkspaceSpy = fn();

export const MoveWorkspaceModal: Story = {
  tags: ['env:stage', 'perm:org-admin'],
  parameters: {
    docs: {
      description: {
        story:
          'Tests the complete move workspace flow through the container. Users can open the move modal from table actions, select a destination workspace, and submit the move request. Validates that container properly handles modal state, calls the correct moveWorkspace API with proper parameters, and refreshes data after successful operation.',
      },
    },
    chrome: {
      environment: 'stage', // Change to stage to enable move functionality
    },
    msw: {
      handlers: [
        ...workspacesHandlers(workspaceDataForHandlers, {
          onMove: (workspaceId, parentId) => moveWorkspaceSpy(workspaceId, { parent_id: parentId }),
        }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    moveWorkspaceSpy.mockClear();

    await step('Open move modal from kebab menu', async () => {
      await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();
      await expect(canvas.findByText(mockWorkspaces[1].name)).resolves.toBeInTheDocument();

      const productionRow = queryByOuiaId(canvasElement, `workspaces-list-tr-${mockWorkspaces[1].id}`);
      await expect(productionRow).toBeTruthy();

      const productionRowScope = within(productionRow!);
      const actionsButton = productionRowScope.getByLabelText('Kebab toggle');
      await user.click(actionsButton);

      await expect(within(document.body).findByText('Move workspace')).resolves.toBeInTheDocument();

      const moveAction = await within(document.body).findByText('Move workspace');
      await user.click(moveAction);
    });

    await step('Select destination and submit', async () => {
      const modalCanvas = within(document.body);
      await expect(
        await modalCanvas.findByText((content) => {
          return content.includes('Move') && content.includes(mockWorkspaces[1].name);
        }),
      ).toBeInTheDocument();
      await expect(modalCanvas.getByText('Parent workspace')).toBeInTheDocument();

      const buttons = await modalCanvas.findAllByRole('button');
      const menuToggleButton = buttons.find((button) => {
        const menuToggleText = button.querySelector('.pf-v6-c-menu-toggle__text');
        return menuToggleText?.textContent === mockWorkspaces[0].name;
      });
      await expect(menuToggleButton).toBeTruthy();
      const selectButton = menuToggleButton as HTMLElement;
      await expect(selectButton).not.toBeDisabled();

      await user.click(selectButton!);

      await expect(modalCanvas.findByRole('tree')).resolves.toBeInTheDocument();

      const treeViewElement = await modalCanvas.findByRole('tree');
      const expandButton = treeViewElement.querySelector('.pf-v6-c-tree-view__node-toggle') as HTMLElement;
      await user.click(expandButton);

      const treeViewScope = within(treeViewElement);
      await expect(treeViewScope.findByText(mockWorkspaces[2].name)).resolves.toBeInTheDocument();

      const devWorkspaceButton = await treeViewScope.findByText(mockWorkspaces[2].name);
      await user.click(devWorkspaceButton);

      const submitButton = await modalCanvas.findByRole('button', { name: /submit/i });
      await expect(submitButton).toBeEnabled();

      await user.click(submitButton);
    });

    await step('Verify move API called and modal closed', async () => {
      const modalCanvas = within(document.body);
      await waitFor(async () => {
        await expect(moveWorkspaceSpy).toHaveBeenCalledWith(mockWorkspaces[1].id, {
          parent_id: mockWorkspaces[2].id,
        });
      });

      await waitFor(async () => {
        await expect(
          modalCanvas.queryByText((content) => {
            return content.includes('Move') && content.includes(mockWorkspaces[1].name);
          }),
        ).not.toBeInTheDocument();
      });
    });
  },
};

// ============================================================================
// MILESTONE FEATURE FLAG TESTING
// ============================================================================
// Comprehensive testing of each Kessel milestone with different permission levels

export const M1_WithWritePermission: Story = {
  name: 'M1: With Write Permission',
  parameters: {
    docs: {
      description: {
        story: `
**Kessel M1** with write permissions (\`inventory:groups:write\`).

**Feature Flags:** 
- \`platform.rbac.workspaces-list\` = true
- \`platform.rbac.workspace-hierarchy\` = false
- \`platform.rbac.workspaces-role-bindings\` = false
- \`platform.rbac.workspaces\` = false

**Expected Behavior:**
- ✅ "Create workspace" button: **enabled** (basic creation, parent auto-set to Default)
- ❌ Kebab actions (Edit/Move/Delete): **visible but disabled** (M2+ features)
- ❌ Workspace links: **plain text** (links appear in M2+)
        `,
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': false,
      'platform.rbac.workspaces-role-bindings': false,
      'platform.rbac.workspaces': false,
    },
    chrome: {
      environment: 'prod',
    },
    msw: {
      handlers: [...workspacesHandlers(workspaceDataForHandlers)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify M1 with write permission', async () => {
      await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();
      await expect(canvas.findByText(mockWorkspaces[1].name)).resolves.toBeInTheDocument();

      const createButton = await canvas.findByRole('button', { name: /create workspace/i });
      expect(createButton).toBeInTheDocument();
      await waitFor(() => expect(createButton).not.toBeDisabled(), { timeout: 5000 });
    });
  },
};

export const M1_ReadOnly: Story = {
  name: 'M1: Read Only',
  parameters: {
    docs: {
      description: {
        story: `
**Kessel M1** with read-only permissions.

**Feature Flags:** Same as M1 With Write

**Expected Behavior:**
- ❌ "Create workspace" button: **disabled** (no write permission)
- ❌ All kebab actions: **visible but disabled**
        `,
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': false,
      'platform.rbac.workspaces-role-bindings': false,
      'platform.rbac.workspaces': false,
    },
    // Mock Kessel permissions - read-only user (empty workspace IDs)
    workspacePermissions: { view: [], edit: [], delete: [], create: [], move: [] },
    chrome: {
      environment: 'prod',
    },
    msw: {
      handlers: [...workspacesHandlers(workspaceDataForHandlers)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify M1 read-only create button disabled', async () => {
      await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();
      const createButton = canvas.getByRole('button', { name: /create workspace/i });
      expect(createButton).toBeDisabled();
    });
  },
};

export const M2_WithWritePermission: Story = {
  name: 'M2: With Write Permission',
  parameters: {
    docs: {
      description: {
        story: `
**Kessel M2** with write permissions.

**Feature Flags:**
- \`platform.rbac.workspaces-list\` = true
- \`platform.rbac.workspace-hierarchy\` = **true** ✅
- \`platform.rbac.workspaces-role-bindings\` = false
- \`platform.rbac.workspaces\` = false

**Expected Behavior:**
- ✅ "Create workspace" button: **enabled** (with parent selection)
- ✅ Kebab "Edit workspace": **enabled**
- ✅ Kebab "Create workspace": **enabled**
- ✅ Kebab "Create subworkspace": **enabled**
- ✅ Kebab "Move workspace": **enabled**
- ✅ Kebab "Delete workspace": **enabled** (for leaf workspaces)
- ✅ Workspace links: **link to Inventory** (standard/ungrouped-hosts types)
        `,
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces-role-bindings': false,
      'platform.rbac.workspaces': false,
    },
    chrome: {
      environment: 'prod',
    },
    msw: {
      handlers: [...workspacesHandlers(workspaceDataForHandlers)],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();
    await expect(canvas.findByText(mockWorkspaces[1].name)).resolves.toBeInTheDocument();

    const createButton = await canvas.findByRole('button', { name: /create workspace/i });
    await waitFor(() => expect(createButton).not.toBeDisabled(), { timeout: 5000 });

    // Open kebab menu and verify M2 actions are enabled
    const kebabButtons = canvas.getAllByLabelText('Kebab toggle');
    await user.click(kebabButtons[0]);

    // Verify M2 CRUD actions exist in the kebab menu
    await within(document.body).findByText('Edit workspace');
    await within(document.body).findByText('Create subworkspace');
    await within(document.body).findByText('Move workspace');
    await within(document.body).findByText('Delete workspace');

    // Verify the kebab menu has its own "Create workspace" option
    const createWorkspaceMenuItem = await within(document.body).findByRole('menuitem', { name: /create workspace/i });
    expect(createWorkspaceMenuItem).toBeInTheDocument();
  },
};

export const M2_ReadOnly: Story = {
  name: 'M2: Read Only',
  parameters: {
    docs: {
      description: {
        story: `
**Kessel M2** with read-only permissions.

**Feature Flags:** Same as M2 With Write

**Expected Behavior:**
- ❌ "Create workspace" button: **disabled**
- ❌ All kebab CRUD actions: **visible but disabled**
        `,
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces-role-bindings': false,
      'platform.rbac.workspaces': false,
    },
    // Mock Kessel permissions - read-only user (empty workspace IDs)
    workspacePermissions: { view: [], edit: [], delete: [], create: [], move: [] },
    chrome: {
      environment: 'prod',
    },
    msw: {
      handlers: [...workspacesHandlers(workspaceDataForHandlers)],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();

    // Verify "Create workspace" button is DISABLED
    const createButton = canvas.getByRole('button', { name: /create workspace/i });
    expect(createButton).toBeDisabled();
  },
};

export const M3_WithWritePermission: Story = {
  name: 'M3: With Write Permission',
  parameters: {
    docs: {
      description: {
        story: `
**Kessel M3** with write permissions.

**Feature Flags:**
- \`platform.rbac.workspaces-list\` = true
- \`platform.rbac.workspace-hierarchy\` = true
- \`platform.rbac.workspaces-role-bindings\` = **true** ✅
- \`platform.rbac.workspaces\` = false

**Expected Behavior:**
- ✅ All M2 features: CRUD operations enabled
- ✅ Workspace links: **link to RBAC detail pages** (not Inventory)
- ✅ Detail page shows Roles tab (read-only role bindings)
        `,
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces-role-bindings': true,
      'platform.rbac.workspaces': false,
    },
    chrome: {
      environment: 'prod',
    },
    msw: {
      handlers: [...workspacesHandlers(workspaceDataForHandlers)],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();
    await expect(canvas.findByText(mockWorkspaces[1].name)).resolves.toBeInTheDocument();

    // Verify all buttons enabled (wait for permission checks to complete)
    const createButton = await canvas.findByRole('button', { name: /create workspace/i });
    await waitFor(() => expect(createButton).not.toBeDisabled(), { timeout: 5000 });

    // Note: Workspace links to RBAC detail pages would be tested in E2E
    // as Storybook doesn't have full routing setup
  },
};

export const M3_ReadOnly: Story = {
  name: 'M3: Read Only',
  parameters: {
    docs: {
      description: {
        story: `
**Kessel M3** with read-only permissions.

**Feature Flags:** Same as M3 With Write

**Expected Behavior:**
- ❌ "Create workspace" button: **disabled**
- ✅ Workspace links: **work** (users can view detail pages)
- ❌ All CRUD actions: **disabled**
        `,
      },
    },
    featureFlags: {
      'platform.rbac.workspaces-list': true,
      'platform.rbac.workspace-hierarchy': true,
      'platform.rbac.workspaces-role-bindings': true,
      'platform.rbac.workspaces': false,
    },
    // Mock Kessel permissions - read-only user (empty workspace IDs)
    workspacePermissions: { view: [], edit: [], delete: [], create: [], move: [] },
    chrome: {
      environment: 'prod',
    },
    msw: {
      handlers: [...workspacesHandlers(workspaceDataForHandlers)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify M3 read-only create button disabled', async () => {
      await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();
      const createButton = canvas.getByRole('button', { name: /create workspace/i });
      expect(createButton).toBeDisabled();
    });
  },
};
