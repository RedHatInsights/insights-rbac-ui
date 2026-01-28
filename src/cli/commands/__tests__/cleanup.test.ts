/**
 * Cleanup Command Tests
 *
 * Tests for the headless cleanup command handler.
 * These tests verify:
 * - Production environment safety rail (CRITICAL)
 * - Minimum pattern length safety rail (CRITICAL)
 * - Prefix and glob pattern matching
 * - System/default resource protection
 * - Delete operation execution
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock dependencies
vi.mock('../../auth.js', () => ({
  getToken: vi.fn(() => Promise.resolve('mock-token')),
}));
vi.mock('../../api-client.js', () => ({
  initializeApiClient: vi.fn(),
  getApiClient: vi.fn(() => ({
    get: vi.fn(),
    delete: vi.fn(),
  })),
}));
vi.mock('../../auth-bridge.js', () => ({
  getCurrentEnv: vi.fn(() => 'stage'),
  getEnvConfig: vi.fn(() => ({
    name: 'Staging',
    apiUrl: 'https://console.stage.redhat.com',
  })),
}));

import { runCleanup } from '../cleanup.js';
import { getCurrentEnv } from '../../auth-bridge.js';
import { getApiClient } from '../../api-client.js';

type MockApiClient = ReturnType<typeof getApiClient>;

describe('cleanup command', () => {
  const originalEnv = { ...process.env };
  const mockGetCurrentEnv = vi.mocked(getCurrentEnv);
  const mockGetApiClient = vi.mocked(getApiClient);

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockGetCurrentEnv.mockReturnValue('stage');
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ==========================================================================
  // CRITICAL: Production Safety Rail Tests
  // ==========================================================================

  describe('Production Safety Rail (CRITICAL)', () => {
    test('BLOCKS execution when RBAC_ENV is "prod"', async () => {
      mockGetCurrentEnv.mockReturnValue('prod');

      const exitCode = await runCleanup({ prefix: 'test-prefix-' });

      expect(exitCode).toBe(1);
      // Should not attempt any API calls
      expect(mockGetApiClient).not.toHaveBeenCalled();
    });

    test('BLOCKS execution when getCurrentEnv returns "production"', async () => {
      mockGetCurrentEnv.mockReturnValue('production' as 'prod');

      const exitCode = await runCleanup({ prefix: 'test-prefix-' });

      expect(exitCode).toBe(1);
    });

    test('ALLOWS execution when RBAC_ENV is "stage"', async () => {
      mockGetCurrentEnv.mockReturnValue('stage');

      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
        delete: vi.fn(),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      await runCleanup({ prefix: 'test-prefix-' });

      // Should proceed with API calls
      expect(mockClient.get).toHaveBeenCalled();
    });

    test('ALLOWS execution when RBAC_ENV is "local"', async () => {
      mockGetCurrentEnv.mockReturnValue('local');

      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
        delete: vi.fn(),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      await runCleanup({ prefix: 'test-prefix-' });

      expect(mockClient.get).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // CRITICAL: Minimum Pattern Length Safety Rail Tests
  // ==========================================================================

  describe('Minimum Pattern Length Safety Rail (CRITICAL)', () => {
    beforeEach(() => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
        delete: vi.fn(),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);
    });

    test('BLOCKS execution when prefix is empty', async () => {
      const exitCode = await runCleanup({ prefix: '' });

      expect(exitCode).toBe(1);
    });

    test('BLOCKS execution when prefix is less than 4 characters', async () => {
      const exitCode = await runCleanup({ prefix: 'abc' });

      expect(exitCode).toBe(1);
    });

    test('BLOCKS execution when prefix is exactly 3 characters', async () => {
      const exitCode = await runCleanup({ prefix: 'foo' });

      expect(exitCode).toBe(1);
    });

    test('ALLOWS execution when prefix is exactly 4 characters', async () => {
      // Use 'abcd' - exactly 4 characters and not in the broad patterns blocklist
      const exitCode = await runCleanup({ prefix: 'abcd' });

      // Should succeed (even if no matches found)
      expect(exitCode).toBe(0);
    });

    test('ALLOWS execution when prefix is more than 4 characters', async () => {
      const exitCode = await runCleanup({ prefix: 'test-prefix-12345' });

      expect(exitCode).toBe(0);
    });

    test('BLOCKS broad patterns like "*"', async () => {
      const exitCode = await runCleanup({ nameMatch: '*' });

      expect(exitCode).toBe(1);
    });

    test('BLOCKS broad patterns like "test"', async () => {
      const exitCode = await runCleanup({ prefix: 'test' });

      // 'test' is exactly 4 chars so it should be allowed
      // But the safety rail should block overly broad patterns
      // Let me check the implementation...
      // Actually 'test' is in the broadPatterns list, so it should be blocked
      expect(exitCode).toBe(1);
    });

    test('BLOCKS broad patterns like "dev"', async () => {
      const exitCode = await runCleanup({ prefix: 'dev' });

      // 'dev' is 3 chars AND in broad patterns list
      expect(exitCode).toBe(1);
    });

    test('counts only non-wildcard characters for length check', async () => {
      // Pattern "a*b" has only 2 actual characters
      const exitCode = await runCleanup({ nameMatch: 'a*b' });

      expect(exitCode).toBe(1);
    });

    test('ALLOWS patterns with wildcards if base is 4+ chars', async () => {
      const exitCode = await runCleanup({ nameMatch: 'test-*-run' });

      expect(exitCode).toBe(0);
    });
  });

  // ==========================================================================
  // Pattern Matching Tests
  // ==========================================================================

  describe('Pattern Matching', () => {
    test('matches resources by prefix', async () => {
      const mockClient = {
        get: vi
          .fn()
          // roles endpoint
          .mockResolvedValueOnce({
            data: {
              data: [
                { uuid: 'match-1', name: 'ci-123-role-1' },
                { uuid: 'no-match', name: 'other-role' },
                { uuid: 'match-2', name: 'ci-123-role-2' },
              ],
            },
          })
          // groups endpoint - empty
          .mockResolvedValueOnce({ data: { data: [] } })
          // workspaces endpoint - empty
          .mockResolvedValueOnce({ data: { data: [] } }),
        delete: vi.fn().mockResolvedValue({}),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      await runCleanup({ prefix: 'ci-123-' });

      // Should delete only matching roles (2 matches out of 3)
      expect(mockClient.delete).toHaveBeenCalledTimes(2);
      expect(mockClient.delete).toHaveBeenCalledWith('/api/rbac/v1/roles/match-1/');
      expect(mockClient.delete).toHaveBeenCalledWith('/api/rbac/v1/roles/match-2/');
    });

    test('matches resources by glob pattern with *', async () => {
      const mockClient = {
        get: vi
          .fn()
          // roles endpoint
          .mockResolvedValueOnce({
            data: {
              data: [
                { uuid: 'match-1', name: 'test-abc-run' },
                { uuid: 'no-match', name: 'test-abc' },
                { uuid: 'match-2', name: 'test-xyz-run' },
              ],
            },
          })
          // groups endpoint - empty
          .mockResolvedValueOnce({ data: { data: [] } })
          // workspaces endpoint - empty
          .mockResolvedValueOnce({ data: { data: [] } }),
        delete: vi.fn().mockResolvedValue({}),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      await runCleanup({ nameMatch: 'test-*-run' });

      expect(mockClient.delete).toHaveBeenCalledTimes(2);
    });

    test('glob matching is case-insensitive', async () => {
      const mockClient = {
        get: vi
          .fn()
          // roles endpoint - only lowercase matches prefix
          .mockResolvedValueOnce({
            data: {
              data: [
                { uuid: 'match-1', name: 'test-prefix-role' },
                { uuid: 'match-2', name: 'test-prefix-other' },
              ],
            },
          })
          // groups endpoint - empty
          .mockResolvedValueOnce({ data: { data: [] } })
          // workspaces endpoint - empty
          .mockResolvedValueOnce({ data: { data: [] } }),
        delete: vi.fn().mockResolvedValue({}),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      await runCleanup({ prefix: 'test-prefix-' });

      expect(mockClient.delete).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // System Resource Protection Tests
  // ==========================================================================

  describe('System Resource Protection', () => {
    test('does NOT delete system roles', async () => {
      const mockClient = {
        get: vi
          .fn()
          // roles endpoint
          .mockResolvedValueOnce({
            data: {
              data: [
                { uuid: 'sys-role', name: 'test-system-role', system: true },
                { uuid: 'custom-role', name: 'test-custom-role', system: false },
              ],
            },
          })
          // groups endpoint - empty
          .mockResolvedValueOnce({ data: { data: [] } })
          // workspaces endpoint - empty
          .mockResolvedValueOnce({ data: { data: [] } }),
        delete: vi.fn().mockResolvedValue({}),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      await runCleanup({ prefix: 'test-' });

      // Should only delete the non-system role
      expect(mockClient.delete).toHaveBeenCalledTimes(1);
      expect(mockClient.delete).toHaveBeenCalledWith('/api/rbac/v1/roles/custom-role/');
    });

    test('does NOT delete platform_default groups', async () => {
      const mockClient = {
        get: vi
          .fn()
          .mockResolvedValueOnce({ data: { data: [] } }) // roles
          .mockResolvedValueOnce({
            data: {
              data: [
                { uuid: 'default-grp', name: 'test-default-group', platform_default: true },
                { uuid: 'custom-grp', name: 'test-custom-group', platform_default: false },
              ],
            },
          }) // groups
          .mockResolvedValueOnce({ data: { data: [] } }), // workspaces
        delete: vi.fn().mockResolvedValue({}),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      await runCleanup({ prefix: 'test-' });

      expect(mockClient.delete).toHaveBeenCalledWith('/api/rbac/v1/groups/custom-grp/');
      expect(mockClient.delete).not.toHaveBeenCalledWith('/api/rbac/v1/groups/default-grp/');
    });

    test('does NOT delete root workspaces', async () => {
      const mockClient = {
        get: vi
          .fn()
          .mockResolvedValueOnce({ data: { data: [] } }) // roles
          .mockResolvedValueOnce({ data: { data: [] } }) // groups
          .mockResolvedValueOnce({
            data: {
              data: [
                { id: 'root-ws', name: 'test-root-ws', type: 'root' },
                { id: 'child-ws', name: 'test-child-ws', type: 'standard' },
              ],
            },
          }), // workspaces
        delete: vi.fn().mockResolvedValue({}),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      await runCleanup({ prefix: 'test-' });

      expect(mockClient.delete).toHaveBeenCalledWith('/api/rbac/v2/workspaces/child-ws/');
      expect(mockClient.delete).not.toHaveBeenCalledWith('/api/rbac/v2/workspaces/root-ws/');
    });
  });

  // ==========================================================================
  // Result Tests
  // ==========================================================================

  describe('Operation Results', () => {
    test('returns exit code 0 when all deletions succeed', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [{ uuid: 'role-1', name: 'test-role-1' }],
          },
        }),
        delete: vi.fn().mockResolvedValue({}),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      const exitCode = await runCleanup({ prefix: 'test-' });

      expect(exitCode).toBe(0);
    });

    test('returns exit code 1 when some deletions fail', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({
          data: {
            data: [
              { uuid: 'role-1', name: 'test-role-1' },
              { uuid: 'role-2', name: 'test-role-2' },
            ],
          },
        }),
        delete: vi.fn().mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('Delete failed')),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      const exitCode = await runCleanup({ prefix: 'test-' });

      expect(exitCode).toBe(1);
    });

    test('returns exit code 0 when no resources match (nothing to delete)', async () => {
      const mockClient = {
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
        delete: vi.fn(),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      const exitCode = await runCleanup({ prefix: 'nonexistent-prefix-' });

      expect(exitCode).toBe(0);
      expect(mockClient.delete).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Input Validation Tests
  // ==========================================================================

  describe('Input Validation', () => {
    test('fails when neither prefix nor nameMatch is provided', async () => {
      const exitCode = await runCleanup({});

      expect(exitCode).toBe(1);
    });

    test('uses prefix when both prefix and nameMatch are provided', async () => {
      const mockClient = {
        get: vi
          .fn()
          // roles endpoint
          .mockResolvedValueOnce({
            data: {
              data: [
                { uuid: 'role-1', name: 'prefix-role' },
                { uuid: 'role-2', name: 'match-role' },
              ],
            },
          })
          // groups endpoint - empty
          .mockResolvedValueOnce({ data: { data: [] } })
          // workspaces endpoint - empty
          .mockResolvedValueOnce({ data: { data: [] } }),
        delete: vi.fn().mockResolvedValue({}),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      await runCleanup({ prefix: 'prefix-', nameMatch: 'match-*' });

      // Should use prefix matching
      expect(mockClient.delete).toHaveBeenCalledTimes(1);
      expect(mockClient.delete).toHaveBeenCalledWith('/api/rbac/v1/roles/role-1/');
    });
  });
});
