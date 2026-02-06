/**
 * Permission Sync Validation Script
 *
 * Validates that permissions in deploy/frontend.yaml stay in sync
 * with the source of truth in src/utilities/route-definitions.ts
 *
 * Run with: npx tsx scripts/validate-permissions.ts
 * Or via: npm run lint:permissions
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse } from 'yaml';
import { flattenRouteDefinitions } from '../src/utilities/route-definitions';

// ===========================================
// Types
// ===========================================

interface Permission {
  method: string;
  args?: (string | boolean | string[])[];
}

interface NavItem {
  id: string;
  title?: string;
  href?: string;
  permissions?: Permission[];
  routes?: NavItem[];
  expandable?: boolean;
}

interface FrontendYaml {
  objects: Array<{
    spec: {
      bundleSegments: Array<{
        navItems: NavItem[];
      }>;
    };
  }>;
}

interface RouteConfig {
  permissions: string[];
  requireOrgAdmin?: boolean;
  checkAll?: boolean;
}

// ===========================================
// Constants
// ===========================================

const IAM_PREFIX = '/iam';
const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// ===========================================
// Helper Functions
// ===========================================

/**
 * Normalize path by removing /iam prefix and trailing wildcards/slashes
 */
function normalizePath(path: string): string {
  return path
    .replace(/^\/iam/, '') // Remove /iam prefix
    .replace(/\/\*$/, '') // Remove trailing /*
    .replace(/\/$/, '') // Remove trailing slash
    || '/';
}

/**
 * Extract permissions from a permission configuration
 *
 * loosePermissions format in frontend.yaml:
 * - AND logic: args: [['perm1', 'perm2']] - single inner array with multiple items
 * - OR logic:  args: [['perm1'], ['perm2']] - multiple inner arrays
 */
function extractPermissions(permissions: Permission[]): {
  rbacPermissions: string[];
  requireOrgAdmin: boolean;
  hasFeatureFlagOnly: boolean;
  checkAll: boolean; // true = AND, false = OR
} {
  let rbacPermissions: string[] = [];
  let requireOrgAdmin = false;
  let hasFeatureFlagOnly = true;
  let checkAll = true; // Default to AND logic

  for (const perm of permissions) {
    if (perm.method === 'isOrgAdmin') {
      requireOrgAdmin = true;
      hasFeatureFlagOnly = false;
    } else if (perm.method === 'loosePermissions' && perm.args) {
      // loosePermissions args structure:
      // - AND: [['perm1', 'perm2']] - one array with multiple permissions
      // - OR:  [['perm1'], ['perm2']] - multiple arrays with one permission each
      const innerArrays = perm.args.filter((arg): arg is string[] => Array.isArray(arg));

      if (innerArrays.length > 1) {
        // Multiple inner arrays = OR logic
        checkAll = false;
        for (const arr of innerArrays) {
          rbacPermissions = [...rbacPermissions, ...arr.filter((p): p is string => typeof p === 'string')];
        }
      } else if (innerArrays.length === 1) {
        // Single inner array = AND logic (or single permission)
        const permsInArray = innerArrays[0].filter((p): p is string => typeof p === 'string');
        rbacPermissions = [...rbacPermissions, ...permsInArray];
        // If single permission, checkAll doesn't matter, keep default
        if (permsInArray.length > 1) {
          checkAll = true;
        }
      }
      hasFeatureFlagOnly = false;
    }
    // featureFlag is ignored (visibility, not access control)
  }

  return { rbacPermissions, requireOrgAdmin, hasFeatureFlagOnly, checkAll };
}

/**
 * Recursively collect all nav items with their paths
 */
function collectNavItems(
  items: NavItem[],
  result: Map<string, { rbacPermissions: string[]; requireOrgAdmin: boolean; checkAll: boolean }>
): void {
  for (const item of items) {
    if (item.href && item.permissions) {
      const normalizedPath = normalizePath(item.href);
      const { rbacPermissions, requireOrgAdmin, hasFeatureFlagOnly, checkAll } = extractPermissions(item.permissions);

      // Skip items that only have feature flags (visibility control, not access control)
      if (!hasFeatureFlagOnly) {
        result.set(normalizedPath, { rbacPermissions, requireOrgAdmin, checkAll });
      }
    }

    // Recurse into child routes
    if (item.routes) {
      collectNavItems(item.routes, result);
    }
  }
}

/**
 * Check if two permission arrays are equivalent (symmetric comparison)
 * Handles wildcards like rbac:*:* and rbac:*:read
 *
 * Both sides must cover each other to ensure nav visibility matches route access.
 */
function permissionsMatch(yamlPerms: string[], routePerms: string[]): boolean {
  const normalizePerms = (perms: string[]) => [...new Set(perms)].sort();

  const yamlNorm = normalizePerms(yamlPerms);
  const routeNorm = normalizePerms(routePerms);

  // Fast path: exact match
  if (JSON.stringify(yamlNorm) === JSON.stringify(routeNorm)) {
    return true;
  }

  // Check if a permission is covered by a pattern (with wildcard support)
  const permCoveredByPattern = (perm: string, pattern: string): boolean => {
    if (perm === pattern) return true;

    const permParts = perm.split(':');
    const patternParts = pattern.split(':');

    if (permParts.length !== patternParts.length) return false;

    return patternParts.every((part, index) => part === '*' || part === permParts[index]);
  };

  // Check if every permission in `perms` is covered by at least one pattern
  const allCoveredBy = (perms: string[], patterns: string[]): boolean =>
    perms.every((perm) => patterns.some((pattern) => permCoveredByPattern(perm, pattern)));

  // Symmetric: both sides must cover each other
  return allCoveredBy(yamlNorm, routeNorm) && allCoveredBy(routeNorm, yamlNorm);
}

