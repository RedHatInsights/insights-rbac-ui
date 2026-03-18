/**
 * Permission Sync Validation Script
 *
 * Validates that permissions in deploy/frontend.yaml stay in sync
 * with the guard() / guardOrgAdmin() calls in src/v1/Routing.tsx
 * and src/v2/Routing.tsx.
 *
 * Run with: npx tsx scripts/validate-permissions.ts
 * Or via: npm run lint:permissions
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parse as parseYaml } from 'yaml';
import { parse as parseTs } from '@typescript-eslint/typescript-estree';
import type { TSESTree } from '@typescript-eslint/typescript-estree';
import v1Pathnames from '../src/v1/utilities/pathnames';
import v2Pathnames from '../src/v2/utilities/pathnames';

// ===========================================
// Types
// ===========================================

interface YamlPermission {
  method: string;
  args?: (string | boolean | string[])[];
}

interface YamlNavItem {
  id: string;
  title?: string;
  href?: string;
  permissions?: YamlPermission[];
  routes?: YamlNavItem[];
  expandable?: boolean;
}

interface FrontendYaml {
  objects: Array<{
    spec: {
      bundleSegments: Array<{
        navItems: YamlNavItem[];
      }>;
    };
  }>;
}

interface RoutePermissions {
  permissions: string[];
  checkAll: boolean;
  requireOrgAdmin: boolean;
}

// ===========================================
// Constants
// ===========================================

const IAM_PREFIX = '/iam';

/**
 * V2 domain tokens → Kessel relations. Mirrors the KESSEL_MAP in
 * src/v2/components/V2PermissionGuard.tsx so the validator can resolve
 * v2Guard([roles.canView]) to its Kessel relation for frontend.yaml comparison.
 */
const V2_TOKEN_TO_KESSEL: Record<string, string> = {
  'roles.canView': 'rbac_roles_read',
  'roles.canCreate': 'rbac_roles_write',
  'roles.canUpdate': 'rbac_roles_write',
  'roles.canDelete': 'rbac_roles_write',
  'groups.canView': 'rbac_groups_read',
  'groups.canCreate': 'rbac_groups_write',
  'groups.canUpdate': 'rbac_groups_write',
  'groups.canDelete': 'rbac_groups_write',
  'workspaces.canView': 'rbac_workspace_view',
  'workspaces.canCreate': 'rbac_workspace_create',
  'workspaces.canUpdate': 'rbac_workspace_edit',
  'workspaces.canDelete': 'rbac_workspace_delete',
  'workspaces.canMove': 'rbac_workspace_move',
  'principals.canList': 'rbac_principal_read',
};

const COLORS = {
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
};

// ===========================================
// YAML Extraction
// ===========================================

function extractYamlPermissions(permissions: YamlPermission[]): {
  rbacPermissions: string[];
  requireOrgAdmin: boolean;
  hasFeatureFlagOnly: boolean;
  checkAll: boolean;
} {
  let rbacPermissions: string[] = [];
  let requireOrgAdmin = false;
  let hasFeatureFlagOnly = true;
  let checkAll = true;

  for (const perm of permissions) {
    if (perm.method === 'isOrgAdmin') {
      requireOrgAdmin = true;
      hasFeatureFlagOnly = false;
    } else if (perm.method === 'loosePermissions' && perm.args) {
      const innerArrays = perm.args.filter((arg): arg is string[] => Array.isArray(arg));
      if (innerArrays.length > 1) {
        checkAll = false;
        for (const arr of innerArrays) {
          rbacPermissions = [...rbacPermissions, ...arr.filter((p): p is string => typeof p === 'string')];
        }
      } else if (innerArrays.length === 1) {
        const permsInArray = innerArrays[0].filter((p): p is string => typeof p === 'string');
        rbacPermissions = [...rbacPermissions, ...permsInArray];
        if (permsInArray.length > 1) {
          checkAll = true;
        }
      }
      hasFeatureFlagOnly = false;
    } else if (perm.method === 'loosePermissionsKessel' && perm.args) {
      const innerArrays = perm.args.filter((arg): arg is string[] => Array.isArray(arg));
      if (innerArrays.length >= 1) {
        checkAll = false;
        for (const arr of innerArrays) {
          rbacPermissions = [...rbacPermissions, ...arr.filter((p): p is string => typeof p === 'string')];
        }
      }
      hasFeatureFlagOnly = false;
    }
  }

  return { rbacPermissions, requireOrgAdmin, hasFeatureFlagOnly, checkAll };
}

