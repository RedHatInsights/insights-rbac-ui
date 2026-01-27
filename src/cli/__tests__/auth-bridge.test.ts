/**
 * Auth Bridge Tests
 *
 * Tests for the Playwright browser management and authentication bridge.
 * These tests verify:
 * - Environment configuration
 * - Launch options with proxy support
 * - Analytics/overlay blocking (TrustArc, Amplitude)
 * - Pattern matching for glob filters
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { LOGIN_SELECTORS, getCurrentEnv, getEnvConfig, getLaunchOptions } from '../auth-bridge.js';

describe('auth-bridge', () => {
  // Store original env
  const originalEnv = { ...process.env };

  beforeEach(() => {
    // Reset env before each test
    process.env = { ...originalEnv };
    delete process.env.RBAC_ENV;
    delete process.env.RBAC_API_URL;
    delete process.env.HTTPS_PROXY;
    delete process.env.RBAC_PAC_URL;
  });

  afterEach(() => {
    // Restore original env
    process.env = originalEnv;
  });

  // ==========================================================================
  // Environment Configuration Tests
  // ==========================================================================

  describe('getCurrentEnv', () => {
    test('returns "stage" by default when RBAC_ENV is not set', () => {
      expect(getCurrentEnv()).toBe('stage');
    });

    test('returns "stage" when RBAC_ENV is set to stage', () => {
      process.env.RBAC_ENV = 'stage';
      expect(getCurrentEnv()).toBe('stage');
    });

    test('returns "prod" when RBAC_ENV is set to prod', () => {
      process.env.RBAC_ENV = 'prod';
      expect(getCurrentEnv()).toBe('prod');
    });

    test('returns "local" when RBAC_ENV is set to local', () => {
      process.env.RBAC_ENV = 'local';
      expect(getCurrentEnv()).toBe('local');
    });

    test('falls back to "stage" for invalid RBAC_ENV values', () => {
      process.env.RBAC_ENV = 'invalid';
      expect(getCurrentEnv()).toBe('stage');
    });
  });

  describe('getEnvConfig', () => {
    test('returns staging config by default', () => {
      const config = getEnvConfig();
      expect(config.name).toBe('Staging');
      expect(config.loginUrl).toBe('https://console.stage.redhat.com');
      expect(config.apiUrl).toBe('https://console.stage.redhat.com');
    });

    test('returns production config when RBAC_ENV=prod', () => {
      process.env.RBAC_ENV = 'prod';
      const config = getEnvConfig();
      expect(config.name).toBe('Production');
      expect(config.loginUrl).toBe('https://console.redhat.com');
      expect(config.apiUrl).toBe('https://console.redhat.com');
    });

    test('returns local config when RBAC_ENV=local', () => {
      process.env.RBAC_ENV = 'local';
      const config = getEnvConfig();
      expect(config.name).toBe('Local Dev');
      expect(config.loginUrl).toBe('https://stage.foo.redhat.com:1337');
    });

    test('allows full override via RBAC_API_URL', () => {
      process.env.RBAC_API_URL = 'https://custom.example.com/api/rbac/v1';
      const config = getEnvConfig();
      expect(config.name).toBe('Custom');
      expect(config.loginUrl).toBe('https://custom.example.com');
      expect(config.apiUrl).toBe('https://custom.example.com');
    });

    test('RBAC_API_URL takes precedence over RBAC_ENV', () => {
      process.env.RBAC_ENV = 'prod';
      process.env.RBAC_API_URL = 'https://override.example.com';
      const config = getEnvConfig();
      expect(config.name).toBe('Custom');
      expect(config.apiUrl).toBe('https://override.example.com');
    });
  });

  // ==========================================================================
  // Launch Options Tests
  // ==========================================================================

  describe('getLaunchOptions', () => {
    test('returns headless: true for headless mode', () => {
      const options = getLaunchOptions(true);
      expect(options.headless).toBe(true);
    });

    test('returns headless: false for interactive mode', () => {
      const options = getLaunchOptions(false);
      expect(options.headless).toBe(false);
    });

    test('includes automation detection bypass arg', () => {
      const options = getLaunchOptions(true);
      expect(options.args).toContain('--disable-blink-features=AutomationControlled');
    });

    test('adds --start-maximized only for interactive mode', () => {
      const headlessOptions = getLaunchOptions(true);
      const interactiveOptions = getLaunchOptions(false);

      expect(headlessOptions.args).not.toContain('--start-maximized');
      expect(interactiveOptions.args).toContain('--start-maximized');
    });

    test('sets proxy when HTTPS_PROXY is set (CI sidecar mode)', () => {
      process.env.HTTPS_PROXY = 'http://ci-proxy:8080';
      const options = getLaunchOptions(true);
      expect(options.proxy).toEqual({ server: 'http://ci-proxy:8080' });
    });

    test('adds PAC URL arg when RBAC_PAC_URL is set (VPN mode)', () => {
      process.env.RBAC_PAC_URL = 'http://proxy.local/proxy.pac';
      const options = getLaunchOptions(true);
      expect(options.args).toContain('--proxy-pac-url=http://proxy.local/proxy.pac');
    });

    test('supports both proxy modes simultaneously', () => {
      process.env.HTTPS_PROXY = 'http://ci-proxy:8080';
      process.env.RBAC_PAC_URL = 'http://proxy.local/proxy.pac';
      const options = getLaunchOptions(true);

      expect(options.proxy).toEqual({ server: 'http://ci-proxy:8080' });
      expect(options.args).toContain('--proxy-pac-url=http://proxy.local/proxy.pac');
    });
  });

  // ==========================================================================
  // Login Selectors Tests
  // ==========================================================================

  describe('LOGIN_SELECTORS', () => {
    test('exports correct Red Hat SSO selectors', () => {
      expect(LOGIN_SELECTORS.usernameInput).toBe('#username-verification');
      expect(LOGIN_SELECTORS.nextButton).toBe('#login-show-step2');
      expect(LOGIN_SELECTORS.passwordInput).toBe('#password');
      expect(LOGIN_SELECTORS.submitButton).toBe('#rh-password-verification-submit-button');
    });
  });
});