// ===========================================
// Main Validation
// ===========================================

function main(): void {
  console.log(`${COLORS.bold}Permission Sync Validation${COLORS.reset}`);
  console.log('==========================\n');

  // Load frontend.yaml
  const frontendYamlPath = resolve(__dirname, '../deploy/frontend.yaml');
  const frontendYaml: FrontendYaml = parse(readFileSync(frontendYamlPath, 'utf-8'));

  // Load route definitions
  const routeMap = flattenRouteDefinitions();

  // Extract nav items from frontend.yaml
  const yamlRoutes = new Map<string, { rbacPermissions: string[]; requireOrgAdmin: boolean; checkAll: boolean }>();
  for (const obj of frontendYaml.objects) {
    for (const segment of obj.spec.bundleSegments || []) {
      collectNavItems(segment.navItems || [], yamlRoutes);
    }
  }

  console.log(`Checking ${yamlRoutes.size} navigation items against route-definitions.ts...\n`);

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [path, yamlConfig] of yamlRoutes) {
    // Find matching route in route-definitions
    const routeConfig = routeMap.get(path);

    // Try with wildcard paths (e.g., /user-access/overview might match /user-access/overview/*)
    const routeConfigWithWildcard = routeConfig || routeMap.get(`${path}/*`);

    if (!routeConfigWithWildcard) {
      // Route not found in definitions - might be a feature-flagged route
      console.log(`${COLORS.yellow}? ${path}: Not in route-definitions (feature-flagged?)${COLORS.reset}`);
      skipped++;
      continue;
    }

    // Check requireOrgAdmin match
    if (yamlConfig.requireOrgAdmin !== (routeConfigWithWildcard.requireOrgAdmin ?? false)) {
      const yamlMethod = yamlConfig.requireOrgAdmin ? 'isOrgAdmin' : 'loosePermissions';
      const routeMethod = routeConfigWithWildcard.requireOrgAdmin ? 'requireOrgAdmin: true' : 'permissions[]';
      errors.push(
        `${COLORS.red}✗ ${path}:${COLORS.reset}\n` +
        `    frontend.yaml:        ${yamlMethod}\n` +
        `    route-definitions.ts: ${routeMethod}`
      );
      failed++;
      continue;
    }

    // Check permissions match
    if (!yamlConfig.requireOrgAdmin && !permissionsMatch(yamlConfig.rbacPermissions, routeConfigWithWildcard.permissions)) {
      errors.push(
        `${COLORS.red}✗ ${path}:${COLORS.reset}\n` +
        `    frontend.yaml:        ${yamlConfig.rbacPermissions.join(', ') || '(none)'}\n` +
        `    route-definitions.ts: ${routeConfigWithWildcard.permissions.join(', ') || '(none)'}`
      );
      failed++;
      continue;
    }

    // Check checkAll (AND/OR logic) matches - only relevant when multiple permissions exist
    const routeCheckAll = routeConfigWithWildcard.checkAll ?? true; // Default is AND
    if (!yamlConfig.requireOrgAdmin && yamlConfig.rbacPermissions.length > 1 && yamlConfig.checkAll !== routeCheckAll) {
      const yamlLogic = yamlConfig.checkAll ? 'AND (all required)' : 'OR (any required)';
      const routeLogic = routeCheckAll ? 'AND (checkAll: true)' : 'OR (checkAll: false)';
      errors.push(
        `${COLORS.red}✗ ${path}: logic mismatch${COLORS.reset}\n` +
        `    frontend.yaml:        ${yamlLogic}\n` +
        `    route-definitions.ts: ${routeLogic}`
      );
      failed++;
      continue;
    }

    // Match!
    const logicStr = yamlConfig.rbacPermissions.length > 1 ? (yamlConfig.checkAll ? ' [AND]' : ' [OR]') : '';
    const permStr = yamlConfig.requireOrgAdmin
      ? 'requireOrgAdmin'
      : (yamlConfig.rbacPermissions.join(', ') || '(public)') + logicStr;
    console.log(`${COLORS.green}✓ ${path}: ${permStr}${COLORS.reset}`);
    passed++;
  }

  // Print errors at the end for visibility
  if (errors.length > 0) {
    console.log('\n' + errors.join('\n\n'));
  }

  // Summary
  console.log(`\n${COLORS.bold}Summary${COLORS.reset}`);
  console.log('-------');
  console.log(`${COLORS.green}Passed: ${passed}${COLORS.reset}`);
  console.log(`${COLORS.red}Failed: ${failed}${COLORS.reset}`);
  console.log(`${COLORS.yellow}Skipped: ${skipped}${COLORS.reset}`);

  if (failed > 0) {
    console.log(`\n${COLORS.red}${COLORS.bold}${failed} mismatch(es) found.${COLORS.reset}`);
    console.log('Update frontend.yaml or route-definitions.ts to fix.');
    process.exit(1);
  } else {
    console.log(`\n${COLORS.green}${COLORS.bold}All permissions in sync!${COLORS.reset}`);
  }
}

main();