function collectYamlNavItems(
  items: YamlNavItem[],
  result: Map<string, { rbacPermissions: string[]; requireOrgAdmin: boolean; checkAll: boolean }>,
): void {
  for (const item of items) {
    if (item.href && item.permissions) {
      const normalizedPath = normalizePath(item.href);
      const { rbacPermissions, requireOrgAdmin, hasFeatureFlagOnly, checkAll } = extractYamlPermissions(item.permissions);

      if (!hasFeatureFlagOnly) {
        result.set(normalizedPath, { rbacPermissions, requireOrgAdmin, checkAll });
      }
    }

    if (item.routes) {
      collectYamlNavItems(item.routes, result);
    }
  }
}

function normalizePath(path: string): string {
  return (
    path
      .replace(/^\/iam/, '')
      .replace(/\/\*$/, '')
      .replace(/\/$/, '') || '/'
  );
}

// ===========================================
// AST-based Route Extraction
// ===========================================

type PathnameMap = Record<string, { path: string; link: (...args: string[]) => string }>;

/**
 * Build a map from pathnames key -> resolved link path.
 * e.g. 'overview' -> '/user-access/overview'
 */
function buildLinkMap(pathnames: PathnameMap): Map<string, string> {
  const map = new Map<string, string>();
  for (const [key, config] of Object.entries(pathnames)) {
    try {
      const linkPath = config.link('_placeholder_', '_placeholder_');
      map.set(key, normalizePath(linkPath));
    } catch {
      // Some link() functions require specific args; skip those
    }
  }
  return map;
}

/**
 * Build a map from pathnames key -> route path pattern.
 * e.g. 'overview' -> '/user-access/overview/*'
 */
function buildPathMap(pathnames: PathnameMap): Map<string, string> {
  const map = new Map<string, string>();
  for (const [key, config] of Object.entries(pathnames)) {
    map.set(key, config.path);
  }
  return map;
}

/**
 * Parse a Routing.tsx file and extract route -> permissions mappings.
 *
 * Walks the JSX tree looking for:
 * - <Route {...guard(['perm1', 'perm2'])}> — layout route with permissions
 * - <Route {...guard(['perm1'], { checkAll: false })}> — with options
 * - <Route {...guardOrgAdmin()}> — orgAdmin layout route
 * - <Route path={pathnames['key'].path} ...> — leaf/navigable route
 */
