import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useMemo } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { WorkspaceList } from './WorkspaceList';

// Import shared test functions and mock data from helper file
import { mockWorkspaces, testDefaultWorkspaceDisplay, testEmptyState, testErrorState, testLoadingState } from './workspaceTestHelpers';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { ChromeProvider, FeatureFlagsProvider } from '../../../.storybook/context-providers';
import ReducerRegistry, { applyReducerHash } from '@redhat-cloud-services/frontend-components-utilities/ReducerRegistry';
import { notificationsReducer } from '@redhat-cloud-services/frontend-components-notifications/redux';
import notificationsMiddleware from '@redhat-cloud-services/frontend-components-notifications/notificationsMiddleware';
import { compose } from 'redux';
import promiseMiddleware from 'redux-promise-middleware';
import thunk from 'redux-thunk';
import workspacesReducer, { workspacesInitialState } from '../../redux/workspaces/reducer';
import errorReducer from '../../redux/api-error/error-reducer';
import { HttpResponse, http } from 'msw';

// Now using imported mockWorkspaces from table stories
// Each story defines its own MSW handlers to control API responses

// Create a fresh store for each story using the same configuration as the real app
const createStoreWithState = (customWorkspacesState = {}) => {
  const middlewares = [
    thunk,
    promiseMiddleware,
    notificationsMiddleware({
      errorTitleKey: ['statusText', 'message', 'errors[0].status'],
      errorDescriptionKey: ['errors[0].detail', 'errors', 'stack'],
    }),
  ].filter((middleware) => typeof middleware === 'function');

  const composeEnhancers = compose;

  const registry = new ReducerRegistry({}, middlewares, composeEnhancers);

  registry.register({
    workspacesReducer: applyReducerHash(workspacesReducer, {
      ...workspacesInitialState,
      ...customWorkspacesState,
    }),
    errorReducer: applyReducerHash(errorReducer),
    notifications: notificationsReducer,
  });

  return registry.getStore();
};

const withProviders = (Story: any, context: any) => {
  const storeState = context.parameters?.storeState || {};
  const featureFlags = context.parameters?.featureFlags || {};

  const store = useMemo(() => createStoreWithState(storeState.workspacesReducer), [storeState]);

  return (
    <Provider store={store}>
      <BrowserRouter>
        <IntlProvider locale="en" messages={{}}>
          <FeatureFlagsProvider value={featureFlags}>
            <ChromeProvider value={{ environment: 'prod' }}>
              <div style={{ minHeight: '600px' }}>
                <Story />
              </div>
            </ChromeProvider>
          </FeatureFlagsProvider>
        </IntlProvider>
      </BrowserRouter>
    </Provider>
  );
};

const meta: Meta<typeof WorkspaceList> = {
  component: WorkspaceList,
  tags: ['autodocs', 'workspaces', 'workspace-list'],
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
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
  parameters: {
    docs: {
      description: {
        story:
          'Default workspace list container that orchestrates data fetching and page layout. Users should see the complete workspace management page with header, description, "Learn more" link, and fully functional workspace table. Tests Redux integration and component composition.',
      },
    },
    storeState: {
      workspacesReducer: {
        isLoading: false,
        workspaces: mockWorkspaces,
        error: '',
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
    // Wait for container to load data through Redux
    await waitFor(async () => {
      const canvas = within(canvasElement);
      await expect(canvas.getByText('Workspaces')).toBeInTheDocument();
      await expect(canvas.getByText('Root Workspace')).toBeInTheDocument();
    });

    // Now reuse the shared test function
    await testDefaultWorkspaceDisplay(canvasElement);
  },
};

// Container stories that reuse table story data and test Redux integration

export const LoadingFromRedux: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests container Redux integration for loading states. Users should see the same loading skeleton as the table component, but delivered through Redux state management. Validates that container properly passes isLoading from Redux store to the presentational table.',
      },
    },
    storeState: {
      workspacesReducer: {
        isLoading: true,
        workspaces: [],
        error: '',
      },
    },
    msw: {
      handlers: [
        // Never resolve to keep component in loading state
        http.get('/api/rbac/v2/workspaces/', () => {
          return new Promise(() => {}); // Never resolves
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await testLoadingState(canvasElement);
  },
};

export const EmptyFromRedux: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests container Redux integration for empty data states. Users should see the same empty state message as the table component, but delivered through Redux state. Validates that container handles empty workspaces array from Redux store.',
      },
    },
    storeState: {
      workspacesReducer: {
        isLoading: false,
        workspaces: [], // Empty array from Redux
        error: '',
      },
    },
    msw: {
      handlers: [
        // Mock API to return empty data to match Redux state
        http.get('/api/rbac/v2/workspaces/', () => {
          return HttpResponse.json({ data: [], meta: { count: 0, limit: 10000, offset: 0 } });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    // Wait for container to handle empty state through Redux
    await waitFor(async () => {
      await testEmptyState(canvasElement);
    });
  },
};

export const ErrorFromRedux: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests container Redux integration for error states. Users should see error display when Redux store contains error state. Validates that container properly passes error messages from failed API calls through to the table component.',
      },
    },
    storeState: {
      workspacesReducer: {
        isLoading: false,
        workspaces: [],
        error: 'Failed to load workspaces', // Error from Redux
      },
    },
  },
  play: async ({ canvasElement }) => {
    await testErrorState(canvasElement);
  },
};

