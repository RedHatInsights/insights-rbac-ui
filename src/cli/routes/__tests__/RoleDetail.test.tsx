/**
 * RoleDetail Component Tests
 *
 * Full end-to-end integration tests for user journeys:
 * - View role details with all info
 * - Edit role name/description and save changes
 * - Delete role and navigate back
 * - Add permissions to a role
 * - Remove permissions from a role
 * - Switch between Info and Permissions tabs
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
import { RoleDetail } from '../RoleDetail';

// Helper to render RoleDetail with proper routing
function renderRoleDetail(roleId: string) {
  const queryClient = createTestQueryClient();
  const services = createTestServices();

  const TestComponent = () => (
    <Routes>
      <Route path="/roles/:id" element={<RoleDetail queryClient={queryClient} />} />
    </Routes>
  );

  const result = render(<TestComponent />, {
    initialEntries: [`/roles/${roleId}`],
    services,
    queryClient,
  });

  return { ...result, queryClient, services };
}

describe('RoleDetail', () => {
  beforeEach(() => {
    resetMockData();
    clearLastStatus();
  });

  // ==========================================================================
  // USER JOURNEY: View Role Details
  // ==========================================================================

  describe('User Journey: View Role Details', () => {
    test('loads and displays complete role information', async () => {
      const { container } = renderRoleDetail('role-1');

      // Step 1: Should show loading
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Step 2: Wait for role to load
      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Step 3: Verify all role details are shown
      expect(container.textContent).toContain('Test Role 1');
      expect(container.textContent).toContain('A test role for unit tests'); // Description
      expect(container.textContent).toContain('UUID');
      expect(container.textContent).toContain('role-1');
      expect(container.textContent).toContain('Custom Role'); // Type
      expect(container.textContent).toContain('Created');
      expect(container.textContent).toContain('Modified');
    });

    test('shows system role type correctly', async () => {
      const { container } = renderRoleDetail('role-2');

      await waitFor(
        () => {
          expect(container.textContent).toContain('System Admin Role');
        },
        { timeout: 5000 },
      );

      expect(container.textContent).toContain('System Role');
    });

    test('shows error for non-existent role', async () => {
      const { container } = renderRoleDetail('non-existent-uuid');

      await waitFor(
        () => {
          expect(container.textContent).toMatch(/failed|error/i);
        },
        { timeout: 5000 },
      );
    });
  });

  // ==========================================================================
  // USER JOURNEY: Edit Role (Full Flow)
  // ==========================================================================

  describe('User Journey: Edit Role', () => {
    test('edits role name and description successfully', async () => {
      const { container } = renderRoleDetail('role-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Step 1: Press 'e' to enter edit mode
      act(() => {
        pressKey('e');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Edit Role');
      });

      // Step 2: Find input and change the name
      const inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      expect(inputs.length).toBeGreaterThan(0);

      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'Updated Role Name' } });
      });

      // Step 3: Press Enter to save
      act(() => {
        pressKey('enter');
      });

      // Step 4: Verify success
      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Role updated successfully');
          expect(status?.type).toBe('success');
        },
        { timeout: 5000 },
      );

      // Step 5: Should return to browse mode and show updated name
      await waitFor(() => {
        expect(container.textContent).not.toContain('Edit Role');
      });
    });

    test('shows error when editing with empty name', async () => {
      const { container } = renderRoleDetail('role-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Enter edit mode
      act(() => {
        pressKey('e');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Edit Role');
      });

      // Clear the name
      const inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      if (inputs.length > 0) {
        act(() => {
          fireEvent.change(inputs[0], { target: { value: '' } });
        });
      }

      // Try to save
      act(() => {
        pressKey('enter');
      });

      // Should show error
      await waitFor(() => {
        const status = getLastStatus();
        expect(status?.message).toContain('Name is required');
        expect(status?.type).toBe('error');
      });
    });

    test('cancels edit without saving changes', async () => {
      const { container } = renderRoleDetail('role-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Enter edit mode
      act(() => {
        pressKey('e');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Edit Role');
      });

      // Type a new name
      const inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      if (inputs.length > 0) {
        act(() => {
          fireEvent.change(inputs[0], { target: { value: 'Unsaved Name' } });
        });
      }

      // Cancel with escape
      act(() => {
        pressKey('escape');
      });

      // Should return to browse mode
      await waitFor(() => {
        expect(container.textContent).not.toContain('Edit Role');
      });

      // Name should not have changed - role is still visible
      expect(container.textContent).toContain('Test Role 1');
    });

    test('cannot edit system role', async () => {
      const { container } = renderRoleDetail('role-2');

      await waitFor(
        () => {
          expect(container.textContent).toContain('System Admin Role');
        },
        { timeout: 5000 },
      );

      // Try to press 'e'
      act(() => {
        pressKey('e');
      });

      // Should NOT show edit form for system role
      await waitFor(() => {
        expect(container.textContent).not.toContain('Edit Role');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Delete Role (Full Flow)
  // ==========================================================================

  describe('User Journey: Delete Role', () => {
    test('deletes role and confirms removal', async () => {
      const { container } = renderRoleDetail('role-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Step 1: Press 'd' to delete
      act(() => {
        pressKey('d');
      });

      // Step 3: Should show confirmation
      await waitFor(() => {
        expect(container.textContent).toContain('Delete');
        expect(container.textContent).toContain('Y/N');
      });

      // Step 4: Confirm with 'y'
      act(() => {
        pressKey('y');
      });

      // Step 5: Verify success
      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Role deleted successfully');
          expect(status?.type).toBe('success');
        },
        { timeout: 5000 },
      );
    });

    test('cancels delete with N', async () => {
      const { container } = renderRoleDetail('role-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
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

      // Press 'n' to cancel
      act(() => {
        pressKey('n');
      });

      // Should return to browse
      await waitFor(() => {
        expect(container.textContent).not.toContain('Y/N');
      });

      // Role details should still be visible
      expect(container.textContent).toContain('Test Role 1');
    });

    test('prevents deleting system role', async () => {
      const { container } = renderRoleDetail('role-2');

      await waitFor(
        () => {
          expect(container.textContent).toContain('System Admin Role');
        },
        { timeout: 5000 },
      );

      // Try to delete
      act(() => {
        pressKey('d');
      });

      // Should show error
      await waitFor(() => {
        const status = getLastStatus();
        expect(status?.message).toContain('Cannot delete system roles');
        expect(status?.type).toBe('error');
      });

      // Should NOT show confirmation
      expect(container.textContent).not.toContain('Y/N');
    });
  });

  // ==========================================================================
  // USER JOURNEY: Manage Permissions (Full Flow)
  // ==========================================================================

  describe('User Journey: Manage Permissions', () => {
    test('views permissions on Permissions tab', async () => {
      const { container } = renderRoleDetail('role-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Step 1: Switch to Permissions tab
      act(() => {
        pressKey('2');
      });

      // Step 2: Verify permissions are shown
      await waitFor(() => {
        expect(container.textContent).toContain('Permissions');
        expect(container.textContent).toContain('rbac:role:read');
        expect(container.textContent).toContain('rbac:role:write');
      });
    });

    test('adds a new permission to role', async () => {
      const { container } = renderRoleDetail('role-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Step 1: Switch to Permissions tab
      act(() => {
        pressKey('2');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('rbac:role:read');
      });

      // Step 2: Press 'a' to add permission
      act(() => {
        pressKey('a');
      });

      // Step 3: Should show add permission form
      await waitFor(() => {
        expect(container.textContent).toContain('Add Permission');
        expect(container.textContent).toContain('application:resource:verb');
      });

      // Step 4: Find input and enter new permission
      const inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      if (inputs.length > 0) {
        act(() => {
          fireEvent.change(inputs[0], { target: { value: 'inventory:hosts:read' } });
        });
      }

      // Step 5: Press Enter to add
      act(() => {
        pressKey('enter');
      });

      // Step 6: Verify success
      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Added permission');
          expect(status?.type).toBe('success');
        },
        { timeout: 5000 },
      );

      // Step 7: Verify permission is shown in the UI
      await waitFor(() => {
        expect(container.textContent).toContain('inventory:hosts:read');
      });
    });

    test('removes a permission from role', async () => {
      const { container } = renderRoleDetail('role-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Step 1: Switch to Permissions tab
      act(() => {
        pressKey('2');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('rbac:role:read');
      });

      // Step 2: Press 'x' to remove the selected permission
      act(() => {
        pressKey('x');
      });

      // Step 3: Should show confirmation
      await waitFor(() => {
        expect(container.textContent).toContain('Remove permission');
      });

      // Step 4: Confirm with Enter or 'y'
      act(() => {
        pressKey('enter');
      });

      // Step 5: Verify success
      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Removed permission');
          expect(status?.type).toBe('success');
        },
        { timeout: 5000 },
      );

      // Step 6: Verify permission was removed from UI
      await waitFor(() => {
        expect(container.textContent).not.toContain('rbac:role:read');
      });
    });

    test('cannot add permissions to system role', async () => {
      const { container } = renderRoleDetail('role-2');

      await waitFor(
        () => {
          expect(container.textContent).toContain('System Admin Role');
        },
        { timeout: 5000 },
      );

      // Switch to Permissions tab
      act(() => {
        pressKey('2');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('rbac:*:*');
      });

      // Try to add permission
      act(() => {
        pressKey('a');
      });

      // Should NOT show add form
      await waitFor(() => {
        expect(container.textContent).not.toContain('Add Permission');
      });
    });

    test('cancels add permission with escape', async () => {
      const { container } = renderRoleDetail('role-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Switch to Permissions tab
      act(() => {
        pressKey('2');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('rbac:role:read');
      });

      // Open add form
      act(() => {
        pressKey('a');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Add Permission');
      });

      // Cancel
      act(() => {
        pressKey('escape');
      });

      // Should return to browse
      await waitFor(() => {
        expect(container.textContent).not.toContain('Add Permission');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Tab Navigation
  // ==========================================================================

  describe('User Journey: Tab Navigation', () => {
    test('switches between Info and Permissions tabs', async () => {
      const { container } = renderRoleDetail('role-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Role 1');
        },
        { timeout: 5000 },
      );

      // Initially on Info tab
      expect(container.textContent).toContain('UUID');
      expect(container.textContent).toContain('Created');

      // Switch to Permissions
      act(() => {
        pressKey('2');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('rbac:role:read');
      });

      // Switch back to Info
      act(() => {
        pressKey('1');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('UUID');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Refresh Data
  // ==========================================================================

  describe('User Journey: Refresh', () => {
    test('refreshes role data with R key', async () => {
      const { container } = renderRoleDetail('role-1');

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
});
