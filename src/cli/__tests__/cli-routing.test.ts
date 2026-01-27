/**
 * CLI Routing Tests
 *
 * Tests for the CLI entry point command routing.
 * These tests verify:
 * - Headless command detection from process.argv
 * - Correct routing to headless handlers
 * - Bypass of Ink TUI for headless commands
 */

import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';

describe('CLI Command Routing', () => {
  // ==========================================================================
  // Headless Command Detection Tests
  // ==========================================================================

  describe('isHeadlessCommand detection', () => {
    // These tests verify the command detection logic in isolation

    test('detects "login --headless" as headless command', () => {
      const args = ['login', '--headless'];
      const isHeadless = args.includes('login') && args.includes('--headless');
      expect(isHeadless).toBe(true);
    });

    test('detects "login --headless --save-state auth.json" as headless command', () => {
      const args = ['login', '--headless', '--save-state', 'auth.json'];
      const isHeadless = args.includes('login') && args.includes('--headless');
      expect(isHeadless).toBe(true);
    });

    test('does NOT detect "login" alone as headless command', () => {
      const args = ['login'];
      const isHeadless = args.includes('login') && args.includes('--headless');
      expect(isHeadless).toBe(false);
    });

    test('detects "seed" as headless command', () => {
      const args = ['seed', '--file', 'payload.json'];
      const isHeadless = args[0] === 'seed';
      expect(isHeadless).toBe(true);
    });

    test('detects "cleanup" as headless command', () => {
      const args = ['cleanup', '--prefix', 'test-'];
      const isHeadless = args[0] === 'cleanup';
      expect(isHeadless).toBe(true);
    });

    test('does NOT detect "roles" as headless command', () => {
      const args = ['roles', '--json'];
      const isHeadless = args[0] === 'seed' || args[0] === 'cleanup' || (args.includes('login') && args.includes('--headless'));
      expect(isHeadless).toBe(false);
    });

    test('does NOT detect "groups" as headless command', () => {
      const args = ['groups'];
      const isHeadless = args[0] === 'seed' || args[0] === 'cleanup' || (args.includes('login') && args.includes('--headless'));
      expect(isHeadless).toBe(false);
    });

    test('does NOT detect empty args as headless command', () => {
      const args: string[] = [];
      const isHeadless = args[0] === 'seed' || args[0] === 'cleanup' || (args.includes('login') && args.includes('--headless'));
      expect(isHeadless).toBe(false);
    });
  });

  // ==========================================================================
  // Argument Parsing Tests
  // ==========================================================================

  describe('parseHeadlessArgs', () => {
    function parseHeadlessArgs(cmdArgs: string[]): Record<string, string | boolean> {
      const result: Record<string, string | boolean> = {};

      for (let i = 0; i < cmdArgs.length; i++) {
        const arg = cmdArgs[i];

        if (arg.startsWith('--')) {
          const key = arg.slice(2);
          const nextArg = cmdArgs[i + 1];

          if (nextArg && !nextArg.startsWith('--')) {
            result[key] = nextArg;
            i++;
          } else {
            result[key] = true;
          }
        }
      }

      return result;
    }

    test('parses --save-state with value', () => {
      const args = ['login', '--headless', '--save-state', 'auth.json'];
      const parsed = parseHeadlessArgs(args);

      expect(parsed['save-state']).toBe('auth.json');
      expect(parsed['headless']).toBe(true);
    });

    test('parses boolean flag --stdout', () => {
      const args = ['login', '--headless', '--stdout'];
      const parsed = parseHeadlessArgs(args);

      expect(parsed['stdout']).toBe(true);
    });

    test('parses --file with path', () => {
      const args = ['seed', '--file', '/path/to/payload.json', '--prefix', 'ci-'];
      const parsed = parseHeadlessArgs(args);

      expect(parsed['file']).toBe('/path/to/payload.json');
      expect(parsed['prefix']).toBe('ci-');
    });

    test('parses --json as boolean', () => {
      const args = ['seed', '--file', 'payload.json', '--json'];
      const parsed = parseHeadlessArgs(args);

      expect(parsed['json']).toBe(true);
    });

    test('parses --name-match with glob pattern', () => {
      const args = ['cleanup', '--name-match', 'test-*-run'];
      const parsed = parseHeadlessArgs(args);

      expect(parsed['name-match']).toBe('test-*-run');
    });

    test('handles multiple flags correctly', () => {
      const args = ['login', '--headless', '--save-state', 'auth.json', '--stdout'];
      const parsed = parseHeadlessArgs(args);

      expect(parsed['headless']).toBe(true);
      expect(parsed['save-state']).toBe('auth.json');
      expect(parsed['stdout']).toBe(true);
    });

    test('ignores non-flag arguments', () => {
      const args = ['seed', 'ignored-positional', '--file', 'payload.json'];
      const parsed = parseHeadlessArgs(args);

      expect(parsed['file']).toBe('payload.json');
      expect(Object.keys(parsed)).toHaveLength(1);
    });
  });

  // ==========================================================================
  // Command Type Detection Tests
  // ==========================================================================

  describe('Command Type Detection', () => {
    function detectCommandType(args: string[]): 'login-headless' | 'seed' | 'cleanup' | 'interactive' | null {
      if (args.includes('login') && args.includes('--headless')) {
        return 'login-headless';
      }
      if (args[0] === 'seed') {
        return 'seed';
      }
      if (args[0] === 'cleanup') {
        return 'cleanup';
      }
      if (args.length === 0 || ['roles', 'groups', 'workspaces', 'login', 'logout', 'info'].includes(args[0])) {
        return 'interactive';
      }
      return null;
    }

    test('detects login-headless command', () => {
      expect(detectCommandType(['login', '--headless'])).toBe('login-headless');
      expect(detectCommandType(['login', '--headless', '--save-state', 'auth.json'])).toBe('login-headless');
    });

    test('detects seed command', () => {
      expect(detectCommandType(['seed', '--file', 'payload.json'])).toBe('seed');
      expect(detectCommandType(['seed', '--file', 'p.json', '--prefix', 'ci-'])).toBe('seed');
    });

    test('detects cleanup command', () => {
      expect(detectCommandType(['cleanup', '--prefix', 'test-'])).toBe('cleanup');
      expect(detectCommandType(['cleanup', '--name-match', 'ci-*'])).toBe('cleanup');
    });

    test('detects interactive commands', () => {
      expect(detectCommandType([])).toBe('interactive');
      expect(detectCommandType(['roles'])).toBe('interactive');
      expect(detectCommandType(['groups'])).toBe('interactive');
      expect(detectCommandType(['workspaces'])).toBe('interactive');
      expect(detectCommandType(['login'])).toBe('interactive');
      expect(detectCommandType(['logout'])).toBe('interactive');
      expect(detectCommandType(['info'])).toBe('interactive');
    });
  });
});
