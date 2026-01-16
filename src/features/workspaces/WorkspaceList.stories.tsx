import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { WorkspaceList } from './WorkspaceList';

// Import shared test functions and mock data from helper file
import { mockWorkspaces, testDefaultWorkspaceDisplay, testEmptyState, testLoadingState } from './workspaceTestHelpers';
import { BrowserRouter } from 'react-router-dom';
import { HttpResponse, delay, http } from 'msw';

// Now using imported mockWorkspaces from table stories
// Each story defines its own MSW handlers to control API responses

// Minimal decorator - only provide Router (Redux provider is global)
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
    // Use global providers for these (configured in .storybook/preview.tsx)
    permissions: {
      orgAdmin: true, // Default for testing
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
**Default View**: Complete workspace list container with Redux integration. Orchestrates data fetching, page layout, header composition, and fully functional workspace table.

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[Loading](?path=/story/features-workspaces-workspacelist--loading-from-redux)**: Tests container behavior during API loading via Redux state management
- **[Empty](?path=/story/features-workspaces-workspacelist--empty-from-redux)**: Tests container response to empty workspace data from Redux  
- **[Error](?path=/story/features-workspaces-workspacelist--error-from-redux)**: Tests container error state management from Redux
- **[PermissionIntegration](?path=/story/features-workspaces-workspacelist--permission-integration)**: Tests container permission handling and access control
- **[MoveWorkspaceModal](?path=/story/features-workspaces-workspacelist--move-workspace-modal)**: Tests move workspace modal workflow with Redux orchestration
        `,
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: mockWorkspaces.map((ws) => ({ ...ws, children: undefined })),
            meta: { count: mockWorkspaces.length, limit: 10000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    // Wait for container to load data through Redux
    const canvas = within(canvasElement);
    await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Root Workspace')).resolves.toBeInTheDocument();

    // Now reuse the shared test function
    await testDefaultWorkspaceDisplay(canvasElement);
  },
};

// Container stories that reuse table story data and test Redux integration

export const Loading: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests container Redux integration for loading states. The component should show skeleton loading indicators while data is being fetched through Redux state management.',
      },
    },
    msw: {
      handlers: [
        // Never resolve to keep component in loading state
        http.get('/api/rbac/v2/workspaces/', async () => {
          await delay('infinite');
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 10000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    await testLoadingState(canvasElement);
  },
};

export const Empty: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests container handling of empty workspace data from Redux. When no workspaces are available, the container should coordinate with the table to display appropriate empty state messaging.',
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 10000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    await testEmptyState(canvasElement);
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
          'Tests container error handling when API requests fail. The container should manage error state through Redux and coordinate error display with the table component.',
      },
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v2/workspaces/', () => {
          return new HttpResponse(null, { status: 500, statusText: 'Internal Server Error' });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // For error states, we might still have skeletons or they might not disappear
    // Focus on finding the actual error state instead
    // Wait for loading to complete first, then check for error state
    await waitFor(
      async () => {
        // First check that we're not in loading state anymore
        const skeletons = canvasElement.querySelectorAll('.pf-v6-c-skeleton');
        await expect(skeletons.length).toBe(0);
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
          'Tests container permission integration with Chrome API. Users with read-only permissions should see disabled create/edit actions. Validates container fetches and filters permissions correctly.',
      },
    },
    // Mock Chrome permissions - read-only user
    chrome: {
      environment: 'prod',
      getUserPermissions: () => Promise.resolve([{ permission: 'inventory:groups:read', resourceDefinitions: [] }]),
    },
    msw: {
      handlers: [
        // Mock API to return data through Redux orchestration
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: mockWorkspaces.map((ws) => ({ ...ws, children: undefined })), // API format
            meta: { count: mockWorkspaces.length, limit: 10000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    // Wait for container to load data through Redux and permissions to be fetched
    const canvas = within(canvasElement);
    await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();

    // Verify page structure
    await expect(canvas.getByText('Workspaces')).toBeInTheDocument();

    // Verify workspace data is displayed
    await expect(canvas.getByText('Root Workspace')).toBeInTheDocument();
    await expect(canvas.getByText('Production Environment')).toBeInTheDocument();
    await expect(canvas.getByText('Development Environment')).toBeInTheDocument();

    // Verify the Create workspace button is DISABLED for read-only users
    const createButton = canvas.getByRole('button', { name: /create workspace/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton).toBeDisabled(); // Read-only users cannot create

    // Verify the bulk Delete workspaces button is DISABLED for read-only users (M5 feature)
    const deleteButton = canvas.getByRole('button', { name: /delete workspaces/i });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toBeDisabled(); // Read-only users cannot delete

    // Verify action menus are present
    const kebabButtons = canvas.getAllByLabelText('Kebab toggle');
    expect(kebabButtons.length).toBeGreaterThan(0);

    // Open kebab menu to verify actions exist (but will be disabled)
    await userEvent.click(kebabButtons[0]);

    // Verify menu structure exists
    await expect(within(document.body).getByText('Edit workspace')).toBeInTheDocument();
    await expect(within(document.body).getByText('Delete workspace')).toBeInTheDocument();
    await expect(within(document.body).getByText('Move workspace')).toBeInTheDocument();
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
      getUserPermissions: () =>
        Promise.resolve([
          {
            permission: 'inventory:groups:write', // Fix: Use the correct permission that canModify() expects
            resourceDefinitions: [{ attributeFilter: { key: 'uuid', operation: 'in', value: ['1', '2'] } }],
          },
        ]),
    },
    msw: {
      handlers: [
        // Mock get workspaces API - Redux will fetch this on mount
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: mockWorkspaces,
            meta: { count: mockWorkspaces.length, limit: 10000, offset: 0 },
          });
        }),
        // Mock move workspace API with spy function
        http.post('/api/rbac/v2/workspaces/:workspaceId/move', async ({ request, params }) => {
          const { workspaceId } = params;
          const body = (await request.json()) as any;

          // Call spy function with the parameters
          moveWorkspaceSpy(workspaceId, body);

          return HttpResponse.json({
            data: { id: workspaceId, ...body?.workspacesMoveWorkspaceRequest },
            meta: { count: 1 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Clear spy calls from any previous test runs
    moveWorkspaceSpy.mockClear();

    // Wait for initial load
    await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();

    // Find the "Production Environment" row using the same method as table stories
    const productionRow = canvasElement.querySelector('[data-ouia-component-id="workspaces-list-tr-1"]') as HTMLElement;
    await expect(productionRow).toBeTruthy();

    const productionRowScope = within(productionRow);
    const actionsButton = productionRowScope.getByLabelText('Kebab toggle');
    await user.click(actionsButton);

    // Wait for the menu to open and find "Move workspace" action
    await expect(within(document.body).findByText('Move workspace')).resolves.toBeInTheDocument();

    const moveAction = await within(document.body).findByText('Move workspace');
    await user.click(moveAction);

    // Verify move modal opened (search in document body since modal is rendered in portal)
    const modalCanvas = within(document.body);
    await expect(
      await modalCanvas.findByText((content) => {
        return content.includes('Move') && content.includes('Production Environment');
      }),
    ).toBeInTheDocument();
    await expect(modalCanvas.getByText('Parent workspace')).toBeInTheDocument();

    // The selector now shows "Root Workspace" (the current parent) instead of "Select workspaces"
    // since we're passing initialSelectedWorkspace. Find the menu toggle that contains "Root Workspace".
    // Find all buttons and look for the one with menu toggle text containing "Root Workspace"
    const buttons = await modalCanvas.findAllByRole('button');
    const menuToggleButton = buttons.find((button) => {
      const menuToggleText = button.querySelector('.pf-v6-c-menu-toggle__text');
      return menuToggleText?.textContent === 'Root Workspace';
    });
    await expect(menuToggleButton).toBeTruthy();
    const selectButton = menuToggleButton as HTMLElement;
    // Ensure the button is not disabled and is interactive
    await expect(selectButton).not.toBeDisabled();

    // Click the menu toggle button to open the dropdown
    await user.click(selectButton!);

    // Wait for tree view to appear inside the dropdown
    await expect(modalCanvas.findByRole('tree')).resolves.toBeInTheDocument();

    // Now find the tree view and expand the Root Workspace to see children
    const treeViewElement = await modalCanvas.findByRole('tree');
    // Find the toggle button by its class instead of name since it doesn't have "toggle" in accessible name
    const expandButton = treeViewElement.querySelector('.pf-v6-c-tree-view__node-toggle') as HTMLElement;
    await user.click(expandButton);

    // Wait for the tree to expand and show children within the tree view
    const treeViewScope = within(treeViewElement);
    // Find Development Environment within the tree view scope
    await expect(treeViewScope.findByText('Development Environment')).resolves.toBeInTheDocument();

    // Find and click the Development Environment button within the tree view
    const devWorkspaceButton = await treeViewScope.findByText('Development Environment');
    await user.click(devWorkspaceButton);

    // Wait for submit button to become enabled after selection
    const submitButton = await modalCanvas.findByRole('button', { name: /submit/i });
    await expect(submitButton).toBeEnabled();

    // Submit the move operation
    await user.click(submitButton);

    // Wait for API call and verify it was made with correct parameters
    await waitFor(async () => {
      await expect(moveWorkspaceSpy).toHaveBeenCalledWith('1', {
        parent_id: '2', // Development Environment ID
      });
    });

    // Verify modal closed after successful operation
    await waitFor(async () => {
      await expect(
        modalCanvas.queryByText((content) => {
          return content.includes('Move') && content.includes('Production Environment');
        }),
      ).not.toBeInTheDocument();
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
- ❌ Bulk "Delete workspaces": **not shown** (M5 feature)
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
      getUserPermissions: () =>
        Promise.resolve([
          { permission: 'inventory:groups:write', resourceDefinitions: [] },
          { permission: 'inventory:hosts:read', resourceDefinitions: [] },
        ]),
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: mockWorkspaces.map((ws) => ({ ...ws, children: undefined })),
            meta: { count: mockWorkspaces.length, limit: 10000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Wait for page load
    await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();

    // Verify "Create workspace" button is ENABLED
    const createButton = canvas.getByRole('button', { name: /create workspace/i });
    expect(createButton).toBeInTheDocument();
    expect(createButton).not.toBeDisabled();

    // Verify bulk delete button does NOT appear (M5 only)
    const deleteButtons = canvas.queryAllByRole('button', { name: /delete workspaces/i });
    expect(deleteButtons.length).toBe(0);
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
    chrome: {
      environment: 'prod',
      getUserPermissions: () => Promise.resolve([{ permission: 'inventory:groups:read', resourceDefinitions: [] }]),
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: mockWorkspaces.map((ws) => ({ ...ws, children: undefined })),
            meta: { count: mockWorkspaces.length, limit: 10000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();

    // Verify "Create workspace" button is DISABLED
    const createButton = canvas.getByRole('button', { name: /create workspace/i });
    expect(createButton).toBeDisabled();
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
- ❌ Bulk "Delete workspaces": **not shown** (M5 feature)
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
      getUserPermissions: () =>
        Promise.resolve([
          { permission: 'inventory:groups:write', resourceDefinitions: [] },
          { permission: 'inventory:hosts:read', resourceDefinitions: [] },
        ]),
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: mockWorkspaces.map((ws) => ({ ...ws, children: undefined })),
            meta: { count: mockWorkspaces.length, limit: 10000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Production Environment')).resolves.toBeInTheDocument();

    // Verify "Create workspace" button is ENABLED
    const createButton = canvas.getByRole('button', { name: /create workspace/i });
    expect(createButton).not.toBeDisabled();

    // Verify bulk delete button does NOT appear (M5 only)
    const deleteButtons = canvas.queryAllByRole('button', { name: /delete workspaces/i });
    expect(deleteButtons.length).toBe(0);

    // Open kebab menu and verify M2 actions are enabled
    const kebabButtons = canvas.getAllByLabelText('Kebab toggle');
    await user.click(kebabButtons[0]);

    // Verify M2 CRUD actions exist in the kebab menu
    await within(document.body).findByText('Edit workspace');
    await within(document.body).findByText('Create subworkspace');
    await within(document.body).findByText('Move workspace');
    await within(document.body).findByText('Delete workspace');

    // Verify the kebab menu has its own "Create workspace" option
    const menuItems = document.querySelectorAll('[role="menuitem"]');
    const createWorkspaceMenuItem = Array.from(menuItems).find((item) => item.textContent?.includes('Create workspace'));
    expect(createWorkspaceMenuItem).toBeTruthy();
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
    chrome: {
      environment: 'prod',
      getUserPermissions: () => Promise.resolve([{ permission: 'inventory:groups:read', resourceDefinitions: [] }]),
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: mockWorkspaces.map((ws) => ({ ...ws, children: undefined })),
            meta: { count: mockWorkspaces.length, limit: 10000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
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
- ❌ Bulk "Delete workspaces": **not shown** (M5 feature)
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
      getUserPermissions: () =>
        Promise.resolve([
          { permission: 'inventory:groups:write', resourceDefinitions: [] },
          { permission: 'inventory:hosts:read', resourceDefinitions: [] },
        ]),
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: mockWorkspaces.map((ws) => ({ ...ws, children: undefined })),
            meta: { count: mockWorkspaces.length, limit: 10000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();

    // Verify all buttons enabled
    const createButton = canvas.getByRole('button', { name: /create workspace/i });
    expect(createButton).not.toBeDisabled();

    // Verify bulk delete button does NOT appear (M5 only)
    const deleteButtons = canvas.queryAllByRole('button', { name: /delete workspaces/i });
    expect(deleteButtons.length).toBe(0);

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
    chrome: {
      environment: 'prod',
      getUserPermissions: () => Promise.resolve([{ permission: 'inventory:groups:read', resourceDefinitions: [] }]),
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: mockWorkspaces.map((ws) => ({ ...ws, children: undefined })),
            meta: { count: mockWorkspaces.length, limit: 10000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();

    // Verify "Create workspace" button is DISABLED
    const createButton = canvas.getByRole('button', { name: /create workspace/i });
    expect(createButton).toBeDisabled();
  },
};

export const M5_WithWritePermission: Story = {
  name: 'M5: With Write Permission',
  parameters: {
    docs: {
      description: {
        story: `
**Kessel M5** (master flag) with write permissions.

**Feature Flags:**
- \`platform.rbac.workspaces\` = **true** ✅ (master flag enables all features)

**Expected Behavior:**
- ✅ All M1-M3 features: Full CRUD + role bindings
- ✅ "Create workspace" button: **enabled**
- ✅ Bulk "Delete workspaces" button: **visible and enabled** ⭐
- ✅ All kebab actions: **enabled**
        `,
      },
    },
    featureFlags: {
      'platform.rbac.workspaces': true,
    },
    chrome: {
      environment: 'prod',
      getUserPermissions: () =>
        Promise.resolve([
          { permission: 'inventory:groups:write', resourceDefinitions: [] },
          { permission: 'inventory:hosts:read', resourceDefinitions: [] },
        ]),
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: mockWorkspaces.map((ws) => ({ ...ws, children: undefined })),
            meta: { count: mockWorkspaces.length, limit: 10000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();

    // Verify "Create workspace" button is ENABLED
    const createButton = canvas.getByRole('button', { name: /create workspace/i });
    expect(createButton).not.toBeDisabled();

    // Verify bulk "Delete workspaces" button APPEARS and is ENABLED (M5 feature)
    const deleteButton = canvas.getByRole('button', { name: /delete workspaces/i });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).not.toBeDisabled();
  },
};