function extractRoutesFromFile(
  filePath: string,
  pathnames: PathnameMap,
): Map<string, RoutePermissions> {
  const source = readFileSync(filePath, 'utf-8');
  const ast = parseTs(source, { jsx: true, loc: true, range: true });

  const linkMap = buildLinkMap(pathnames);
  const pathMap = buildPathMap(pathnames);
  const result = new Map<string, RoutePermissions>();

  function isRouteElement(node: TSESTree.JSXOpeningElement): boolean {
    return node.name.type === 'JSXIdentifier' && node.name.name === 'Route';
  }

  /**
   * Extract guard info from a <Route {...guard(...)}>  or <Route {...guardOrgAdmin()}>
   */
  function extractGuardFromRoute(node: TSESTree.JSXOpeningElement): RoutePermissions | null {
    for (const attr of node.attributes) {
      if (attr.type !== 'JSXSpreadAttribute') continue;
      const expr = attr.argument;
      if (expr.type !== 'CallExpression') continue;

      const callee = expr.callee;
      if (callee.type !== 'Identifier') continue;

      if (callee.name === 'guardOrgAdmin' || callee.name === 'v2GuardOrgAdmin') {
        return { permissions: [], checkAll: true, requireOrgAdmin: true };
      }

      if (callee.name === 'guard' || callee.name === 'v2Guard') {
        const permissions: string[] = [];
        let checkAll = true;
        const isV2 = callee.name === 'v2Guard';

        // First arg: permission array
        const firstArg = expr.arguments[0];
        if (firstArg?.type === 'ArrayExpression') {
          for (const el of firstArg.elements) {
            if (el?.type === 'Literal' && typeof el.value === 'string') {
              permissions.push(el.value);
            } else if (isV2 && el?.type === 'MemberExpression') {
              const obj = el.object;
              const prop = el.property;
              if (obj.type === 'Identifier' && prop.type === 'Identifier') {
                const tokenKey = `${obj.name}.${prop.name}`;
                const kesselRelation = V2_TOKEN_TO_KESSEL[tokenKey];
                if (kesselRelation) {
                  permissions.push(kesselRelation);
                }
              }
            }
          }
        }

        // Second arg: options object { checkAll: false }
        const secondArg = expr.arguments[1];
        if (secondArg?.type === 'ObjectExpression') {
          for (const prop of secondArg.properties) {
            if (
              prop.type === 'Property' &&
              prop.key.type === 'Identifier' &&
              prop.key.name === 'checkAll' &&
              prop.value.type === 'Literal' &&
              typeof prop.value.value === 'boolean'
            ) {
              checkAll = prop.value.value;
            }
          }
        }

        return { permissions, checkAll, requireOrgAdmin: false };
      }
    }
    return null;
  }

  /**
   * Extract the pathnames key from a <Route path={pathnames['key'].path}> or
   * <Route path={pathnames.key.path}>
   */
  function extractPathnameKey(node: TSESTree.JSXOpeningElement): string | null {
    for (const attr of node.attributes) {
      if (attr.type !== 'JSXAttribute') continue;
      if (attr.name.type !== 'JSXIdentifier' || attr.name.name !== 'path') continue;

      const value = attr.value;
      if (!value || value.type !== 'JSXExpressionContainer') continue;

      const expr = value.expression;
      if (expr.type !== 'MemberExpression') continue;

      // pathnames['key'].path or pathnames.key.path
      const obj = expr.object;
      if (obj.type !== 'MemberExpression') continue;

      const root = obj.object;
      if (root.type !== 'Identifier' || root.name !== 'pathnames') continue;

      // Get the key
      const prop = obj.property;
      if (prop.type === 'Literal' && typeof prop.value === 'string') {
        return prop.value;
      }
      if (prop.type === 'Identifier') {
        return prop.name;
      }
    }
    return null;
  }

  /**
   * Walk a JSX element tree, accumulating guard permissions.
   */
  function walkJSX(node: TSESTree.Node, guardStack: RoutePermissions[]): void {
    if (node.type === 'JSXElement') {
      const opening = node.openingElement;

      if (isRouteElement(opening)) {
        // Check if this Route has a guard
        const guardInfo = extractGuardFromRoute(opening);

        if (guardInfo) {
          // This is a guard layout route — push permissions and walk children
          const newStack = [...guardStack, guardInfo];
          for (const child of node.children) {
            walkJSX(child, newStack);
          }
          return;
        }

        // Check if this Route has a path
        const pathnameKey = extractPathnameKey(opening);
        if (pathnameKey) {
          const resolvedPath = linkMap.get(pathnameKey);
          if (resolvedPath) {
            // Merge all guard permissions from the stack
            const merged = mergeGuardStack(guardStack);
            result.set(resolvedPath, merged);
          }
        }

        // Walk children regardless (nested routes)
        for (const child of node.children) {
          walkJSX(child, guardStack);
        }
        return;
      }
    }

    // For non-Route elements, walk all children
    if ('children' in node && Array.isArray((node as TSESTree.JSXElement).children)) {
      for (const child of (node as TSESTree.JSXElement).children) {
        walkJSX(child, guardStack);
      }
    }

    // Walk into expression containers
    if (node.type === 'JSXExpressionContainer' && node.expression.type !== 'JSXEmptyExpression') {
      walkJSX(node.expression, guardStack);
    }

    // Walk into logical expressions (e.g. {flag && <Route ...>})
    if (node.type === 'LogicalExpression') {
      walkJSX(node.right, guardStack);
    }

    // Walk into conditional expressions (e.g. {flag ? <Route ...> : null})
    if (node.type === 'ConditionalExpression') {
      walkJSX(node.consequent, guardStack);
      walkJSX(node.alternate, guardStack);
    }

    // Walk into parenthesized expressions
    if (node.type === 'JSXFragment') {
      for (const child of node.children) {
        walkJSX(child, guardStack);
      }
    }

    // Walk program-level and function bodies to find the JSX return
    if (node.type === 'Program') {
      for (const stmt of node.body) {
        walkJSX(stmt, guardStack);
      }
    }

    if (node.type === 'ExportNamedDeclaration' && node.declaration) {
      walkJSX(node.declaration, guardStack);
    }

    if (node.type === 'VariableDeclaration') {
      for (const decl of node.declarations) {
        if (decl.init) walkJSX(decl.init, guardStack);
      }
    }

    if (node.type === 'ArrowFunctionExpression' || node.type === 'FunctionExpression') {
      walkJSX(node.body, guardStack);
    }

    if (node.type === 'FunctionDeclaration' && node.body) {
      walkJSX(node.body, guardStack);
    }

    if (node.type === 'BlockStatement') {
      for (const stmt of node.body) {
        walkJSX(stmt, guardStack);
      }
    }

    if (node.type === 'ReturnStatement' && node.argument) {
      walkJSX(node.argument, guardStack);
    }
  }

  walkJSX(ast, []);
  return result;
}

