/**
 * WorkspaceDetail Component Tests
 *
 * Full end-to-end integration tests for user journeys:
 * - View workspace details
 * - Edit workspace name/description
 * - Delete workspace
 * - View group bindings
 * - Tab navigation
 */

import { beforeEach, describe, expect, test } from 'vitest';
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import {
  act,
  clearLastStatus,
  createTestQueryClient,
  createTestServices,
  fireEvent,
  getLastStatus,
  pressKey,
  render,
  resetMockData,
  screen,
  waitFor,
} from '../../test-utils';
import { WorkspaceDetail } from '../WorkspaceDetail';

// Helper to render with proper routing
function renderWorkspaceDetail(workspaceId: string) {
  const queryClient = createTestQueryClient();
  const services = createTestServices();

  const TestComponent = () => (
    <Routes>
      <Route path="/workspaces/:id" element={<WorkspaceDetail queryClient={queryClient} />} />
    </Routes>
  );

  const result = render(<TestComponent />, {
    initialEntries: [`/workspaces/${workspaceId}`],
    services,
    queryClient,
  });

  return { ...result, queryClient, services };
}

describe('WorkspaceDetail', () => {
  beforeEach(() => {
    resetMockData();
    clearLastStatus();
  });

  // ==========================================================================
  // USER JOURNEY: View Workspace Details
  // ==========================================================================

  describe('User Journey: View Workspace Details', () => {
    test('loads and displays complete workspace information', async () => {
      const { container } = renderWorkspaceDetail('ws-dev');

      // Should show loading
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for data to load
      await waitFor(
        () => {
          expect(container.textContent).toContain('Development');
        },
        { timeout: 5000 },
      );

      // Verify workspace info is displayed
      expect(container.textContent).toContain('Development');
      expect(container.textContent).toContain('ID');
      expect(container.textContent).toContain('Type');
      expect(container.textContent).toContain('Parent');
    });

    test('shows correct type for standard workspace', async () => {
      const { container } = renderWorkspaceDetail('ws-dev');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Development');
        },
        { timeout: 5000 },
      );

      expect(container.textContent).toContain('standard');
    });

    test('shows error for non-existent workspace', async () => {
      const { container } = renderWorkspaceDetail('non-existent-id');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Failed to load workspace');
        },
        { timeout: 5000 },
      );
    });
  });

  // ==========================================================================
  // USER JOURNEY: Edit Workspace
  // ==========================================================================

  describe('User Journey: Edit Workspace', () => {
    test('edits workspace name and description successfully', async () => {
      const { container } = renderWorkspaceDetail('ws-dev');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Development');
        },
        { timeout: 5000 },
      );

      // Press 'e' to edit
      act(() => {
        pressKey('e');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Edit Workspace');
      });

      // Find and update the name input
      const inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      expect(inputs.length).toBeGreaterThan(0);

      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'Updated Workspace Name' } });
      });

      // Submit
      act(() => {
        pressKey('enter');
      });

      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Workspace updated successfully');
          expect(status?.type).toBe('success');
        },
        { timeout: 5000 },
      );
    });

    test('shows error when editing with empty name', async () => {
      const { container } = renderWorkspaceDetail('ws-dev');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Development');
        },
        { timeout: 5000 },
      );

      // Press 'e' to edit
      act(() => {
        pressKey('e');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Edit Workspace');
      });

      // Clear the name input
      const inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      if (inputs.length > 0) {
        act(() => {
          fireEvent.change(inputs[0], { target: { value: '' } });
        });
      }

      // Try to submit
      act(() => {
        pressKey('enter');
      });

      await waitFor(() => {
        const status = getLastStatus();
        expect(status?.message).toContain('Name is required');
        expect(status?.type).toBe('error');
      });
    });

    test('cancels edit without saving changes', async () => {
      const { container } = renderWorkspaceDetail('ws-dev');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Development');
        },
        { timeout: 5000 },
      );

      // Press 'e' to edit
      act(() => {
        pressKey('e');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Edit Workspace');
      });

      // Cancel with escape
      act(() => {
        pressKey('escape');
      });

      await waitFor(() => {
        expect(container.textContent).not.toContain('Edit Workspace');
        expect(container.textContent).toContain('Development');
      });
    });

    test('cannot edit system workspaces', async () => {
      const { container } = renderWorkspaceDetail('ws-default');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Default Workspace');
        },
        { timeout: 5000 },
      );

      // Press 'e' to try to edit
      act(() => {
        pressKey('e');
      });

      // Should NOT show edit form (system workspace)
      expect(container.textContent).not.toContain('Edit Workspace');
    });
  });

  // ==========================================================================
  // USER JOURNEY: Delete Workspace
  // ==========================================================================

  describe('User Journey: Delete Workspace', () => {
    test('deletes workspace and navigates away', async () => {
      const { container } = renderWorkspaceDetail('ws-dev');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Development');
        },
        { timeout: 5000 },
      );

      // Press 'd' to delete
      act(() => {
        pressKey('d');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Delete');
        expect(container.textContent).toContain('Y/N');
      });

      // Confirm with 'y'
      act(() => {
        pressKey('y');
      });

      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Workspace deleted successfully');
          expect(status?.type).toBe('success');
        },
        { timeout: 5000 },
      );
    });

    test('cancels delete with N', async () => {
      const { container } = renderWorkspaceDetail('ws-dev');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Development');
        },
        { timeout: 5000 },
      );

      // Press 'd' to delete
      act(() => {
        pressKey('d');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Y/N');
      });

      // Cancel with 'n'
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).not.toContain('Y/N');
        expect(container.textContent).toContain('Development');
      });
    });

    test('prevents deleting system workspaces', async () => {
      const { container } = renderWorkspaceDetail('ws-default');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Default Workspace');
        },
        { timeout: 5000 },
      );

      // Press 'd' to try to delete
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
  // USER JOURNEY: Tab Navigation
  // ==========================================================================

  describe('User Journey: Tab Navigation', () => {
    test('switches between Info and Bindings tabs', async () => {
      const { container } = renderWorkspaceDetail('ws-dev');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Development');
        },
        { timeout: 5000 },
      );

      // Initially on Info tab
      expect(container.textContent).toContain('ID');
      expect(container.textContent).toContain('Type');

      // Press '2' to switch to Bindings tab
      act(() => {
        pressKey('2');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Group Bindings');
      });

      // Press '1' to go back to Info tab
      act(() => {
        pressKey('1');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('ID');
        expect(container.textContent).toContain('Type');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Refresh
  // ==========================================================================

  describe('User Journey: Refresh', () => {
    test('refreshes workspace data with R key', async () => {
      const { container } = renderWorkspaceDetail('ws-dev');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Development');
        },
        { timeout: 5000 },
      );

      // Press 'r' to refresh
      act(() => {
        pressKey('r');
      });

      await waitFor(() => {
        const status = getLastStatus();
        expect(status?.message).toBe('Refreshed');
      });
    });
  });
});
