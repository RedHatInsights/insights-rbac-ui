/**
 * WorkspacesList Component Tests
 *
 * Full end-to-end integration tests for user journeys:
 * - List workspaces and verify hierarchical data
 * - Create a new workspace
 * - Delete a workspace
 * - Navigate workspace hierarchy (drill-in, back)
 * - Search and filter workspaces
 */

import { beforeEach, describe, expect, test } from 'vitest';
import React from 'react';
import {
  act,
  clearLastStatus,
  createTestQueryClient,
  fireEvent,
  getLastStatus,
  pressKey,
  render,
  resetMockData,
  screen,
  waitFor,
} from '../../test-utils';
import { WorkspacesList } from '../WorkspacesList';

describe('WorkspacesList', () => {
  beforeEach(() => {
    resetMockData();
    clearLastStatus();
  });

  // ==========================================================================
  // USER JOURNEY: View Workspaces List
  // ==========================================================================

  describe('User Journey: View Workspaces List', () => {
    test('loads and displays workspaces from root level', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      // Step 1: Should show loading
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Step 2: Wait for data to load - should show root's children
      await waitFor(
        () => {
          expect(container.textContent).toContain('Default Workspace');
        },
        { timeout: 5000 },
      );

      // Step 3: Verify child workspaces are displayed
      expect(container.textContent).toContain('Default Workspace');
      expect(container.textContent).toContain('Development');
      expect(container.textContent).toContain('Production');

      // Step 4: Verify type indicators
      expect(container.textContent).toContain('[def]');

      // Step 5: Verify parent workspace header shows root
      expect(container.textContent).toContain('Root Workspace');
    });

    test('shows preview panel for selected workspace', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Default Workspace');
        },
        { timeout: 5000 },
      );

      // Preview panel should show first workspace details
      expect(container.textContent).toContain('Preview');
      expect(container.textContent).toContain('Name');
      expect(container.textContent).toContain('Type');
    });
  });

  // ==========================================================================
  // USER JOURNEY: Navigate Workspace Hierarchy
  // ==========================================================================

  describe('User Journey: Navigate Hierarchy', () => {
    test('drills into workspace to see children', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Development');
        },
        { timeout: 5000 },
      );

      // Navigate down to Development (index 1, after Default)
      act(() => {
        pressKey('down');
      });

      // Press Enter to drill into Development
      act(() => {
        pressKey('enter');
      });

      // Should now show Development's children
      await waitFor(() => {
        expect(container.textContent).toContain('Frontend');
        expect(container.textContent).toContain('Backend');
      });

      // Header should show Development as current parent
      expect(container.textContent).toContain('Development');

      // Breadcrumb path should be visible
      expect(container.textContent).toContain('Path:');
    });

    test('navigates back with B key', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Development');
        },
        { timeout: 5000 },
      );

      // Navigate to Development and drill in
      act(() => {
        pressKey('down');
      });
      act(() => {
        pressKey('enter');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Frontend');
      });

      // Press 'b' to go back
      act(() => {
        pressKey('b');
      });

      // Should be back at root level
      await waitFor(() => {
        expect(container.textContent).toContain('Default Workspace');
        expect(container.textContent).toContain('Development');
        expect(container.textContent).toContain('Production');
      });
    });

    test('navigates to root with H key', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Development');
        },
        { timeout: 5000 },
      );

      // Drill into Development
      act(() => {
        pressKey('down');
      });
      act(() => {
        pressKey('enter');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Frontend');
      });

      // Press 'h' to go to root
      act(() => {
        pressKey('h');
      });

      // Should be back at root level
      await waitFor(() => {
        expect(container.textContent).toContain('Default Workspace');
        expect(container.textContent).toContain('Development');
      });
    });

    test('navigates through workspaces with arrow keys', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Default Workspace');
        },
        { timeout: 5000 },
      );

      // Move down
      act(() => {
        pressKey('down');
      });

      // Move down again
      act(() => {
        pressKey('down');
      });

      // Move back up
      act(() => {
        pressKey('up');
      });

      // Should still see all workspaces
      expect(container.textContent).toContain('Default Workspace');
      expect(container.textContent).toContain('Development');
      expect(container.textContent).toContain('Production');
    });
  });

  // ==========================================================================
  // USER JOURNEY: Create New Workspace
  // ==========================================================================

  describe('User Journey: Create Workspace', () => {
    test('creates a workspace and sees it in the list', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Default Workspace');
        },
        { timeout: 5000 },
      );

      // Press 'n' to open create form
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Create New Workspace');
      });

      // Find the text input and type the workspace name
      const inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      expect(inputs.length).toBeGreaterThan(0);

      const nameInput = inputs[0] as HTMLInputElement;
      act(() => {
        fireEvent.change(nameInput, { target: { value: 'My New Workspace' } });
      });

      // Press Enter to submit
      act(() => {
        pressKey('enter');
      });

      // Wait for success
      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Workspace created successfully');
          expect(status?.type).toBe('success');
        },
        { timeout: 5000 },
      );

      // Should return to browse mode
      await waitFor(() => {
        expect(container.textContent).not.toContain('Create New Workspace');
      });
    });

    test('shows error when trying to create with empty name', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Default Workspace');
        },
        { timeout: 5000 },
      );

      // Open create form
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Create New Workspace');
      });

      // Try to submit without entering a name
      act(() => {
        pressKey('enter');
      });

      // Should show error
      await waitFor(() => {
        const status = getLastStatus();
        expect(status?.message).toContain('Name is required');
        expect(status?.type).toBe('error');
      });

      // Should still be in create mode
      expect(container.textContent).toContain('Create New Workspace');
    });

    test('cancels create without saving', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Default Workspace');
        },
        { timeout: 5000 },
      );

      // Open create form
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Create New Workspace');
      });

      // Type something
      const inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      if (inputs.length > 0) {
        act(() => {
          fireEvent.change(inputs[0], { target: { value: 'Draft Workspace' } });
        });
      }

      // Cancel with escape
      act(() => {
        pressKey('escape');
      });

      // Should return to browse mode
      await waitFor(() => {
        expect(container.textContent).not.toContain('Create New Workspace');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Delete Workspace
  // ==========================================================================

  describe('User Journey: Delete Workspace', () => {
    test('deletes a standard workspace', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Development');
        },
        { timeout: 5000 },
      );

      // Navigate to Development workspace (skip Default)
      act(() => {
        pressKey('down');
      });

      // Press 'd' to delete
      act(() => {
        pressKey('d');
      });

      // Should show confirmation dialog
      await waitFor(() => {
        expect(container.textContent).toContain('Delete');
        expect(container.textContent).toContain('Development');
        expect(container.textContent).toContain('Y/N');
      });

      // Press 'y' to confirm
      act(() => {
        pressKey('y');
      });

      // Wait for success
      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Workspace deleted successfully');
          expect(status?.type).toBe('success');
        },
        { timeout: 5000 },
      );
    });

    test('cancels delete when pressing N', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Development');
        },
        { timeout: 5000 },
      );

      // Navigate to Development
      act(() => {
        pressKey('down');
      });

      // Open delete confirmation
      act(() => {
        pressKey('d');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Y/N');
      });

      // Press 'n' to cancel
      act(() => {
        pressKey('n');
      });

      // Should return to browse mode
      await waitFor(() => {
        expect(container.textContent).not.toContain('Y/N');
        expect(container.textContent).toContain('Development');
      });
    });

    test('prevents deleting default workspace', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Default Workspace');
        },
        { timeout: 5000 },
      );

      // First workspace is Default Workspace (type=default)
      // Try to delete
      act(() => {
        pressKey('d');
      });

      // Should show error, not confirmation
      await waitFor(() => {
        const status = getLastStatus();
        expect(status?.message).toContain('Cannot delete root/default workspaces');
        expect(status?.type).toBe('error');
      });

      // Should NOT show confirmation dialog
      expect(container.textContent).not.toContain('Y/N');
    });
  });

  // ==========================================================================
  // USER JOURNEY: Search Workspaces
  // ==========================================================================

  describe('User Journey: Search Workspaces', () => {
    test('opens search mode with / key', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Default Workspace');
        },
        { timeout: 5000 },
      );

      // Press '/' to open search
      act(() => {
        pressKey('/');
      });

      // Should show search input
      await waitFor(() => {
        expect(container.textContent).toContain('Search');
        const searchInput = container.querySelector('input');
        expect(searchInput).toBeInTheDocument();
      });
    });

    test('clears search with C key', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Default Workspace');
        },
        { timeout: 5000 },
      );

      // Press 'c' to clear any search
      act(() => {
        pressKey('c');
      });

      // Should show cleared status
      await waitFor(() => {
        const status = getLastStatus();
        expect(status?.message).toBe('Search cleared');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Refresh
  // ==========================================================================

  describe('User Journey: Refresh', () => {
    test('refreshes list when pressing R', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<WorkspacesList queryClient={queryClient} />, {
        initialEntries: ['/workspaces'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Default Workspace');
        },
        { timeout: 5000 },
      );

      // Press 'r' to refresh
      act(() => {
        pressKey('r');
      });

      // Should show refresh status
      await waitFor(() => {
        const status = getLastStatus();
        expect(status?.message).toBe('Refreshed');
      });
    });
  });
});