/**
 * Merge a stack of guard permissions into a single RoutePermissions.
 * The innermost (most specific) guard wins for permissions.
 * If any guard in the chain requires orgAdmin, orgAdmin is required.
 */
function mergeGuardStack(stack: RoutePermissions[]): RoutePermissions {
  if (stack.length === 0) {
    return { permissions: [], checkAll: true, requireOrgAdmin: false };
  }

  // The innermost guard (last in stack) defines the effective permissions.
  // orgAdmin propagates from any level.
  const innermost = stack[stack.length - 1];
  const requireOrgAdmin = stack.some((g) => g.requireOrgAdmin);

  return {
    permissions: innermost.permissions,
    checkAll: innermost.checkAll,
    requireOrgAdmin,
  };
}

// ===========================================
// Comparison
// ===========================================

function permissionsMatch(yamlPerms: string[], routePerms: string[]): boolean {
  const normalize = (perms: string[]) => [...new Set(perms)].sort();
  const a = normalize(yamlPerms);
  const b = normalize(routePerms);

  if (JSON.stringify(a) === JSON.stringify(b)) return true;

  const coveredBy = (perm: string, pattern: string): boolean => {
    if (perm === pattern) return true;
    const pp = perm.split(':');
    const pa = pattern.split(':');
    if (pp.length !== pa.length) return false;
    return pa.every((part, i) => part === '*' || part === pp[i]);
  };

  const allCovered = (perms: string[], patterns: string[]): boolean =>
    perms.every((p) => patterns.some((pat) => coveredBy(p, pat)));

  return allCovered(a, b) && allCovered(b, a);
}

// ===========================================
// Main
// ===========================================

