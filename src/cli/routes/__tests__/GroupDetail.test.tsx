/**
 * GroupDetail Component Tests
 *
 * Full end-to-end integration tests for user journeys:
 * - View group details
 * - Edit group name/description
 * - Delete group
 * - View and manage members
 * - View and manage roles
 * - Tab navigation
 */

import { beforeEach, describe, expect, test } from 'vitest';
import React from 'react';
import { Route, Routes } from 'react-router-dom';
import {
  act,
  clearLastStatus,
  clearTrackedRequests,
  createTestQueryClient,
  createTestServices,
  expectApiCall,
  fireEvent,
  getLastStatus,
  getRequestsMatching,
  pressKey,
  render,
  resetMockData,
  screen,
  waitFor,
} from '../../test-utils';
import { GroupDetail } from '../GroupDetail';

// Helper to render with proper routing
function renderGroupDetail(groupId: string) {
  const queryClient = createTestQueryClient();
  const services = createTestServices();

  const TestComponent = () => (
    <Routes>
      <Route path="/groups/:id" element={<GroupDetail queryClient={queryClient} />} />
    </Routes>
  );

  const result = render(<TestComponent />, {
    initialEntries: [`/groups/${groupId}`],
    services,
    queryClient,
  });

  return { ...result, queryClient, services };
}

