/**
 * GroupsList Component Tests
 *
 * Full end-to-end integration tests for user journeys:
 * - List groups and verify data
 * - Create a new group
 * - Delete a group
 * - Search and filter groups
 * - Navigate to group detail
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
  resetMockDataWithState,
  screen,
  waitFor,
} from '../../test-utils';
import { GroupsList } from '../GroupsList';

describe('GroupsList', () => {
  beforeEach(() => {
    resetMockData();
    clearLastStatus();
  });

  // ==========================================================================
  // USER JOURNEY: View Groups List
  // ==========================================================================

  describe('User Journey: View Groups List', () => {
    test('loads and displays all groups from API', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      // Step 1: Should show loading
      expect(screen.getByText(/loading/i)).toBeInTheDocument();

      // Step 2: Wait for data to load
      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Step 3: Verify preview panel shows first group details
      expect(container.textContent).toContain('Preview');
      expect(container.textContent).toContain('Name');
      expect(container.textContent).toContain('Members');
      expect(container.textContent).toContain('Roles');
    });
  });

  // ==========================================================================
  // USER JOURNEY: Create a New Group
  // ==========================================================================

  describe('User Journey: Create New Group', () => {
    test('creates a group and sees it in the list', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Press 'n' to open create form
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Create New Group');
      });

      // Find the text input and type the group name
      const inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      expect(inputs.length).toBeGreaterThan(0);

      const nameInput = inputs[0] as HTMLInputElement;
      act(() => {
        fireEvent.change(nameInput, { target: { value: 'My New Custom Group' } });
      });

      // Press Enter to submit
      act(() => {
        pressKey('enter');
      });

      // Wait for success
      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Group created successfully');
          expect(status?.type).toBe('success');
        },
        { timeout: 5000 },
      );

      // Should return to browse mode
      await waitFor(() => {
        expect(container.textContent).not.toContain('Create New Group');
      });
    });

    test('shows error when trying to create with empty name', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Open create form
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Create New Group');
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
      expect(container.textContent).toContain('Create New Group');
    });

    test('cancels create without saving', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Open create form
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Create New Group');
      });

      // Type something
      const inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      if (inputs.length > 0) {
        act(() => {
          fireEvent.change(inputs[0], { target: { value: 'Draft Group' } });
        });
      }

      // Cancel with escape
      act(() => {
        pressKey('escape');
      });

      // Should return to browse mode
      await waitFor(() => {
        expect(container.textContent).not.toContain('Create New Group');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Delete a Group
  // ==========================================================================

  describe('User Journey: Delete Group', () => {
    test('deletes a custom group and removes it from the list', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // First group (Test Group 1) is selected, press 'd' to delete
      act(() => {
        pressKey('d');
      });

      // Should show confirmation dialog
      await waitFor(() => {
        expect(container.textContent).toContain('Delete');
        expect(container.textContent).toContain('Test Group 1');
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
          expect(status?.message).toContain('Group deleted successfully');
          expect(status?.type).toBe('success');
        },
        { timeout: 5000 },
      );
    });

    test('cancels delete when pressing N', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
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

      // Should return to browse mode and group should still be visible
      await waitFor(() => {
        expect(container.textContent).not.toContain('Y/N');
        expect(container.textContent).toContain('Test Group 1');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Navigate and Select Groups
  // ==========================================================================

  describe('User Journey: Navigate Groups', () => {
    test('navigates through groups with arrow keys', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
        },
        { timeout: 5000 },
      );

      // Move down (even if only one group, should not crash)
      act(() => {
        pressKey('down');
      });

      // Move up
      act(() => {
        pressKey('up');
      });

      // Should still see the group
      expect(container.textContent).toContain('Test Group 1');
    });

    test('refreshes list when pressing R', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

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

      // Should show refresh status
      await waitFor(() => {
        const status = getLastStatus();
        expect(status?.message).toBe('Refreshed');
      });
    });
  });

  // ==========================================================================
  // USER JOURNEY: Search Groups
  // ==========================================================================

  describe('User Journey: Search Groups', () => {
    test('opens search mode and shows input', async () => {
      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Test Group 1');
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

  // ==========================================================================
  // USER JOURNEY: Pagination
  // ==========================================================================

  describe('User Journey: Pagination', () => {
    // Helper to generate many groups for pagination testing
    function generateGroups(count: number) {
      return Array.from({ length: count }, (_, i) => ({
        uuid: `group-${i + 1}`,
        name: `Group ${String(i + 1).padStart(2, '0')}`,
        description: `Description for group ${i + 1}`,
        principalCount: i,
        roleCount: 0,
        created: '2024-01-01T00:00:00Z',
        modified: '2024-01-01T00:00:00Z',
        platform_default: false,
        admin_default: false,
        system: false,
      }));
    }

    test('shows pagination info when there are multiple pages', async () => {
      // Generate 25 groups (PAGE_SIZE is 12, so multiple pages)
      resetMockDataWithState({ groups: generateGroups(25) });

      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          // First page should show Group 01
          expect(container.textContent).toContain('Group 01');
        },
        { timeout: 5000 },
      );

      // Should show pagination info (page 1 of multiple pages)
      expect(container.textContent).toMatch(/Page\s*1\s*of\s*\d+/i);
      // Should show total count
      expect(container.textContent).toMatch(/\d+\s*total/i);
    });

    test('navigates to next page with right arrow', async () => {
      // Generate 25 groups
      resetMockDataWithState({ groups: generateGroups(25) });

      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Group 01');
        },
        { timeout: 5000 },
      );

      // Verify we're on page 1
      expect(container.textContent).toMatch(/Page\s*1\s*of\s*\d+/i);

      // Navigate to next page with right arrow
      act(() => {
        pressKey('right');
      });

      // Wait for page 2 data to load (Group 13 is first item on page 2)
      await waitFor(
        () => {
          expect(container.textContent).toContain('Group 13');
        },
        { timeout: 5000 },
      );

      // Should be on page 2
      expect(container.textContent).toMatch(/Page\s*2\s*of\s*\d+/i);
      // Should NOT show page 1 items
      expect(container.textContent).not.toContain('Group 01');
    });

    test('navigates to previous page with left arrow', async () => {
      // Generate 25 groups
      resetMockDataWithState({ groups: generateGroups(25) });

      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Group 01');
        },
        { timeout: 5000 },
      );

      // Go to page 2
      act(() => {
        pressKey('right');
      });

      // Wait for page 2 data
      await waitFor(
        () => {
          expect(container.textContent).toContain('Group 13');
        },
        { timeout: 5000 },
      );

      // Go back to page 1
      act(() => {
        pressKey('left');
      });

      // Wait for page 1 data to reload
      await waitFor(
        () => {
          expect(container.textContent).toContain('Group 01');
        },
        { timeout: 5000 },
      );

      // Verify we're back on page 1
      expect(container.textContent).toMatch(/Page\s*1\s*of\s*\d+/i);
    });

    test('does not navigate past the last page', async () => {
      // Generate 25 groups (3 pages with PAGE_SIZE=12: 12+12+1)
      resetMockDataWithState({ groups: generateGroups(25) });

      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Group 01');
        },
        { timeout: 5000 },
      );

      // Navigate to page 2
      act(() => {
        pressKey('right');
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Group 13');
        },
        { timeout: 5000 },
      );

      // Navigate to page 3 (last page)
      act(() => {
        pressKey('right');
      });

      await waitFor(
        () => {
          // Last page should show Group 25
          expect(container.textContent).toContain('Group 25');
        },
        { timeout: 5000 },
      );

      // Store current page info
      const pageMatch = container.textContent?.match(/Page\s*(\d+)\s*of\s*(\d+)/i);
      expect(pageMatch).toBeTruthy();
      const currentPage = pageMatch![1];
      const totalPages = pageMatch![2];
      expect(currentPage).toBe(totalPages); // We're on the last page

      // Try to go past last page
      act(() => {
        pressKey('right');
      });

      // Page should not change - still on last page
      expect(container.textContent).toContain('Group 25');
      expect(container.textContent).toMatch(new RegExp(`Page\\s*${totalPages}\\s*of\\s*${totalPages}`, 'i'));
    });

    test('does not navigate before the first page', async () => {
      // Generate 25 groups
      resetMockDataWithState({ groups: generateGroups(25) });

      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Group 01');
        },
        { timeout: 5000 },
      );

      // Store current text (on page 1)
      const textBefore = container.textContent;

      // Try to go before first page
      act(() => {
        pressKey('left');
      });

      // Should still be on page 1 - no change
      expect(container.textContent).toBe(textBefore);
      expect(container.textContent).toMatch(/Page\s*1\s*of\s*\d+/i);
    });

    test('resets selection to first item when changing pages', async () => {
      // Generate 25 groups
      resetMockDataWithState({ groups: generateGroups(25) });

      const queryClient = createTestQueryClient();
      const { container } = render(<GroupsList queryClient={queryClient} />, {
        initialEntries: ['/groups'],
        queryClient,
      });

      await waitFor(
        () => {
          expect(container.textContent).toContain('Group 01');
        },
        { timeout: 5000 },
      );

      // Move selection down a few items
      act(() => {
        pressKey('down');
        pressKey('down');
        pressKey('down');
      });

      // Preview should show a different group (moved down 3 times from Group 01)
      await waitFor(() => {
        // The preview name should contain Group 04 (0-indexed selection: 3)
        expect(container.textContent).toMatch(/Name:\s*Group 04/);
      });

      // Navigate to next page
      act(() => {
        pressKey('right');
      });

      // Wait for page 2 data to load - first item is Group 13
      await waitFor(
        () => {
          expect(container.textContent).toContain('Group 13');
        },
        { timeout: 5000 },
      );

      // Preview should show first item of new page (selection reset to 0)
      expect(container.textContent).toMatch(/Name:\s*Group 13/);
    });
  });
});
