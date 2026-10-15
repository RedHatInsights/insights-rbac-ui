/**
 * Cleanup Command Tests
 *
 * Tests for the headless cleanup command handler.
 * These tests verify:
 * - Production environment safety rail (CRITICAL)
 * - Minimum pattern length safety rail (CRITICAL)
 * - Prefix and glob pattern matching
 * - System/default resource protection
 * - Delete operation execution via typed API clients
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Mock dependencies
vi.mock('../../auth.js', () => ({
  getToken: vi.fn(() => Promise.resolve('mock-token')),
}));
vi.mock('../../api-client.js', () => ({
  initializeApiClient: vi.fn(),
  getApiClient: vi.fn(() => ({})),
}));
vi.mock('../../auth-bridge.js', () => ({
  getCurrentEnv: vi.fn(() => 'stage'),
  getEnvConfig: vi.fn(() => ({
    name: 'Staging',
    apiUrl: 'https://console.stage.redhat.com',
  })),
}));

// Mock typed API client factories
const mockRolesApi = {
  listRoles: vi.fn(),
  deleteRole: vi.fn(),
};
const mockRolesV2Api = {
  rolesList: vi.fn(),
  rolesBatchDelete: vi.fn(),
};
const mockGroupsApi = {
  listGroups: vi.fn(),
  deleteGroup: vi.fn(),
};
const mockWorkspacesApi = {
  listWorkspaces: vi.fn(),
  deleteWorkspace: vi.fn(),
};

vi.mock('../../queries.js', () => ({
  createRolesApi: vi.fn(() => mockRolesApi),
  createRolesV2Api: vi.fn(() => mockRolesV2Api),
  createGroupsApi: vi.fn(() => mockGroupsApi),
  createWorkspacesApi: vi.fn(() => mockWorkspacesApi),
}));

import { runCleanup } from '../cleanup.js';
import { getCurrentEnv } from '../../auth-bridge.js';
import { getApiClient } from '../../api-client.js';

describe('cleanup command', () => {
  const originalEnv = { ...process.env };
  const mockGetCurrentEnv = vi.mocked(getCurrentEnv);
  const mockGetApiClient = vi.mocked(getApiClient);

  /** Set all API list calls to return empty data by default. */
  function setEmptyApiDefaults() {
    mockRolesApi.listRoles.mockResolvedValue({ data: { data: [] } });
    mockRolesV2Api.rolesList.mockResolvedValue({ data: { data: [] } });
    mockGroupsApi.listGroups.mockResolvedValue({ data: { data: [] } });
    mockWorkspacesApi.listWorkspaces.mockResolvedValue({ data: { data: [] } });
    mockRolesApi.deleteRole.mockResolvedValue({});
    mockRolesV2Api.rolesBatchDelete.mockResolvedValue({});
    mockGroupsApi.deleteGroup.mockResolvedValue({});
    mockWorkspacesApi.deleteWorkspace.mockResolvedValue({});
  }

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockGetCurrentEnv.mockReturnValue('stage');
    mockGetApiClient.mockReturnValue({} as ReturnType<typeof getApiClient>);
    setEmptyApiDefaults();
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
      expect(mockGetApiClient).not.toHaveBeenCalled();
    });

    test('BLOCKS execution when getCurrentEnv returns "production"', async () => {
      mockGetCurrentEnv.mockReturnValue('production' as 'prod');

      const exitCode = await runCleanup({ prefix: 'test-prefix-' });

      expect(exitCode).toBe(1);
    });

    test('ALLOWS execution when RBAC_ENV is "stage"', async () => {
      mockGetCurrentEnv.mockReturnValue('stage');

      await runCleanup({ prefix: 'test-prefix-' });

      expect(mockRolesApi.listRoles).toHaveBeenCalled();
    });

    test('ALLOWS execution when RBAC_ENV is "local"', async () => {
      mockGetCurrentEnv.mockReturnValue('local');

      await runCleanup({ prefix: 'test-prefix-' });

      expect(mockRolesApi.listRoles).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // CRITICAL: Minimum Pattern Length Safety Rail Tests
  // ==========================================================================

  describe('Minimum Pattern Length Safety Rail (CRITICAL)', () => {
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
      const exitCode = await runCleanup({ prefix: 'abcd' });
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
      expect(exitCode).toBe(1);
    });

    test('BLOCKS broad patterns like "dev"', async () => {
      const exitCode = await runCleanup({ prefix: 'dev' });
      expect(exitCode).toBe(1);
    });

    test('counts only non-wildcard characters for length check', async () => {
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
    test('matches V1 resources by prefix', async () => {
      mockRolesApi.listRoles.mockResolvedValue({
        data: {
          data: [
            { uuid: 'match-1', name: 'ci-123-role-1' },
            { uuid: 'no-match', name: 'other-role' },
            { uuid: 'match-2', name: 'ci-123-role-2' },
          ],
        },
      });

      await runCleanup({ prefix: 'ci-123-' });

      expect(mockRolesApi.deleteRole).toHaveBeenCalledTimes(2);
      expect(mockRolesApi.deleteRole).toHaveBeenCalledWith({ uuid: 'match-1' });
      expect(mockRolesApi.deleteRole).toHaveBeenCalledWith({ uuid: 'match-2' });
    });

    test('matches V2 roles by prefix and deletes individually', async () => {
      mockRolesV2Api.rolesList.mockResolvedValue({
        data: {
          data: [
            { id: 'v2-match', name: 'ci-123-v2-role' },
            { id: 'v2-no-match', name: 'other-v2-role' },
          ],
        },
      });

      await runCleanup({ prefix: 'ci-123-' });

      expect(mockRolesApi.deleteRole).not.toHaveBeenCalled();
      expect(mockRolesV2Api.rolesBatchDelete).toHaveBeenCalledTimes(1);
      expect(mockRolesV2Api.rolesBatchDelete).toHaveBeenCalledWith({
        rolesBatchDeleteRolesRequest: { ids: ['v2-match'] },
      });
    });

    test('deduplicates roles visible in both V1 and V2 APIs', async () => {
      mockRolesApi.listRoles.mockResolvedValue({
        data: { data: [{ uuid: 'shared-uuid', name: 'ci-123-shared-role' }] },
      });
      mockRolesV2Api.rolesList.mockResolvedValue({
        data: { data: [{ id: 'v2-id', name: 'ci-123-shared-role' }] },
      });

      await runCleanup({ prefix: 'ci-123-' });

      // V1 wins dedup — V1 individual delete is used
      expect(mockRolesApi.deleteRole).toHaveBeenCalledTimes(1);
      expect(mockRolesApi.deleteRole).toHaveBeenCalledWith({ uuid: 'shared-uuid' });
      expect(mockRolesV2Api.rolesBatchDelete).not.toHaveBeenCalled();
    });

    test('matches resources by glob pattern with *', async () => {
      mockRolesApi.listRoles.mockResolvedValue({
        data: {
          data: [
            { uuid: 'match-1', name: 'test-abc-run' },
            { uuid: 'no-match', name: 'test-abc' },
            { uuid: 'match-2', name: 'test-xyz-run' },
          ],
        },
      });

      await runCleanup({ nameMatch: 'test-*-run' });

      expect(mockRolesApi.deleteRole).toHaveBeenCalledTimes(2);
    });

    test('glob matching is case-insensitive', async () => {
      mockRolesApi.listRoles.mockResolvedValue({
        data: {
          data: [
            { uuid: 'match-1', name: 'test-prefix-role' },
            { uuid: 'match-2', name: 'test-prefix-other' },
          ],
        },
      });

      await runCleanup({ prefix: 'test-prefix-' });

      expect(mockRolesApi.deleteRole).toHaveBeenCalledTimes(2);
    });
  });

  // ==========================================================================
  // System Resource Protection Tests
  // ==========================================================================

  describe('System Resource Protection', () => {
    test('does NOT delete system roles', async () => {
      mockRolesApi.listRoles.mockResolvedValue({
        data: {
          data: [
            { uuid: 'sys-role', name: 'test-system-role', system: true },
            { uuid: 'custom-role', name: 'test-custom-role', system: false },
          ],
        },
      });

      await runCleanup({ prefix: 'test-' });

      expect(mockRolesApi.deleteRole).toHaveBeenCalledTimes(1);
      expect(mockRolesApi.deleteRole).toHaveBeenCalledWith({ uuid: 'custom-role' });
    });

    test('does NOT delete platform_default groups', async () => {
      mockGroupsApi.listGroups.mockResolvedValue({
        data: {
          data: [
            { uuid: 'default-grp', name: 'test-default-group', platform_default: true },
            { uuid: 'custom-grp', name: 'test-custom-group', platform_default: false },
          ],
        },
      });

      await runCleanup({ prefix: 'test-' });

      expect(mockGroupsApi.deleteGroup).toHaveBeenCalledWith({ uuid: 'custom-grp' });
      expect(mockGroupsApi.deleteGroup).not.toHaveBeenCalledWith(expect.objectContaining({ uuid: 'default-grp' }));
    });

    test('does NOT delete root workspaces', async () => {
      mockWorkspacesApi.listWorkspaces.mockResolvedValue({
        data: {
          data: [
            { id: 'root-ws', name: 'test-root-ws', type: 'root' },
            { id: 'child-ws', name: 'test-child-ws', type: 'standard' },
          ],
        },
      });

      await runCleanup({ prefix: 'test-' });

      expect(mockWorkspacesApi.deleteWorkspace).toHaveBeenCalledWith({ id: 'child-ws' });
      expect(mockWorkspacesApi.deleteWorkspace).not.toHaveBeenCalledWith(expect.objectContaining({ id: 'root-ws' }));
    });

    test('deletes child workspaces before parents using parent_id hierarchy', async () => {
      mockWorkspacesApi.listWorkspaces.mockResolvedValue({
        data: {
          data: [
            { id: 'parent-ws', name: 'test-parent', type: 'standard', parent_id: 'default-1' },
            { id: 'grandchild-ws', name: 'test-grandchild', type: 'standard', parent_id: 'child-ws' },
            { id: 'child-ws', name: 'test-child', type: 'standard', parent_id: 'parent-ws' },
          ],
        },
      });

      await runCleanup({ prefix: 'test-' });

      const calls = mockWorkspacesApi.deleteWorkspace.mock.calls.map((c: [{ id: string }]) => c[0].id);
      expect(calls).toEqual(['grandchild-ws', 'child-ws', 'parent-ws']);
    });
  });

  // ==========================================================================
  // Result Tests
  // ==========================================================================

  describe('Operation Results', () => {
    test('returns exit code 0 when all deletions succeed', async () => {
      mockRolesApi.listRoles.mockResolvedValue({
        data: { data: [{ uuid: 'role-1', name: 'test-role-1' }] },
      });

      const exitCode = await runCleanup({ prefix: 'test-' });

      expect(exitCode).toBe(0);
    });

    test('returns exit code 1 when some deletions fail', async () => {
      mockRolesApi.listRoles.mockResolvedValue({
        data: {
          data: [
            { uuid: 'role-1', name: 'test-role-1' },
            { uuid: 'role-2', name: 'test-role-2' },
          ],
        },
      });
      mockRolesApi.deleteRole.mockResolvedValueOnce({}).mockRejectedValueOnce(new Error('Delete failed'));

      const exitCode = await runCleanup({ prefix: 'test-' });

      expect(exitCode).toBe(1);
    });

    test('returns exit code 0 when no resources match (nothing to delete)', async () => {
      const exitCode = await runCleanup({ prefix: 'nonexistent-prefix-' });

      expect(exitCode).toBe(0);
      expect(mockRolesApi.deleteRole).not.toHaveBeenCalled();
      expect(mockRolesV2Api.rolesBatchDelete).not.toHaveBeenCalled();
      expect(mockGroupsApi.deleteGroup).not.toHaveBeenCalled();
      expect(mockWorkspacesApi.deleteWorkspace).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // API Version Scoping Tests
  // ==========================================================================

  describe('API Version Scoping', () => {
    test('apiVersion=v1 fetches only V1 roles and skips V2 API entirely', async () => {
      mockRolesApi.listRoles.mockResolvedValue({
        data: { data: [{ uuid: 'v1-role', name: 'ci-123-role' }] },
      });

      await runCleanup({ prefix: 'ci-123-', apiVersion: 'v1' });

      expect(mockRolesApi.listRoles).toHaveBeenCalled();
      expect(mockRolesV2Api.rolesList).not.toHaveBeenCalled();
      expect(mockRolesApi.deleteRole).toHaveBeenCalledWith({ uuid: 'v1-role' });
      expect(mockRolesV2Api.rolesBatchDelete).not.toHaveBeenCalled();
    });

    test('apiVersion=v1 skips workspace scanning', async () => {
      await runCleanup({ prefix: 'ci-123-', apiVersion: 'v1' });

      expect(mockWorkspacesApi.listWorkspaces).not.toHaveBeenCalled();
    });

    test('apiVersion=v2 fetches from both V1 and V2 to catch stale V1-created roles', async () => {
      mockRolesApi.listRoles.mockResolvedValue({
        data: { data: [{ uuid: 'v1-stale', name: 'ci-123-v1-stale' }] },
      });
      mockRolesV2Api.rolesList.mockResolvedValue({
        data: { data: [{ id: 'v2-role', name: 'ci-123-role' }] },
      });

      await runCleanup({ prefix: 'ci-123-', apiVersion: 'v2' });

      expect(mockRolesApi.listRoles).toHaveBeenCalled();
      expect(mockRolesV2Api.rolesList).toHaveBeenCalled();
      // V1 stale role deleted via V1 API
      expect(mockRolesApi.deleteRole).toHaveBeenCalledWith({ uuid: 'v1-stale' });
      // V2-exclusive role deleted via V2 batch delete
      expect(mockRolesV2Api.rolesBatchDelete).toHaveBeenCalledWith({
        rolesBatchDeleteRolesRequest: { ids: ['v2-role'] },
      });
    });

    test('apiVersion=v2 scans workspaces normally', async () => {
      mockWorkspacesApi.listWorkspaces.mockResolvedValue({
        data: { data: [{ id: 'ws-1', name: 'ci-123-ws', type: 'standard' }] },
      });

      await runCleanup({ prefix: 'ci-123-', apiVersion: 'v2' });

      expect(mockWorkspacesApi.listWorkspaces).toHaveBeenCalled();
      expect(mockWorkspacesApi.deleteWorkspace).toHaveBeenCalledWith({ id: 'ws-1' });
    });

    test('no apiVersion fetches from both V1 and V2 (default behavior)', async () => {
      mockRolesApi.listRoles.mockResolvedValue({
        data: { data: [{ uuid: 'v1-role', name: 'ci-123-role' }] },
      });
      mockRolesV2Api.rolesList.mockResolvedValue({
        data: { data: [{ id: 'v2-only', name: 'ci-123-v2-only' }] },
      });

      await runCleanup({ prefix: 'ci-123-' });

      expect(mockRolesApi.listRoles).toHaveBeenCalled();
      expect(mockRolesV2Api.rolesList).toHaveBeenCalled();
      expect(mockRolesApi.deleteRole).toHaveBeenCalledWith({ uuid: 'v1-role' });
      expect(mockRolesV2Api.rolesBatchDelete).toHaveBeenCalledWith({
        rolesBatchDeleteRolesRequest: { ids: ['v2-only'] },
      });
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
      mockRolesApi.listRoles.mockResolvedValue({
        data: {
          data: [
            { uuid: 'role-1', name: 'prefix-role' },
            { uuid: 'role-2', name: 'match-role' },
          ],
        },
      });

      await runCleanup({ prefix: 'prefix-', nameMatch: 'match-*' });

      expect(mockRolesApi.deleteRole).toHaveBeenCalledTimes(1);
      expect(mockRolesApi.deleteRole).toHaveBeenCalledWith({ uuid: 'role-1' });
    });
  });
});
