/**
 * UsersList Component Tests
 *
 * Full end-to-end integration tests for user journeys:
 * - List users and verify data
 * - Search and filter users
 * - Navigate through users
 * - Refresh list
 *
 * Note: UsersList is read-only in CLI (no create/delete - requires browser IT API)
 */

import { beforeEach, describe, expect, test } from 'vitest';
import React from 'react';
import { act, clearLastStatus, createTestQueryClient, getLastStatus, pressKey, render, resetMockData, screen, waitFor } from '../../test-utils';
import { UsersList } from '../UsersList';

describe('UsersList', () => {
  beforeEach(() => {
    resetMockData();
    clearLastStatus();
  });

  // ==========================================================================
  // USER JOURNEY: View Users List
  // ==========================================================================

  describe('User Journey: View Users List', () => {
    test('loads and displays all users from API', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<UsersList queryClient={queryClient} />, {
        initialEntries: ['/users'],
        queryClient,
      });

      // Step 1: Should show loading
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Step 2: Wait for data to load
      await waitFor(
        () => {
          expect(container.textContent).toContain('testuser1');
        },
        { timeout: 5000 },
      );

      // Step 3: Verify all users are displayed
      expect(container.textContent).toContain('testuser1');
      expect(container.textContent).toContain('testuser2');

      // Step 4: Verify status indicators
      expect(container.textContent).toContain('Active');

      // Step 5: Verify admin badge
      expect(container.textContent).toContain('[admin]');
    });

    test('shows preview panel for selected user', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<UsersList queryClient={queryClient} />, {
        initialEntries: ['/users'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('testuser1');
        },
        { timeout: 5000 },
      );

      // Preview panel should show user details
      expect(container.textContent).toContain('Preview');
      expect(container.textContent).toContain('Username');
      expect(container.textContent).toContain('Email');
      expect(container.textContent).toContain('Status');
      expect(container.textContent).toContain('Admin');
    });
  });

  // ==========================================================================
  // USER JOURNEY: Navigate and Select Users
  // ==========================================================================

  describe('User Journey: Navigate Users', () => {
    test('navigates through users with arrow keys', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<UsersList queryClient={queryClient} />, {
        initialEntries: ['/users'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('testuser1');
        },
        { timeout: 5000 },
      );

      // Move down to second user
      act(() => {
        pressKey('down');
      });

      // Preview should now show testuser2 details (is_org_admin: true)
      await waitFor(() => {
        // The admin user should now be selected
        expect(container.textContent).toContain('testuser2');
      });

      // Move back up
      act(() => {
        pressKey('up');
      });

      // Should still see both users
      expect(container.textContent).toContain('testuser1');
      expect(container.textContent).toContain('testuser2');
    });

    test('refreshes list when pressing R', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<UsersList queryClient={queryClient} />, {
        initialEntries: ['/users'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('testuser1');
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
  // USER JOURNEY: Search Users
  // ==========================================================================

  describe('User Journey: Search Users', () => {
    test('opens search mode and shows input', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<UsersList queryClient={queryClient} />, {
        initialEntries: ['/users'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('testuser1');
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

    test('cancels search with escape', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<UsersList queryClient={queryClient} />, {
        initialEntries: ['/users'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('testuser1');
        },
        { timeout: 5000 },
      );

      // Open search
      act(() => {
        pressKey('/');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Search');
      });

      // Cancel with escape
      act(() => {
        pressKey('escape');
      });

      // Should be back in browse mode
      await waitFor(() => {
        // The search input should be gone, users should still be visible
        expect(container.textContent).toContain('testuser1');
      });
    });
  });
});
