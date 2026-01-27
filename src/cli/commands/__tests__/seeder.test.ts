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

      await runSeeder({ file: 'payload.json' });

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

      await runSeeder({ file: 'payload.json' });

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
      await runSeeder({ file: '/path/to/payload.json' });

      expect(mockReadFile).toHaveBeenCalledWith('/path/to/payload.json', 'utf-8');
    });

    test('fails with exit code 1 when file does not exist', async () => {
      mockReadFile.mockRejectedValue(new Error('ENOENT: no such file'));

      const exitCode = await runSeeder({ file: 'nonexistent.json' });

      expect(exitCode).toBe(1);
    });

    test('fails with exit code 1 when file contains invalid JSON', async () => {
      mockReadFile.mockResolvedValue('{ invalid json }');

      const exitCode = await runSeeder({ file: 'invalid.json' });

      expect(exitCode).toBe(1);
    });

    test('fails with exit code 1 when payload schema is invalid', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          roles: [{ invalidField: 'no name field' }],
        }),
      );

      const exitCode = await runSeeder({ file: 'invalid-schema.json' });

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
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          roles: [{ name: 'my-role' }],
        }),
      );

      await runSeeder({ file: 'payload.json', prefix: 'ci-123-' });

      expect(mockClient.post).toHaveBeenCalledWith('/api/rbac/v1/roles/', expect.objectContaining({ name: 'ci-123-my-role' }));
    });

    test('prepends prefix to group names', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: { uuid: 'new-uuid' } }),
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          groups: [{ name: 'my-group' }],
        }),
      );

      await runSeeder({ file: 'payload.json', prefix: 'test-' });

      expect(mockClient.post).toHaveBeenCalledWith('/api/rbac/v1/groups/', expect.objectContaining({ name: 'test-my-group' }));
    });

    test('prepends prefix to workspace names', async () => {
      const mockClient = {
        post: vi.fn().mockResolvedValue({ data: { id: 'new-id' } }),
        get: vi.fn().mockResolvedValue({ data: { data: [{ id: 'root-id' }] } }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          workspaces: [{ name: 'my-workspace' }],
        }),
      );

      await runSeeder({ file: 'payload.json', prefix: 'e2e-' });

      expect(mockClient.post).toHaveBeenCalledWith('/api/rbac/v2/workspaces/', expect.objectContaining({ name: 'e2e-my-workspace' }));
    });

    test('works without prefix (no modification to names)', async () => {
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

      await runSeeder({ file: 'payload.json' });

      expect(mockClient.post).toHaveBeenCalledWith('/api/rbac/v1/roles/', expect.objectContaining({ name: 'original-name' }));
    });
  });

  // ==========================================================================
  // Empty Payload Tests
  // ==========================================================================

  describe('Empty Payload Handling', () => {
    test('fails with exit code 1 when payload is empty', async () => {
      mockReadFile.mockResolvedValue(JSON.stringify({}));

      const mockClient = {
        post: vi.fn(),
        get: vi.fn(),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      const exitCode = await runSeeder({ file: 'empty.json' });

      expect(exitCode).toBe(1);
      expect(mockClient.post).not.toHaveBeenCalled();
    });

    test('fails with exit code 1 when all arrays are empty', async () => {
      mockReadFile.mockResolvedValue(
        JSON.stringify({
          roles: [],
          groups: [],
          workspaces: [],
        }),
      );

      const mockClient = {
        post: vi.fn(),
        get: vi.fn(),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      const exitCode = await runSeeder({ file: 'empty-arrays.json' });

      expect(exitCode).toBe(1);
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
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          roles: [{ name: 'role-1' }, { name: 'role-2' }],
        }),
      );

      const exitCode = await runSeeder({ file: 'payload.json' });

      expect(exitCode).toBe(0);
    });

    test('returns exit code 1 when some operations fail', async () => {
      const mockClient = {
        post: vi
          .fn()
          .mockResolvedValueOnce({ data: { uuid: 'success-uuid' } })
          .mockRejectedValueOnce(new Error('API error')),
        get: vi.fn().mockResolvedValue({ data: { data: [] } }),
      };
      mockGetApiClient.mockReturnValue(mockClient as MockApiClient);

      mockReadFile.mockResolvedValue(
        JSON.stringify({
          roles: [{ name: 'role-1' }, { name: 'role-2' }],
        }),
      );

      const exitCode = await runSeeder({ file: 'payload.json' });

      expect(exitCode).toBe(1);
    });
  });
});
