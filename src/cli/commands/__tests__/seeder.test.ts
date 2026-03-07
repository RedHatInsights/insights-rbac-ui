/**
 * Seeder Command Tests
 *
 * Tests for the headless seeder command handler.
 * These tests verify:
 * - Production environment safety rail (CRITICAL)
 * - Payload file reading and validation
 * - Prefix application to resource names
 * - API call execution
 * - JSON output mapping
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

// Use vi.hoisted to create mock that can be used in vi.mock factory
const { mockReadFile } = vi.hoisted(() => ({
  mockReadFile: vi.fn(),
}));

// Mock fs/promises with factory function
vi.mock('fs/promises', () => ({
  readFile: mockReadFile,
}));

// Mock dependencies
vi.mock('../../auth.js', () => ({
  getToken: vi.fn(() => Promise.resolve('mock-token')),
}));
vi.mock('../../api-client.js', () => ({
  initializeApiClient: vi.fn(),
  getApiClient: vi.fn(() => ({
    post: vi.fn(),
    get: vi.fn(),
    // APIFactory uses axios.request() internally
    request: vi.fn(),
  })),
}));
vi.mock('../../auth-bridge.js', () => ({
  getCurrentEnv: vi.fn(() => 'stage'),
  getEnvConfig: vi.fn(() => ({
    name: 'Staging',
    apiUrl: 'https://console.stage.redhat.com',
  })),
}));

import { runSeeder } from '../seeder.js';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getCurrentEnv, getEnvConfig } from '../../auth-bridge.js';
import { getApiClient } from '../../api-client.js';

type MockApiClient = ReturnType<typeof getApiClient>;

describe('seeder command', () => {
  const originalEnv = { ...process.env };
  const mockGetCurrentEnv = vi.mocked(getCurrentEnv);
  const mockGetApiClient = vi.mocked(getApiClient);

  const validPayload = JSON.stringify({
    roles: [{ name: 'test-role', description: 'A test role' }],
    groups: [{ name: 'test-group' }],
  });

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    mockGetCurrentEnv.mockReturnValue('stage');
    mockReadFile.mockResolvedValue(validPayload);
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

      const exitCode = await runSeeder({ file: 'payload.json' });

      expect(exitCode).toBe(1);
      // Should not attempt to read the payload file
      expect(mockReadFile).not.toHaveBeenCalled();
    });

    test('BLOCKS execution when getCurrentEnv returns "production"', async () => {
      mockGetCurrentEnv.mockReturnValue('production' as 'prod');

      const exitCode = await runSeeder({ file: 'payload.json' });

      expect(exitCode).toBe(1);
    });

    test('ALLOWS execution when RBAC_ENV is "stage"', async () => {
      mockGetCurrentEnv.mockReturnValue('stage');

      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: { uuid: 'new-uuid' } }),
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      await runSeeder({ file: 'payload.json', prefix: 'test-' });

      // Should proceed and try to read the file
      expect(mockReadFile).toHaveBeenCalled();
    });

    test('ALLOWS execution when RBAC_ENV is "local"', async () => {
      mockGetCurrentEnv.mockReturnValue('local');

      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: { uuid: 'new-uuid' } }),
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      await runSeeder({ file: 'payload.json', prefix: 'test-' });

      expect(mockReadFile).toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Payload File Reading Tests
  // ==========================================================================

  describe('Payload File Reading', () => {
    beforeEach(() => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: { uuid: 'new-uuid' } }),
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);
    });

    test('reads payload from specified file path', async () => {
      await runSeeder({ file: '/path/to/payload.json', prefix: 'test-' });

      expect(mockReadFile).toHaveBeenCalledWith('/path/to/payload.json', 'utf-8');
    });

    test('fails with exit code 1 when file does not exist', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT: no such file'));

      const exitCode = await runSeeder({ file: 'nonexistent.json', prefix: 'test-' });

      expect(exitCode).toBe(1);
    });

    test('fails with exit code 1 when file contains invalid JSON', async () => {
      mockReadFile.mockResolvedValue('{ invalid json }');

      const exitCode = await runSeeder({ file: 'invalid.json', prefix: 'test-' });

      expect(exitCode).toBe(1);
    });

    test('fails with exit code 1 when payload schema is invalid', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          roles: [{ invalidField: 'no name field' }],
        }),
      );

      const exitCode = await runSeeder({ file: 'invalid-schema.json', prefix: 'test-' });

      expect(exitCode).toBe(1);
    });
  });

  // ==========================================================================
  // Prefix Application Tests
  // ==========================================================================

  describe('Prefix Application', () => {
    test('prepends prefix to role names', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: { uuid: 'new-uuid' } }),
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
        request: vi.fn().mockResolvedValue({ data: { uuid: 'new-uuid' } }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          roles: [{ name: 'my-role' }],
        }),
      );

      await runSeeder({ file: 'payload.json', prefix: 'ci-123-' });

      // APIFactory uses request() internally with JSON stringified data
      expect(mockClient.request).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/api/rbac/v1/roles/', data: expect.stringContaining('ci-123-__my-role') }),
      );
    });

    test('prepends prefix to group names', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: { uuid: 'new-uuid' } }),
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
        request: vi.fn().mockResolvedValue({ data: { uuid: 'new-uuid' } }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          groups: [{ name: 'my-group' }],
        }),
      );

      await runSeeder({ file: 'payload.json', prefix: 'test-' });

      // APIFactory uses request() internally with JSON stringified data
      expect(mockClient.request).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/api/rbac/v1/groups/', data: expect.stringContaining('test-__my-group') }),
      );
    });

    test('prepends prefix to workspace names', async () => {
      const mockClient = {
        request: vi.fn().mockImplementation((config: { url?: string; data?: string }) => {
          if (config.url?.includes('/workspaces/') && config.data) {
            return { data: { id: 'new-ws-id' } };
          }
          return { data: { data: [] } };
        }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          workspaces: [{ name: 'my-workspace' }],
        }),
      );

      await runSeeder({ file: 'payload.json', prefix: 'e2e-' });

      expect(mockClient.request).toHaveBeenCalledWith(
        expect.objectContaining({ url: '/api/rbac/v2/workspaces/', data: expect.stringContaining('e2e-__my-workspace') }),
      );
    });

    test('prepends prefix to workspace parent_id when it references another workspace name', async () => {
      const mockClient = {
        request: vi.fn().mockImplementation((config: { url?: string; data?: string }) => {
          if (config.url?.includes('/workspaces/') && config.data) {
            const parsed = JSON.parse(config.data);
            return { data: { id: parsed.name === 'e2e-__parent' ? 'parent-uuid' : 'child-uuid' } };
          }
          return { data: { data: [] } };
        }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          workspaces: [{ name: 'parent' }, { name: 'child', parent_id: 'parent' }],
        }),
      );

      await runSeeder({ file: 'payload.json', prefix: 'e2e-' });

      const workspaceCalls = mockClient.request.mock.calls.filter(
        ([config]: [{ url?: string; data?: string }]) => config.url?.includes('/workspaces/') && config.data,
      );
      expect(workspaceCalls).toHaveLength(2);

      const childCall = workspaceCalls[1];
      const childData = JSON.parse(childCall[0].data);
      expect(childData.parent_id).toBe('parent-uuid');
    });

    test('resolves workspace parent_id through name-to-ID mapping', async () => {
      const mockClient = {
        request: vi.fn().mockImplementation((config: { url?: string; data?: string }) => {
          if (config.url?.includes('/workspaces/') && config.data) {
            const parsed = JSON.parse(config.data);
            if (parsed.name === 'test-__ws-parent') return { data: { id: 'resolved-parent-id' } };
            return { data: { id: 'child-id' } };
          }
          return { data: { data: [] } };
        }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          workspaces: [{ name: 'ws-parent' }, { name: 'ws-child', parent_id: 'ws-parent' }],
        }),
      );

      await runSeeder({ file: 'payload.json', prefix: 'test-' });

      const workspaceCalls = mockClient.request.mock.calls.filter(
        ([config]: [{ url?: string; data?: string }]) => config.url?.includes('/workspaces/') && config.data,
      );

      const childCallData = JSON.parse(workspaceCalls[1][0].data);
      expect(childCallData.parent_id).toBe('resolved-parent-id');
    });

    test('fails when prefix is not provided', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: { uuid: 'new-uuid' } }),
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          roles: [{ name: 'original-name' }],
        }),
      );

      const exitCode = await runSeeder({ file: 'payload.json' });

      expect(exitCode).toBe(1);
      expect(mockClient.post).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Empty Payload Tests
  // ==========================================================================

  describe('Empty Payload Handling', () => {
    test('succeeds with exit code 0 when payload is empty (nothing to create)', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({}));

      const mockClient = {
        post: vi.fn(),
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      const exitCode = await runSeeder({ file: 'empty.json', prefix: 'test-' });

      expect(exitCode).toBe(0);
      expect(mockClient.post).not.toHaveBeenCalled();
    });

    test('succeeds with exit code 0 when all arrays are empty (nothing to create)', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          roles: [],
          groups: [],
          workspaces: [],
        }),
      );

      const mockClient = {
        post: vi.fn(),
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      const exitCode = await runSeeder({ file: 'empty-arrays.json', prefix: 'test-' });

      expect(exitCode).toBe(0);
    });
  });

  // ==========================================================================
  // V2 API Version Tests
  // ==========================================================================

  describe('V2 API Version', () => {
    test('creates roles via V2 endpoint when apiVersion is v2', async () => {
      const mockClient = {
        request: vi.fn().mockImplementation((config: { url?: string; data?: string }) => {
          if (config.url?.includes('/v2/roles/') && config.data) {
            return { data: { id: 'v2-role-id' } };
          }
          return { data: { data: [] } };
        }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          roles: [{ name: 'v2-role', permissions: ['rbac:group:read'] }],
        }),
      );

      await runSeeder({ file: 'payload.json', prefix: 'test-', apiVersion: 'v2' });

      const roleCalls = mockClient.request.mock.calls.filter(
        ([config]: [{ url?: string; data?: string }]) => config.url?.includes('/v2/roles/') && config.data,
      );
      expect(roleCalls).toHaveLength(1);
      const [roleConfig] = roleCalls[0];
      expect(roleConfig.url).toBe('/api/rbac/v2/roles/');
      const body = JSON.parse(roleConfig.data as string);
      expect(body).toEqual(
        expect.objectContaining({
          name: expect.stringContaining('test-__v2-role'),
          permissions: [{ application: 'rbac', resource_type: 'group', operation: 'read' }],
        }),
      );
    });

    test('does NOT create roles via V1 endpoint when apiVersion is v2', async () => {
      const mockClient = {
        request: vi.fn().mockImplementation((config: { url?: string; data?: string }) => {
          if (config.data && config.url?.includes('/v2/roles/')) {
            return { data: { id: 'v2-role-id' } };
          }
          return { data: { data: [] } };
        }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          roles: [{ name: 'v2-role' }],
        }),
      );

      await runSeeder({ file: 'payload.json', prefix: 'test-', apiVersion: 'v2' });

      const v1RoleCalls = mockClient.request.mock.calls.filter(
        ([config]: [{ url?: string; data?: string }]) => config.url?.includes('/v1/roles/') && config.data,
      );
      expect(v1RoleCalls).toHaveLength(0);
    });

    test('skips system roles discovery when apiVersion is v2', async () => {
      const mockClient = {
        request: vi.fn().mockResolvedValue({ data: { data: [] } }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(JSON.stringify({}));

      await runSeeder({ file: 'payload.json', prefix: 'test-', apiVersion: 'v2' });

      const systemRoleCalls = mockClient.request.mock.calls.filter(([config]: [{ url?: string; params?: { system?: boolean } }]) =>
        config.url?.includes('/v1/roles/'),
      );
      expect(systemRoleCalls).toHaveLength(0);
    });

    test('still fetches system groups when apiVersion is v2', async () => {
      const mockClient = {
        request: vi.fn().mockResolvedValue({ data: { data: [] } }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(JSON.stringify({}));

      await runSeeder({ file: 'payload.json', prefix: 'test-', apiVersion: 'v2' });

      const groupCalls = mockClient.request.mock.calls.filter(([config]: [{ url?: string }]) => config.url?.includes('/v1/groups/'));
      expect(groupCalls.length).toBeGreaterThanOrEqual(1);
    });

    test('does not attach roles to groups when apiVersion is v2', async () => {
      const mockClient = {
        request: vi.fn().mockImplementation((config: { url?: string; data?: string }) => {
          if (config.data && config.url?.includes('/v2/roles/')) {
            return { data: { id: 'v2-role-id' } };
          }
          if (config.data && config.url?.includes('/v1/groups/')) {
            return { data: { uuid: 'new-group-uuid' } };
          }
          return { data: { data: [] } };
        }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          roles: [{ name: 'v2-role' }],
          groups: [{ name: 'v2-group', roles_list: ['v2-role'] }],
        }),
      );

      await runSeeder({ file: 'payload.json', prefix: 'test-', apiVersion: 'v2' });

      const addRoleCalls = mockClient.request.mock.calls.filter(([config]: [{ url?: string }]) => config.url?.match(/\/groups\/.*\/roles\//));
      expect(addRoleCalls).toHaveLength(0);
    });
  });

  // ==========================================================================
  // Success and Failure Result Tests
  // ==========================================================================

  describe('Operation Results', () => {
    test('returns exit code 0 when all operations succeed', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: { uuid: 'new-uuid' } }),
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
        request: vi.fn().mockResolvedValue({ data: { uuid: 'new-uuid' } }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          roles: [{ name: 'role-1' }, { name: 'role-2' }],
        }),
      );

      const exitCode = await runSeeder({ file: 'payload.json', prefix: 'test-' });

      expect(exitCode).toBe(0);
    });

    test('returns exit code 1 when some operations fail', async () => {
      const mockClient = {
        post: vi.fn(),
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
        request: vi
          .fn()
          .mockResolvedValueOnce({ data: { uuid: 'success-uuid' } })
          .mockRejectedValueOnce(new Error('API error')),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          roles: [{ name: 'role-1' }, { name: 'role-2' }],
        }),
      );

      const exitCode = await runSeeder({ file: 'payload.json', prefix: 'test-' });

      expect(exitCode).toBe(1);
    });
  });
});