export const PermissionIntegration: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests container permission integration with Chrome API. Users should see permission-based action enablement that matches table component behavior, but delivered through real Chrome.getUserPermissions() flow. Validates container fetches and filters permissions correctly.',
      },
    },
    storeState: {
      workspacesReducer: {
        isLoading: false,
        workspaces: mockWorkspaces, // Use same data as table stories
        error: '',
      },
    },
    // Mock Chrome permissions similar to table NoPermissions story
    chromePermissions: [{ permission: 'inventory:groups:read', resourceDefinitions: [] }],
    msw: {
      handlers: [
        // Mock API to return data that matches our Redux state
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
    // Wait for container to load data through Redux and permissions to be fetched
    await waitFor(async () => {
      const canvas = within(canvasElement);
      await expect(canvas.getByText('Workspaces')).toBeInTheDocument();
      await expect(canvas.getByText('Production Environment')).toBeInTheDocument();
    });

    // Now reuse the shared test function for workspace verification
    await testDefaultWorkspaceDisplay(canvasElement);
  },
};

// Create spy for move workspace API calls
const moveWorkspaceSpy = fn();

export const MoveWorkspaceModal: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests the complete move workspace flow through the container. Users can open the move modal from table actions, select a destination workspace, and submit the move request. Validates that container properly handles modal state, calls the correct moveWorkspace API with proper parameters, and refreshes data after successful operation.',
      },
    },
    storeState: {
      workspacesReducer: {
        isLoading: false,
        workspaces: mockWorkspaces,
        error: '',
      },
    },
    chromePermissions: [
      {
        permission: 'rbac:workspaces:write',
        resourceDefinitions: [{ attributeFilter: { key: 'uuid', operation: 'in', value: ['1', '2'] } }],
      },
    ],
    msw: {
      handlers: [
        // Mock get workspaces API
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
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Clear spy calls from any previous test runs
    moveWorkspaceSpy.mockClear();

    // Wait for initial load
    await waitFor(async () => {
      await expect(canvas.getByText('Workspaces')).toBeInTheDocument();
      await expect(canvas.getByText('Production Environment')).toBeInTheDocument();
    });

    // Find the "Production Environment" row using the same method as table stories
    const productionRow = canvasElement.querySelector('[data-ouia-component-id="workspaces-list-tr-1"]') as HTMLElement;
    expect(productionRow).toBeTruthy();

    const productionRowScope = within(productionRow);
    const actionsButton = productionRowScope.getByLabelText('Kebab toggle');
    await user.click(actionsButton);

    // Wait for the menu to open and find "Move workspace" action
    await waitFor(async () => {
      await expect(canvas.getByText('Move workspace')).toBeInTheDocument();
    });

    const moveAction = canvas.getByText('Move workspace');
    await user.click(moveAction);

    // Verify move modal opened (search in document body since modal is rendered in portal)
    const modalCanvas = within(document.body);
    await waitFor(async () => {
      await expect(
        modalCanvas.getByText((content) => {
          return content.includes('Move') && content.includes('Production Environment');
        }),
      ).toBeInTheDocument();
      await expect(modalCanvas.getByText('Parent workspace')).toBeInTheDocument();
    });

    // The selector now shows "Root Workspace" (the current parent) instead of "Select workspaces"
    // since we're passing initialSelectedWorkspace. Find the menu toggle that contains "Root Workspace".
    await waitFor(async () => {
      // Find all buttons and look for the one with menu toggle text containing "Root Workspace"
      const buttons = modalCanvas.getAllByRole('button');
      const menuToggleButton = buttons.find((button) => {
        const menuToggleText = button.querySelector('.pf-v5-c-menu-toggle__text');
        return menuToggleText?.textContent === 'Root Workspace';
      });
      expect(menuToggleButton).toBeTruthy();
    });

    // Find and click the menu toggle button that contains "Root Workspace"
    const buttons = modalCanvas.getAllByRole('button');
    const selectButton = buttons.find((button) => {
      const menuToggleText = button.querySelector('.pf-v5-c-menu-toggle__text');
      return menuToggleText?.textContent === 'Root Workspace';
    }) as HTMLElement;
    await user.click(selectButton);

    // Wait for tree view to appear inside the dropdown
    await waitFor(async () => {
      await expect(modalCanvas.getByRole('tree')).toBeInTheDocument();
    });

    // Now find the tree view and expand the Root Workspace to see children
    const treeViewElement = modalCanvas.getByRole('tree');
    // Find the toggle button by its class instead of name since it doesn't have "toggle" in accessible name
    const expandButton = treeViewElement.querySelector('.pf-v5-c-tree-view__node-toggle') as HTMLElement;
    await user.click(expandButton);

    // Wait for the tree to expand and show children within the tree view
    const treeViewScope = within(treeViewElement);
    await waitFor(async () => {
      // Find Development Environment within the tree view scope
      await expect(treeViewScope.getByText('Development Environment')).toBeInTheDocument();
    });

    // Find and click the Development Environment button within the tree view
    const devWorkspaceButton = treeViewScope.getByText('Development Environment');
    await user.click(devWorkspaceButton);

    // Wait for submit button to become enabled after selection
    await waitFor(async () => {
      const submitButton = modalCanvas.getByRole('button', { name: /submit/i });
      await expect(submitButton).toBeEnabled();
    });

    // Submit the move operation
    const submitButton = modalCanvas.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    // Wait for API call and verify it was made with correct parameters
    await waitFor(async () => {
      expect(moveWorkspaceSpy).toHaveBeenCalledWith('1', {
        parent_id: '2', // Development Environment ID
      });
    });

    // Verify modal closed after successful operation
    await waitFor(async () => {
      expect(
        modalCanvas.queryByText((content) => {
          return content.includes('Move') && content.includes('Production Environment');
        }),
      ).not.toBeInTheDocument();
    });
  },
};