describe('GroupDetail', () => {
  beforeEach(() => {
    resetMockData();
    clearLastStatus();
    clearTrackedRequests();
  });

  // ==========================================================================
  // USER JOURNEY: View Group Details
  // ==========================================================================

  describe('User Journey: View Group Details', () => {
    test('loads and displays complete group information', async () => {
      const { container } = renderGroupDetail('group-1');

      // Should show loading
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Wait for data to load
      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Verify group info is displayed
      expect(container.textContent).toContain('Test Group 1');
      expect(container.textContent).toContain('UUID');
      expect(container.textContent).toContain('Type');
      expect(container.textContent).toContain('Members');
      expect(container.textContent).toContain('Roles');
    });

    test('shows Custom type for non-system groups', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      expect(container.textContent).toContain('Custom');
    });

    test('shows error for non-existent group', async () => {
      const { container } = renderGroupDetail('non-existent-id');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Failed to load group');
        },
        { timeout: 5000 },
      );
    });
  });

  // ==========================================================================
  // USER JOURNEY: Edit Group
  // ==========================================================================

  describe('User Journey: Edit Group', () => {
    test('edits group name and description successfully', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Press 'e' to edit
      act(() => {
        pressKey('e');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Edit Group');
      });

      // Find and update the name input
      const inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      expect(inputs.length).toBeGreaterThan(0);

      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'Updated Group Name' } });
      });

      // Submit
      act(() => {
        pressKey('enter');
      });

      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Group updated successfully');
          expect(status?.type).toBe('success');
        },
        { timeout: 5000 },
      );

      // Verify PUT API was called with correct data
      const putRequests = getRequestsMatching('PUT', '/api/rbac/v1/groups/group-1');
      expect(putRequests.length).toBe(1);
      expect((putRequests[0].body as { name?: string })?.name).toBe('Updated Group Name');
    });

    test('shows error when editing with empty name', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Press 'e' to edit
      act(() => {
        pressKey('e');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Edit Group');
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
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Press 'e' to edit
      act(() => {
        pressKey('e');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Edit Group');
      });

      // Cancel with escape
      act(() => {
        pressKey('escape');
      });

      await waitFor(() => {
        expect(container.textContent).not.toContain('Edit Group');
        expect(container.textContent).toContain('Test Group 1');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Delete Group
  // ==========================================================================

  describe('User Journey: Delete Group', () => {
    test('deletes group and navigates away', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
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
          expect(status?.message).toContain('Group deleted successfully');
          expect(status?.type).toBe('success');
        },
        { timeout: 5000 },
      );

      // Verify DELETE API was called
      expectApiCall('DELETE', '/api/rbac/v1/groups/group-1');
    });

    test('cancels delete with N', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
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
        expect(container.textContent).toContain('Test Group 1');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Tab Navigation
  // ==========================================================================

  describe('User Journey: Tab Navigation', () => {
    test('switches between Info and Members tabs', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Initially on Info tab
      expect(container.textContent).toContain('UUID');

      // Press '2' to switch to Members tab
      act(() => {
        pressKey('2');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Members');
      });

      // Press '3' to switch to Roles tab
      act(() => {
        pressKey('3');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Assigned Roles');
      });

      // Press '1' to go back to Info tab
      act(() => {
        pressKey('1');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('UUID');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Manage Members
  // ==========================================================================

  describe('User Journey: Manage Members', () => {
    test('opens add members mode with A key on Members tab', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Switch to Members tab
      act(() => {
        pressKey('2');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Members');
      });

      // Press 'a' to add member
      act(() => {
        pressKey('a');
      });

      // Should show add member UI
      await waitFor(() => {
        expect(container.textContent).toContain('Add Member');
        expect(container.textContent).toContain('Navigate');
      });
    });

    test('cancels add members with Escape', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Switch to Members tab and open add mode
      act(() => {
        pressKey('2');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Members');
      });

      act(() => {
        pressKey('a');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Add Member');
      });

      // Cancel with escape
      act(() => {
        pressKey('escape');
      });

      // Should return to browse mode
      await waitFor(() => {
        expect(container.textContent).not.toContain('Add Member');
        expect(container.textContent).toContain('Members');
      });
    });

    test('navigates through available users with arrow keys in add mode', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Switch to Members tab
      act(() => {
        pressKey('2');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Members');
      });

      // Open add members mode
      act(() => {
        pressKey('a');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Add Member');
      });

      // Navigate with arrow keys (should not crash)
      act(() => {
        pressKey('down');
      });

      act(() => {
        pressKey('up');
      });

      // Should still be in add mode
      expect(container.textContent).toContain('Add Member');
    });

    test('opens remove member confirmation with X key', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Switch to Members tab
      act(() => {
        pressKey('2');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Members');
        // Wait for members to load (group-1 has testuser1, testuser2)
        expect(container.textContent).toContain('testuser');
      });

      // Press 'x' to remove selected member
      act(() => {
        pressKey('x');
      });

      // Should show confirmation
      await waitFor(() => {
        expect(container.textContent).toContain('Remove');
        expect(container.textContent).toContain('Y/N');
      });
    });

    test('cancels remove member with N', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Switch to Members tab
      act(() => {
        pressKey('2');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('testuser');
      });

      // Open remove confirmation
      act(() => {
        pressKey('x');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Y/N');
      });

      // Cancel
      act(() => {
        pressKey('n');
      });

      // Should return to browse
      await waitFor(() => {
        expect(container.textContent).not.toContain('Y/N');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Manage Roles
  // ==========================================================================

  describe('User Journey: Manage Roles', () => {
    test('opens add roles mode with A key on Roles tab', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Switch to Roles tab
      act(() => {
        pressKey('3');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Assigned Roles');
      });

      // Press 'a' to add role
      act(() => {
        pressKey('a');
      });

      // Should show add role UI
      await waitFor(() => {
        expect(container.textContent).toContain('Add Role');
        expect(container.textContent).toContain('Navigate');
      });
    });

    test('cancels add roles with Escape', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Switch to Roles tab and open add mode
      act(() => {
        pressKey('3');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Assigned Roles');
      });

      act(() => {
        pressKey('a');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Add Role');
      });

      // Cancel with escape
      act(() => {
        pressKey('escape');
      });

      // Should return to browse mode
      await waitFor(() => {
        expect(container.textContent).not.toContain('Add Role');
        expect(container.textContent).toContain('Assigned Roles');
      });
    });

    test('navigates through available roles with arrow keys in add mode', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Switch to Roles tab
      act(() => {
        pressKey('3');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Assigned Roles');
      });

      // Open add roles mode
      act(() => {
        pressKey('a');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Add Role');
      });

      // Navigate with arrow keys
      act(() => {
        pressKey('down');
      });

      act(() => {
        pressKey('up');
      });

      // Should still be in add mode
      expect(container.textContent).toContain('Add Role');
    });

    test('opens remove role confirmation with X key', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Switch to Roles tab
      act(() => {
        pressKey('3');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Assigned Roles');
        // Wait for roles to load (group-1 has Test Role 1)
        expect(container.textContent).toContain('Test Role 1');
      });

      // Press 'x' to remove selected role
      act(() => {
        pressKey('x');
      });

      // Should show confirmation
      await waitFor(() => {
        expect(container.textContent).toContain('Remove role');
        expect(container.textContent).toContain('Y/N');
      });
    });

    test('cancels remove role with N', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Switch to Roles tab
      act(() => {
        pressKey('3');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Test Role 1');
      });

      // Open remove confirmation
      act(() => {
        pressKey('x');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Y/N');
      });

      // Cancel
      act(() => {
        pressKey('n');
      });

      // Should return to browse
      await waitFor(() => {
        expect(container.textContent).not.toContain('Y/N');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Refresh
  // ==========================================================================

  describe('User Journey: Refresh', () => {
    test('refreshes group data with R key', async () => {
      const { container } = renderGroupDetail('group-1');

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
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
