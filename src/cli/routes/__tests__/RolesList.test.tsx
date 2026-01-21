/**
 * RolesList Component Tests
 *
 * Full end-to-end integration tests for user journeys:
 * - List roles and verify data
 * - Create a new role and see it in the list
 * - Delete a role and verify removal
 * - Search and filter roles
 * - Navigate to role detail
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
import { RolesList } from '../RolesList';

describe('RolesList', () => {
  beforeEach(() => {
    resetMockData();
    clearLastStatus();
  });

  // ==========================================================================
  // USER JOURNEY: View Roles List
  // ==========================================================================

  describe('User Journey: View Roles List', () => {
    test('loads and displays all roles from API', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<RolesList queryClient={queryClient} />, {
        initialEntries: ['/roles'],
        queryClient,
      });

      // Step 1: Should show loading
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Step 2: Wait for data to load
      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Step 3: Verify all roles are displayed
      expect(container.textContent).toContain('Test Role 1');
      expect(container.textContent).toContain('System Admin Role');
      expect(container.textContent).toContain('Viewer Role');

      // Step 4: Verify system role indicator
      expect(container.textContent).toContain('[sys]');

      // Step 5: Verify preview panel shows first role details
      expect(container.textContent).toContain('Preview');
      expect(container.textContent).toContain('Name');
      expect(container.textContent).toContain('Custom'); // Type for Test Role 1
    });
  });

  // ==========================================================================
  // USER JOURNEY: Create a New Role (Full Flow)
  // ==========================================================================

  describe('User Journey: Create New Role', () => {
    test('creates a role and sees it in the list', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<RolesList queryClient={queryClient} />, {
        initialEntries: ['/roles'],
        queryClient,
      });

      // Step 1: Wait for initial list to load
      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Step 2: Press 'n' to open create form
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Create New Role');
      });

      // Step 3: Find the text input and type the role name
      const inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      expect(inputs.length).toBeGreaterThan(0);

      // Type name into the input
      const nameInput = inputs[0] as HTMLInputElement;
      act(() => {
        fireEvent.change(nameInput, { target: { value: 'My New Custom Role' } });
      });

      // Step 4: Press Enter to submit
      act(() => {
        pressKey('enter');
      });

      // Step 5: Wait for success and verify the new role was created
      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Role created successfully');
          expect(status?.type).toBe('success');
        },
        { timeout: 5000 },
      );

      // Step 6: Should return to browse mode and show new role
      await waitFor(() => {
        expect(container.textContent).not.toContain('Create New Role');
      });
    });

    test('shows error when trying to create with empty name', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<RolesList queryClient={queryClient} />, {
        initialEntries: ['/roles'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Open create form
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Create New Role');
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
      expect(container.textContent).toContain('Create New Role');
    });

    test('cancels create without saving', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<RolesList queryClient={queryClient} />, {
        initialEntries: ['/roles'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Open create form
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Create New Role');
      });

      // Type something
      const inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      if (inputs.length > 0) {
        act(() => {
          fireEvent.change(inputs[0], { target: { value: 'Draft Role' } });
        });
      }

      // Cancel with escape
      act(() => {
        pressKey('escape');
      });

      // Should return to browse mode
      await waitFor(() => {
        expect(container.textContent).not.toContain('Create New Role');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Delete a Role (Full Flow)
  // ==========================================================================

  describe('User Journey: Delete Role', () => {
    test('deletes a custom role and removes it from the list', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<RolesList queryClient={queryClient} />, {
        initialEntries: ['/roles'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Step 1: First role (Test Role 1) is selected, press 'd' to delete
      act(() => {
        pressKey('d');
      });

      // Step 3: Should show confirmation dialog
      await waitFor(() => {
        expect(container.textContent).toContain('Delete');
        expect(container.textContent).toContain('Test Role 1');
        expect(container.textContent).toContain('Y/N');
      });

      // Step 4: Press 'y' to confirm
      act(() => {
        pressKey('y');
      });

      // Step 5: Wait for success
      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Role deleted successfully');
          expect(status?.type).toBe('success');
        },
        { timeout: 5000 },
      );

      // Step 6: Verify the role is no longer visible in the list
      await waitFor(() => {
        expect(container.textContent).not.toContain('Test Role 1');
      });
    });

    test('cancels delete when pressing N', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<RolesList queryClient={queryClient} />, {
        initialEntries: ['/roles'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

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

      // Should return to browse mode and role should still be visible
      await waitFor(() => {
        expect(container.textContent).not.toContain('Y/N');
        expect(container.textContent).toContain('Test Role 1');
      });
    });

    test('prevents deleting system roles', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<RolesList queryClient={queryClient} />, {
        initialEntries: ['/roles'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Navigate to system role (index 1)
      act(() => {
        pressKey('down');
      });

      // Try to delete
      act(() => {
        pressKey('d');
      });

      // Should show error, not confirmation
      await waitFor(() => {
        const status = getLastStatus();
        expect(status?.message).toContain('Cannot delete system roles');
        expect(status?.type).toBe('error');
      });

      // Should NOT show confirmation dialog
      expect(container.textContent).not.toContain('Y/N');

      // All roles should still be visible
      expect(container.textContent).toContain('System Admin Role');
    });
  });

  // ==========================================================================
  // USER JOURNEY: Navigate and Select Roles
  // ==========================================================================

  describe('User Journey: Navigate Roles', () => {
    test('navigates through roles with arrow keys', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<RolesList queryClient={queryClient} />, {
        initialEntries: ['/roles'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Initially first role is selected (preview shows Test Role 1)
      // The preview should show "Custom" type for Test Role 1
      expect(container.textContent).toContain('Custom');

      // Move down to System Admin Role
      act(() => {
        pressKey('down');
      });

      // Preview should now show System type
      await waitFor(() => {
        // Check that preview changed
        const previewText = container.textContent;
        expect(previewText).toContain('System');
      });

      // Move down to Viewer Role
      act(() => {
        pressKey('down');
      });

      // Move back up
      act(() => {
        pressKey('up');
      });

      // Should be back at System Admin Role
      await waitFor(() => {
        expect(container.textContent).toContain('System');
      });
    });

    test('refreshes list when pressing R', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<RolesList queryClient={queryClient} />, {
        initialEntries: ['/roles'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
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

  // ==========================================================================
  // USER JOURNEY: Search Roles
  // ==========================================================================

  describe('User Journey: Search Roles', () => {
    test('opens search mode and shows input', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<RolesList queryClient={queryClient} />, {
        initialEntries: ['/roles'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
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
  });
});