function main(): void {
  console.log(`${COLORS.bold}Permission Sync Validation${COLORS.reset}`);
  console.log('==========================\n');

  const root = resolve(__dirname, '..');

  // Parse frontend.yaml
  const frontendYaml: FrontendYaml = parseYaml(readFileSync(resolve(root, 'deploy/frontend.yaml'), 'utf-8'));
  const yamlRoutes = new Map<string, { rbacPermissions: string[]; requireOrgAdmin: boolean; checkAll: boolean }>();
  for (const obj of frontendYaml.objects) {
    for (const segment of obj.spec.bundleSegments || []) {
      collectYamlNavItems(segment.navItems || [], yamlRoutes);
    }
  }

  // Extract routes from V1 and V2 Routing.tsx
  console.log(`${COLORS.cyan}Parsing src/v1/Routing.tsx...${COLORS.reset}`);
  const v1Routes = extractRoutesFromFile(
    resolve(root, 'src/v1/Routing.tsx'),
    v1Pathnames as unknown as PathnameMap,
  );

  console.log(`${COLORS.cyan}Parsing src/v2/Routing.tsx...${COLORS.reset}`);
  const v2Routes = extractRoutesFromFile(
    resolve(root, 'src/v2/Routing.tsx'),
    v2Pathnames as unknown as PathnameMap,
  );

  // Merge V1 + V2 route maps
  const allRoutes = new Map<string, RoutePermissions>();
  for (const [path, perms] of v1Routes) allRoutes.set(path, perms);
  for (const [path, perms] of v2Routes) allRoutes.set(path, perms);

  console.log(`\nFound ${v1Routes.size} V1 routes, ${v2Routes.size} V2 routes`);
  console.log(`Checking ${yamlRoutes.size} frontend.yaml nav items...\n`);

  let passed = 0;
  let failed = 0;
  let skipped = 0;
  const errors: string[] = [];

  for (const [path, yamlConfig] of yamlRoutes) {
    const routeConfig = allRoutes.get(path);

    if (!routeConfig) {
      console.log(`${COLORS.yellow}? ${path}: not found in Routing (feature-flagged or external?)${COLORS.reset}`);
      skipped++;
      continue;
    }

    // Check orgAdmin
    if (yamlConfig.requireOrgAdmin !== routeConfig.requireOrgAdmin) {
      errors.push(
        `${COLORS.red}✗ ${path}:${COLORS.reset}\n` +
          `    frontend.yaml: ${yamlConfig.requireOrgAdmin ? 'isOrgAdmin' : 'loosePermissions'}\n` +
          `    Routing.tsx:   ${routeConfig.requireOrgAdmin ? 'guardOrgAdmin()' : 'guard([...])'}`,
      );
      failed++;
      continue;
    }

    // Check permissions
    if (!yamlConfig.requireOrgAdmin && !permissionsMatch(yamlConfig.rbacPermissions, routeConfig.permissions)) {
      errors.push(
        `${COLORS.red}✗ ${path}:${COLORS.reset}\n` +
          `    frontend.yaml: [${yamlConfig.rbacPermissions.join(', ')}]\n` +
          `    Routing.tsx:   [${routeConfig.permissions.join(', ')}]`,
      );
      failed++;
      continue;
    }

    // Check AND/OR logic
    if (
      !yamlConfig.requireOrgAdmin &&
      yamlConfig.rbacPermissions.length > 1 &&
      yamlConfig.checkAll !== routeConfig.checkAll
    ) {
      errors.push(
        `${COLORS.red}✗ ${path}: logic mismatch${COLORS.reset}\n` +
          `    frontend.yaml: ${yamlConfig.checkAll ? 'AND' : 'OR'}\n` +
          `    Routing.tsx:   ${routeConfig.checkAll ? 'AND' : 'OR'}`,
      );
      failed++;
      continue;
    }

    const logicStr = yamlConfig.rbacPermissions.length > 1 ? (yamlConfig.checkAll ? ' [AND]' : ' [OR]') : '';
    const permStr = yamlConfig.requireOrgAdmin
      ? 'requireOrgAdmin'
      : (yamlConfig.rbacPermissions.join(', ') || '(public)') + logicStr;
    console.log(`${COLORS.green}✓ ${path}: ${permStr}${COLORS.reset}`);
    passed++;
  }

  if (errors.length > 0) {
    console.log('\n' + errors.join('\n\n'));
  }

  console.log(`\n${COLORS.bold}Summary${COLORS.reset}`);
  console.log('-------');
  console.log(`${COLORS.green}Passed: ${passed}${COLORS.reset}`);
  console.log(`${COLORS.red}Failed: ${failed}${COLORS.reset}`);
  console.log(`${COLORS.yellow}Skipped: ${skipped}${COLORS.reset}`);

  if (failed > 0) {
    console.log(`\n${COLORS.red}${COLORS.bold}${failed} mismatch(es) found.${COLORS.reset}`);
    console.log('Update frontend.yaml or Routing.tsx to fix.');
    process.exit(1);
  } else {
    console.log(`\n${COLORS.green}${COLORS.bold}All permissions in sync!${COLORS.reset}`);
  }
}

main();