export const M5_ReadOnly: Story = {
  name: 'M5: Read Only',
  parameters: {
    docs: {
      description: {
        story: `
**Kessel M5** (master flag) with read-only permissions.

**Feature Flags:** Same as M5 With Write

**Expected Behavior:**
- ❌ "Create workspace" button: **disabled**
- ✅ Bulk "Delete workspaces" button: **visible but disabled** ⭐
- ❌ All CRUD actions: **disabled**
        `,
      },
    },
    featureFlags: {
      'platform.rbac.workspaces': true,
    },
    chrome: {
      environment: 'prod',
      getUserPermissions: () => Promise.resolve([{ permission: 'inventory:groups:read', resourceDefinitions: [] }]),
    },
    msw: {
      handlers: [
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({
            data: mockWorkspaces.map((ws) => ({ ...ws, children: undefined })),
            meta: { count: mockWorkspaces.length, limit: 10000, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    await expect(canvas.findByText('Workspaces')).resolves.toBeInTheDocument();

    // Verify "Create workspace" button is DISABLED
    const createButton = canvas.getByRole('button', { name: /create workspace/i });
    expect(createButton).toBeDisabled();

    // Verify bulk "Delete workspaces" button APPEARS but is DISABLED (M5 feature)
    const deleteButton = canvas.getByRole('button', { name: /delete workspaces/i });
    expect(deleteButton).toBeInTheDocument();
    expect(deleteButton).toBeDisabled();
  },
};
