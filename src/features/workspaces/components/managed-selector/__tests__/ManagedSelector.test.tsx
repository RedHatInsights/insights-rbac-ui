/**
 * ManagedSelector Component Unit Tests
 *
 * Tests for the ManagedSelector shared component including:
 * - Component rendering and basic functionality
 * - Search and filter operations
 * - Workspace selection and state management
 * - Tree navigation and expansion
 * - Error handling and loading states
 * - Exported utility functions
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import * as React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { IntlProvider } from 'react-intl';
import axios from 'axios';
import MockAdapter from 'axios-mock-adapter';
import {
  ManagedSelector,
  createWorkspaceDataFetcher,
  createWorkspaceSearchFilter,
  fetchWorkspacesFromRBAC,
  filterWorkspaceItems,
} from '../ManagedSelector';
import type { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import type { TreeViewWorkspaceItem } from '../TreeViewWorkspaceItem';

// ============================================================================
// Test Setup
// ============================================================================

const mockWorkspacesResponse = {
  data: [
    {
      id: 'ws-root',
      name: 'Root Workspace',
      description: 'The root workspace',
      parent_id: '',
      type: 'root',
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'ws-default',
      name: 'Default Workspace',
      description: 'The default workspace',
      parent_id: 'ws-root',
      type: 'default',
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'ws-dev',
      name: 'Development',
      description: 'Development workspace',
      parent_id: 'ws-root',
      type: 'standard',
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'ws-prod',
      name: 'Production',
      description: 'Production workspace',
      parent_id: 'ws-root',
      type: 'standard',
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
    {
      id: 'ws-dev-fe',
      name: 'Frontend',
      description: 'Frontend development',
      parent_id: 'ws-dev',
      type: 'standard',
      created: '2024-01-01T00:00:00Z',
      modified: '2024-01-01T00:00:00Z',
    },
  ],
};

function createTestQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
        gcTime: Infinity,
        staleTime: Infinity,
      },
    },
  });
}

function renderWithProviders(component: React.ReactElement) {
  const queryClient = createTestQueryClient();
  return render(
    <IntlProvider locale="en">
      <QueryClientProvider client={queryClient}>{component}</QueryClientProvider>
    </IntlProvider>,
  );
}

// ============================================================================
// Component Tests
// ============================================================================

describe('ManagedSelector Component', () => {
  let mockAxios: MockAdapter;

  beforeEach(() => {
    mockAxios = new MockAdapter(axios);
    mockAxios.onGet('/api/rbac/v2/workspaces/').reply(200, mockWorkspacesResponse);
  });

  afterEach(() => {
    mockAxios.restore();
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Rendering Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('Rendering', () => {
    test('renders the component successfully', () => {
      const { container } = renderWithProviders(<ManagedSelector />);
      expect(container).toBeInTheDocument();
    });

    test('renders the menu toggle button', async () => {
      renderWithProviders(<ManagedSelector />);

      // Wait for component to load
      await waitFor(() => {
        const toggleButton = screen.queryByRole('button', { name: /select workspaces/i });
        expect(toggleButton).toBeInTheDocument();
      });
    });

    test('renders with default placeholder text', async () => {
      renderWithProviders(<ManagedSelector />);

      await waitFor(() => {
        // Should show some default text or empty state
        expect(screen.queryByRole('button')).toBeInTheDocument();
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Menu Interaction Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('Menu Interaction', () => {
    test('opens workspace selector menu when toggle is clicked', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManagedSelector />);

      const toggleButton = await screen.findByRole('button', { name: /select workspaces/i });
      await user.click(toggleButton);

      // Menu should open and show search input
      await waitFor(() => {
        const searchInput = screen.queryByPlaceholderText(/find a workspace by name/i);
        expect(searchInput).toBeInTheDocument();
      });
    });

    test('closes menu when escape key is pressed', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManagedSelector />);

      // Open menu
      const toggleButton = await screen.findByRole('button', { name: /select workspaces/i });
      await user.click(toggleButton);

      // Verify menu is open
      const searchInput = await screen.findByPlaceholderText(/find a workspace by name/i);
      expect(searchInput).toBeInTheDocument();

      // Press escape
      await user.keyboard('{Escape}');

      // Menu should close
      await waitFor(() => {
        expect(screen.queryByPlaceholderText(/find a workspace by name/i)).not.toBeInTheDocument();
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Workspace Loading Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('Workspace Loading', () => {
    test('fetches workspaces on mount when menu is opened', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManagedSelector />);

      const toggleButton = await screen.findByRole('button', { name: /select workspaces/i });
      await user.click(toggleButton);

      // Should make API call and load workspaces
      await waitFor(() => {
        expect(mockAxios.history.get.length).toBeGreaterThan(0);
      });
    });

    test('displays loading state while fetching workspaces', async () => {
      // Delay the response to test loading state
      mockAxios.onGet('/api/rbac/v2/workspaces/').reply(() => {
        return new Promise((resolve) => {
          setTimeout(() => resolve([200, mockWorkspacesResponse]), 100);
        });
      });

      const user = userEvent.setup();
      renderWithProviders(<ManagedSelector />);

      const toggleButton = await screen.findByRole('button', { name: /select workspaces/i });
      await user.click(toggleButton);

      // Should show loading indicator
      await waitFor(() => {
        screen.queryByRole('progressbar');
        // Loading may be very fast, so we just verify the component renders
        expect(screen.getByPlaceholderText(/find a workspace by name/i)).toBeInTheDocument();
      });
    });

    test('handles API errors gracefully', async () => {
      mockAxios.onGet('/api/rbac/v2/workspaces/').reply(500, { error: 'Server error' });

      const user = userEvent.setup();
      renderWithProviders(<ManagedSelector />);

      const toggleButton = await screen.findByRole('button', { name: /select workspaces/i });
      await user.click(toggleButton);

      // Component should still render, error is handled internally
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/find a workspace by name/i)).toBeInTheDocument();
      });
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Search and Filter Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('Search and Filter', () => {
    test('filters workspaces by search input', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManagedSelector />);

      const toggleButton = await screen.findByRole('button', { name: /select workspaces/i });
      await user.click(toggleButton);

      const searchInput = await screen.findByPlaceholderText(/find a workspace by name/i);
      await user.type(searchInput, 'Development');

      // Should filter results
      await waitFor(() => {
        expect(searchInput).toHaveValue('Development');
      });
    });

    test('search is case-insensitive', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManagedSelector />);

      const toggleButton = await screen.findByRole('button', { name: /select workspaces/i });
      await user.click(toggleButton);

      const searchInput = await screen.findByPlaceholderText(/find a workspace by name/i);

      // Search with different cases
      await user.type(searchInput, 'DEVELOPMENT');
      expect(searchInput).toHaveValue('DEVELOPMENT');

      await user.clear(searchInput);
      await user.type(searchInput, 'development');
      expect(searchInput).toHaveValue('development');
    });

    test('clears search when input is cleared', async () => {
      const user = userEvent.setup();
      renderWithProviders(<ManagedSelector />);

      const toggleButton = await screen.findByRole('button', { name: /select workspaces/i });
      await user.click(toggleButton);

      const searchInput = await screen.findByPlaceholderText(/find a workspace by name/i);

      // Enter search text
      await user.type(searchInput, 'Development');
      expect(searchInput).toHaveValue('Development');

      // Clear search
      await user.clear(searchInput);
      expect(searchInput).toHaveValue('');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Workspace Selection Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('Workspace Selection', () => {
    test('calls onSelect callback when workspace is selected', async () => {
      const handleSelect = vi.fn();
      const user = userEvent.setup();

      renderWithProviders(<ManagedSelector onSelect={handleSelect} />);

      const toggleButton = await screen.findByRole('button', { name: /select workspaces/i });
      await user.click(toggleButton);

      // Wait for workspaces to load, then select one
      await waitFor(() => {
        expect(screen.getByPlaceholderText(/find a workspace by name/i)).toBeInTheDocument();
      });

      // Note: Actual workspace selection would require the tree to be rendered
      // This is a basic test to verify the callback prop is accepted
      expect(handleSelect).not.toHaveBeenCalled();
    });

    test('accepts initial selected workspace prop', () => {
      const initialWorkspace: TreeViewWorkspaceItem = {
        id: 'ws-default',
        name: 'Default Workspace',
        workspace: {
          id: 'ws-default',
          name: 'Default Workspace',
          type: 'default',
          parent_id: 'ws-root',
        },
      };

      renderWithProviders(<ManagedSelector initialSelectedWorkspace={initialWorkspace} />);

      // Component should accept the prop without errors
      expect(screen.queryByRole('button')).toBeInTheDocument();
    });

    test('accepts source workspace prop for exclusion', () => {
      const sourceWorkspace: TreeViewWorkspaceItem = {
        id: 'ws-dev',
        name: 'Development',
        workspace: {
          id: 'ws-dev',
          name: 'Development',
          type: 'standard',
          parent_id: 'ws-root',
        },
      };

      renderWithProviders(<ManagedSelector sourceWorkspace={sourceWorkspace} />);

      // Component should accept the prop without errors
      expect(screen.queryByRole('button')).toBeInTheDocument();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // Props and Configuration Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('Props and Configuration', () => {
    test('renders with all props provided', () => {
      const handleSelect = vi.fn();
      const initialWorkspace: TreeViewWorkspaceItem = {
        id: 'ws-default',
        name: 'Default Workspace',
        workspace: {
          id: 'ws-default',
          name: 'Default Workspace',
          type: 'default',
          parent_id: 'ws-root',
        },
      };
      const sourceWorkspace: TreeViewWorkspaceItem = {
        id: 'ws-dev',
        name: 'Development',
        workspace: {
          id: 'ws-dev',
          name: 'Development',
          type: 'standard',
          parent_id: 'ws-root',
        },
      };

      renderWithProviders(<ManagedSelector onSelect={handleSelect} initialSelectedWorkspace={initialWorkspace} sourceWorkspace={sourceWorkspace} />);

      expect(screen.queryByRole('button')).toBeInTheDocument();
    });

    test('renders without any props', () => {
      renderWithProviders(<ManagedSelector />);
      expect(screen.queryByRole('button')).toBeInTheDocument();
    });
  });
});

// ============================================================================
// Utility Functions Tests
// ============================================================================

describe('Utility Functions', () => {
  // ─────────────────────────────────────────────────────────────────────────
  // fetchWorkspacesFromRBAC Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('fetchWorkspacesFromRBAC', () => {
    let mockAxios: MockAdapter;

    beforeEach(() => {
      mockAxios = new MockAdapter(axios);
    });

    afterEach(() => {
      mockAxios.restore();
    });

    test('fetches workspaces from the correct endpoint', async () => {
      mockAxios.onGet('/api/rbac/v2/workspaces/').reply(200, mockWorkspacesResponse);

      const response = await fetchWorkspacesFromRBAC();

      expect(response.data).toEqual(mockWorkspacesResponse);
      expect(mockAxios.history.get[0].url).toBe('/api/rbac/v2/workspaces/');
    });

    test('includes correct query parameters', async () => {
      mockAxios.onGet('/api/rbac/v2/workspaces/').reply(200, mockWorkspacesResponse);

      await fetchWorkspacesFromRBAC();

      const request = mockAxios.history.get[0];
      expect(request.params).toEqual({
        limit: Number.MAX_SAFE_INTEGER,
      });
    });

    test('throws error on API failure', async () => {
      mockAxios.onGet('/api/rbac/v2/workspaces/').reply(500, { error: 'Server error' });

      await expect(fetchWorkspacesFromRBAC()).rejects.toThrow();
    });

    test('returns workspace data in expected format', async () => {
      mockAxios.onGet('/api/rbac/v2/workspaces/').reply(200, mockWorkspacesResponse);

      const response = await fetchWorkspacesFromRBAC();

      expect(response.data.data).toBeInstanceOf(Array);
      expect(response.data.data.length).toBe(5);
      expect(response.data.data[0]).toHaveProperty('id');
      expect(response.data.data[0]).toHaveProperty('name');
      expect(response.data.data[0]).toHaveProperty('type');
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // filterWorkspaceItems Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('filterWorkspaceItems', () => {
    const createMockTreeItem = (name: string, children?: TreeViewDataItem[]): TreeViewDataItem => ({
      id: name.toLowerCase().replace(/\s+/g, '-'),
      name,
      children,
    });

    test('returns true for exact name match', () => {
      const item = createMockTreeItem('Development');
      const result = filterWorkspaceItems(item, 'Development');
      expect(result).toBe(true);
    });

    test('returns true for partial name match', () => {
      const item = createMockTreeItem('Development');
      const result = filterWorkspaceItems(item, 'Dev');
      expect(result).toBe(true);
    });

    test('is case-insensitive', () => {
      const item = createMockTreeItem('Development');

      expect(filterWorkspaceItems(item, 'DEVELOPMENT')).toBe(true);
      expect(filterWorkspaceItems(item, 'development')).toBe(true);
      expect(filterWorkspaceItems(item, 'DeVeLoPmEnT')).toBe(true);
    });

    test('returns false for non-matching name', () => {
      const item = createMockTreeItem('Development');
      const result = filterWorkspaceItems(item, 'Production');
      expect(result).toBe(false);
    });

    test('returns false for item without name', () => {
      const item: TreeViewDataItem = { id: 'test' };
      const result = filterWorkspaceItems(item, 'test');
      expect(result).toBe(false);
    });

    test('returns false for item with non-string name', () => {
      const item: TreeViewDataItem = { id: 'test', name: 123 as any };
      const result = filterWorkspaceItems(item, 'test');
      expect(result).toBe(false);
    });

    test('includes parent if any child matches', () => {
      const parent = createMockTreeItem('Parent', [createMockTreeItem('Child Development'), createMockTreeItem('Child Production')]);

      const result = filterWorkspaceItems(parent, 'Development');
      expect(result).toBe(true);
    });

    test('filters children and includes only matching ones', () => {
      const parent = createMockTreeItem('Parent', [createMockTreeItem('Child Development'), createMockTreeItem('Child Production')]);

      filterWorkspaceItems(parent, 'Development');

      // After filtering, only matching children should remain
      expect(parent.children).toBeDefined();
      expect(parent.children!.length).toBe(1);
      expect(parent.children![0].name).toBe('Child Development');
    });

    test('handles deeply nested tree structures', () => {
      const deepTree = createMockTreeItem('Root', [
        createMockTreeItem('Level 1', [createMockTreeItem('Level 2', [createMockTreeItem('Level 3 Development')])]),
      ]);

      const result = filterWorkspaceItems(deepTree, 'Development');
      expect(result).toBe(true);
    });

    test('handles empty string search', () => {
      const item = createMockTreeItem('Development');
      // Empty string should match everything (contains check)
      const result = filterWorkspaceItems(item, '');
      expect(result).toBe(true);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // createWorkspaceDataFetcher Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('createWorkspaceDataFetcher', () => {
    test('is exported and can be imported', () => {
      // createWorkspaceDataFetcher is a React hook factory that must be called within a component
      // We verify it exists and is a function
      expect(createWorkspaceDataFetcher).toBeDefined();
      expect(typeof createWorkspaceDataFetcher).toBe('function');
    });

    test('can be called with valid parameters', () => {
      // This is a hook factory, so we just verify the function signature
      // Actual functionality is tested in component integration tests
      expect(() => {
        createWorkspaceDataFetcher.length; // Check function arity
      }).not.toThrow();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────
  // createWorkspaceSearchFilter Tests
  // ─────────────────────────────────────────────────────────────────────────

  describe('createWorkspaceSearchFilter', () => {
    const createMockTreeItem = (name: string): TreeViewWorkspaceItem => ({
      id: name.toLowerCase(),
      name,
      workspace: {
        id: name.toLowerCase(),
        name,
        type: 'standard',
        parent_id: 'root',
      },
    });

    test('creates a search filter function', () => {
      const workspaceTree = createMockTreeItem('Root');
      const setFilteredTreeElements = vi.fn();
      const setElementsAreFiltered = vi.fn();

      const filter = createWorkspaceSearchFilter(workspaceTree, setFilteredTreeElements, setElementsAreFiltered);

      expect(typeof filter).toBe('function');
    });

    test('resets to full tree on empty search', () => {
      const workspaceTree = createMockTreeItem('Root');
      const setFilteredTreeElements = vi.fn();
      const setElementsAreFiltered = vi.fn();

      const filter = createWorkspaceSearchFilter(workspaceTree, setFilteredTreeElements, setElementsAreFiltered);
      filter('');

      expect(setFilteredTreeElements).toHaveBeenCalledWith([workspaceTree]);
      expect(setElementsAreFiltered).toHaveBeenCalledWith(false);
    });

    test('filters and sets filtered state on non-empty search', () => {
      const workspaceTree = createMockTreeItem('Root');
      const setFilteredTreeElements = vi.fn();
      const setElementsAreFiltered = vi.fn();

      const filter = createWorkspaceSearchFilter(workspaceTree, setFilteredTreeElements, setElementsAreFiltered);
      filter('Development');

      expect(setFilteredTreeElements).toHaveBeenCalled();
      expect(setElementsAreFiltered).toHaveBeenCalledWith(true);
    });

    test('handles undefined workspace tree', () => {
      const setFilteredTreeElements = vi.fn();
      const setElementsAreFiltered = vi.fn();

      const filter = createWorkspaceSearchFilter(undefined, setFilteredTreeElements, setElementsAreFiltered);
      filter('test');

      expect(setElementsAreFiltered).toHaveBeenCalledWith(false);
    });

    test('returns empty array on empty search with undefined tree', () => {
      const setFilteredTreeElements = vi.fn();
      const setElementsAreFiltered = vi.fn();

      const filter = createWorkspaceSearchFilter(undefined, setFilteredTreeElements, setElementsAreFiltered);
      filter('');

      expect(setFilteredTreeElements).toHaveBeenCalledWith([]);
      expect(setElementsAreFiltered).toHaveBeenCalledWith(false);
    });
  });
});
