/**
 * Shared Safety Rails for CLI Commands
 *
 * Common validation functions to prevent accidental data creation/deletion
 * in shared environments like stage.
 */

import { getCurrentEnv } from '../auth-bridge.js';

// ============================================================================
// Constants
// ============================================================================

export const MIN_PREFIX_LENGTH = 4;

/**
 * Prefixes that are too generic and could collide with other users' data.
 */
export const BROAD_PREFIXES = ['test', 'dev', 'qa', 'ci', 'e2e'];

// ============================================================================
// Production Safety
// ============================================================================

/**
 * CRITICAL: Block operations in production environments.
 * This prevents accidental data creation/deletion in production via CI/CD.
 *
 * @param operation - Name of the operation for error message (e.g., "Seeding", "Cleanup")
 */
export function assertNotProduction(operation: string): void {
  const env = getCurrentEnv();
  const envLower = env.toLowerCase();

  if (envLower === 'prod' || envLower === 'production') {
    throw new Error(
      `${operation} is not allowed in production via headless mode.\n` +
        `This safety rail prevents accidental data changes in production.\n` +
        `Set RBAC_ENV=stage to use this command.`,
    );
  }
}

// ============================================================================
// Pattern/Prefix Validation
// ============================================================================

export type PatternType = 'prefix' | 'name-match';

/**
 * CRITICAL: Validate pattern/prefix to prevent pollution of shared environment.
 * Rejects patterns that are too short or too broad.
 *
 * @param pattern - The pattern to validate
 * @param type - Type of pattern for error messages ('prefix' or 'name-match')
 * @param operation - Name of the operation for error message (e.g., "seed", "cleanup")
 * @returns The validated pattern
 */
export function assertValidPattern(pattern: string | undefined, type: PatternType, operation: string): string {
  if (!pattern) {
    throw new Error(
      `--${type} is required for ${operation} operations.\n` +
        `This ensures test data can be isolated and cleaned up.\n` +
        `Example: --prefix "myname-" or --prefix "ci-job-123-"`,
    );
  }

  // Remove glob characters for length check (for cleanup patterns)
  const cleanPattern = pattern.replace(/[*?[\]]/g, '');

  if (cleanPattern.length < MIN_PREFIX_LENGTH) {
    throw new Error(
      `--${type} must be at least ${MIN_PREFIX_LENGTH} characters (excluding wildcards).\n` +
        `Received: "${pattern}" (effective length: ${cleanPattern.length})\n` +
        `Example valid patterns: "myname-", "ci-job-123-", "e2e-suite-"`,
    );
  }

  // Reject overly broad patterns
  if (BROAD_PREFIXES.includes(pattern.toLowerCase())) {
    throw new Error(
      `Pattern "${pattern}" is too generic and could affect other users' data.\n` +
        `Please use a more specific pattern like "myname-" or "ci-job-123-".`,
    );
  }

  return pattern;
}

/**
 * Convenience wrapper for prefix validation (most common case).
 */
export function assertValidPrefix(prefix: string | undefined, operation: string): string {
  return assertValidPattern(prefix, 'prefix', operation);
}
