/**
 * Login Headless Command Tests
 *
 * Tests for the headless login command handler.
 * These tests verify:
 * - Environment variable validation
 * - Error handling for missing credentials
 * - Option parsing
 */

import { describe, expect, test, vi, beforeEach, afterEach } from 'vitest';

// Mock the auth-bridge module before importing the command
vi.mock('../../auth-bridge.js', () => ({
  performHeadlessLogin: vi.fn(),
  getEnvConfig: vi.fn(() => ({
    name: 'Staging',
    loginUrl: 'https://console.stage.redhat.com',
    apiUrl: 'https://console.stage.redhat.com',
  })),
}));

import { runLoginHeadless, type LoginHeadlessOptions } from '../login-headless.js';
import { performHeadlessLogin } from '../../auth-bridge.js';

describe('login-headless command', () => {
  const originalEnv = { ...process.env };
  const mockPerformHeadlessLogin = vi.mocked(performHeadlessLogin);

  beforeEach(() => {
    vi.clearAllMocks();
    process.env = { ...originalEnv };
    delete process.env.RBAC_USERNAME;
    delete process.env.RBAC_PASSWORD;
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  // ==========================================================================
  // Environment Variable Validation Tests
  // ==========================================================================

  describe('Environment Variable Validation', () => {
    test('fails with exit code 1 when RBAC_USERNAME is missing', async () => {
      process.env.RBAC_PASSWORD = 'test-password';

      const exitCode = await runLoginHeadless({});

      expect(exitCode).toBe(1);
      expect(mockPerformHeadlessLogin).not.toHaveBeenCalled();
    });

    test('fails with exit code 1 when RBAC_PASSWORD is missing', async () => {
      process.env.RBAC_USERNAME = 'test-user';

      const exitCode = await runLoginHeadless({});

      expect(exitCode).toBe(1);
      expect(mockPerformHeadlessLogin).not.toHaveBeenCalled();
    });

    test('fails with exit code 1 when both credentials are missing', async () => {
      const exitCode = await runLoginHeadless({});

      expect(exitCode).toBe(1);
      expect(mockPerformHeadlessLogin).not.toHaveBeenCalled();
    });
  });

  // ==========================================================================
  // Successful Login Tests
  // ==========================================================================

  describe('Successful Login', () => {
    beforeEach(() => {
      process.env.RBAC_USERNAME = 'test-user';
      process.env.RBAC_PASSWORD = 'test-password';
    });

    test('calls performHeadlessLogin with correct credentials', async () => {
      mockPerformHeadlessLogin.mockResolvedValue({
        token: 'mock-jwt-token',
      });

      await runLoginHeadless({});

      expect(mockPerformHeadlessLogin).toHaveBeenCalledWith({
        username: 'test-user',
        password: 'test-password',
        saveStatePath: undefined,
        stdout: false,
      });
    });

    test('passes --save-state option correctly', async () => {
      mockPerformHeadlessLogin.mockResolvedValue({
        token: 'mock-jwt-token',
        storageStatePath: '/path/to/auth.json',
      });

      await runLoginHeadless({ saveState: '/path/to/auth.json' });

      expect(mockPerformHeadlessLogin).toHaveBeenCalledWith({
        username: 'test-user',
        password: 'test-password',
        saveStatePath: '/path/to/auth.json',
        stdout: false,
      });
    });

    test('passes --stdout option correctly', async () => {
      mockPerformHeadlessLogin.mockResolvedValue({
        token: 'mock-jwt-token',
      });

      await runLoginHeadless({ stdout: true });

      expect(mockPerformHeadlessLogin).toHaveBeenCalledWith({
        username: 'test-user',
        password: 'test-password',
        saveStatePath: undefined,
        stdout: true,
      });
    });

    test('returns exit code 0 on success', async () => {
      mockPerformHeadlessLogin.mockResolvedValue({
        token: 'mock-jwt-token',
      });

      const exitCode = await runLoginHeadless({});

      expect(exitCode).toBe(0);
    });

    test('returns exit code 0 when storage state is saved', async () => {
      mockPerformHeadlessLogin.mockResolvedValue({
        token: 'mock-jwt-token',
        storageStatePath: '/path/to/auth.json',
      });

      const exitCode = await runLoginHeadless({ saveState: '/path/to/auth.json' });

      expect(exitCode).toBe(0);
    });
  });

  // ==========================================================================
  // Error Handling Tests
  // ==========================================================================

  describe('Error Handling', () => {
    beforeEach(() => {
      process.env.RBAC_USERNAME = 'test-user';
      process.env.RBAC_PASSWORD = 'test-password';
    });

    test('returns exit code 1 when login fails', async () => {
      mockPerformHeadlessLogin.mockRejectedValue(new Error('Login timeout'));

      const exitCode = await runLoginHeadless({});

      expect(exitCode).toBe(1);
    });

    test('returns exit code 1 when browser launch fails', async () => {
      mockPerformHeadlessLogin.mockRejectedValue(new Error('Failed to launch browser'));

      const exitCode = await runLoginHeadless({});

      expect(exitCode).toBe(1);
    });

    test('handles non-Error exceptions gracefully', async () => {
      mockPerformHeadlessLogin.mockRejectedValue('string error');

      const exitCode = await runLoginHeadless({});

      expect(exitCode).toBe(1);
    });
  });

  // ==========================================================================
  // Option Combination Tests
  // ==========================================================================

  describe('Option Combinations', () => {
    beforeEach(() => {
      process.env.RBAC_USERNAME = 'test-user';
      process.env.RBAC_PASSWORD = 'test-password';
    });

    test('supports both --save-state and --stdout together', async () => {
      mockPerformHeadlessLogin.mockResolvedValue({
        token: 'mock-jwt-token',
        storageStatePath: '/path/to/auth.json',
      });

      await runLoginHeadless({
        saveState: '/path/to/auth.json',
        stdout: true,
      });

      expect(mockPerformHeadlessLogin).toHaveBeenCalledWith({
        username: 'test-user',
        password: 'test-password',
        saveStatePath: '/path/to/auth.json',
        stdout: true,
      });
    });
  });
});
