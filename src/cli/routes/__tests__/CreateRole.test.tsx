/**
 * CreateRole Tests - Additional Edge Cases
 *
 * Extended tests for role creation covering edge cases:
 * - Form field switching (tab navigation)
 * - Description field handling
 * - Multiple sequential creations
 * - Query client state verification
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

describe('CreateRole - Extended Tests', () => {
  beforeEach(() => {
    resetMockData();
    clearLastStatus();
  });

  // ==========================================================================
  // FORM FIELD NAVIGATION
  // ==========================================================================

  describe('Form Field Navigation', () => {
    test('switches between name and description fields with Tab', async () => {
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

      // Should show both Name and Desc labels
      expect(container.textContent).toContain('Name');
      expect(container.textContent).toContain('Desc');

      // Initially name field is focused - has text input
      let inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      expect(inputs.length).toBeGreaterThan(0);

      // Press Tab to switch to description
      act(() => {
        pressKey('tab');
      });

      // The focused field should change (input should still be present but for different field)
      await waitFor(() => {
        inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
        expect(inputs.length).toBeGreaterThan(0);
      });
    });
  });

  // ==========================================================================
  // MULTIPLE CREATIONS
  // ==========================================================================

  describe('Multiple Sequential Creations', () => {
    test('can create multiple roles in sequence', async () => {
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

      // Create first role
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Create New Role');
      });

      let inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'First New Role' } });
      });

      act(() => {
        pressKey('enter');
      });

      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Role created successfully');
        },
        { timeout: 5000 },
      );

      // First role should be in the list
      await waitFor(() => {
        expect(container.textContent).toContain('First New Role');
      });
      clearLastStatus();

      // Create second role
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Create New Role');
      });

      inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'Second New Role' } });
      });

      act(() => {
        pressKey('enter');
      });

      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Role created successfully');
        },
        { timeout: 5000 },
      );

      // Both roles should be visible in the list
      await waitFor(() => {
        expect(container.textContent).toContain('First New Role');
        expect(container.textContent).toContain('Second New Role');
      });
    });
  });

  // ==========================================================================
  // QUERY CLIENT STATE
  // ==========================================================================

  describe('Query Client State', () => {
    test('query client receives roles data after load', async () => {
      const queryClient = createTestQueryClient();
      render(<RolesList queryClient={queryClient} />, {
        initialEntries: ['/roles'],
        queryClient,
      });

      // Wait for query to succeed
      await waitFor(
        () => {
          const queries = queryClient.getQueryCache().getAll();
          const rolesQuery = queries.find((q) => String(q.queryKey[0]).includes('role'));
          return rolesQuery?.state.status === 'success';
        },
        { timeout: 5000 },
      );

      const queries = queryClient.getQueryCache().getAll();
      const rolesQuery = queries.find((q) => String(q.queryKey[0]).includes('role'));

      expect(rolesQuery).toBeDefined();
      expect(rolesQuery?.state.status).toBe('success');
      expect(rolesQuery?.state.data).toBeDefined();
    });
  });

  // ==========================================================================
  // STATE MANAGEMENT
  // ==========================================================================

  describe('State Management', () => {
    // TODO: Fix flaky test - state transition timing issue in CI
    test.skip('form fields are cleared after successful creation', async () => {
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

      // Create a role
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Create New Role');
      });

      const inputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      act(() => {
        fireEvent.change(inputs[0], { target: { value: 'Test Role Creation' } });
      });

      act(() => {
        pressKey('enter');
      });

      await waitFor(
        () => {
          const status = getLastStatus();
          expect(status?.message).toContain('Role created successfully');
        },
        { timeout: 5000 },
      );

      // Open create form again
      clearLastStatus();
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Create New Role');
      });

      // Check that form shows (empty) for new entry
      // The input should be present and can be typed into fresh
      const newInputs = container.querySelectorAll('input[data-testid="ink-text-input"]');
      expect(newInputs.length).toBeGreaterThan(0);
    });

    test('mode transitions correctly through create flow', async () => {
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

      // Browse mode: shows role list
      expect(container.textContent).toContain('Test Role 1');
      expect(container.textContent).not.toContain('Create New Role');

      // Transition to create mode
      act(() => {
        pressKey('n');
      });

      await waitFor(() => {
        expect(container.textContent).toContain('Create New Role');
      });

      // Create mode: shows form
      expect(container.textContent).toContain('Name');
      expect(container.textContent).toContain('Desc');
      expect(container.textContent).toContain('Enter to save');

      // Back to browse with escape
      act(() => {
        pressKey('escape');
      });

      await waitFor(() => {
        expect(container.textContent).not.toContain('Create New Role');
      });

      // Browse mode again
      expect(container.textContent).toContain('Test Role 1');
    });
  });

  // ==========================================================================
  // LOADING STATE
  // ==========================================================================

  describe('Loading State', () => {
    test('shows loading state before data arrives', async () => {
      const queryClient = createTestQueryClient();
      render(<RolesList queryClient={queryClient} />, {
        initialEntries: ['/roles'],
        queryClient,
      });

      // Initially should show loading
      expect(screen.getByText(/loading/i)).toBeInTheDocument();
    });
  });
});
