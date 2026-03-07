/**
 * ESLint Rule: no-cross-version-imports
 *
 * Enforces strict import boundaries between V1, V2, and shared code:
 *   - src/v1/ cannot import from src/v2/
 *   - src/v2/ cannot import from src/v1/
 *   - src/shared/ cannot import from src/v1/ or src/v2/
 *
 * Additional:
 *   - V2 RBAC feature islands (roles, groups, workspaces) cannot import
 *     useAccessPermissions — use Kessel domain hooks instead.
 *     Other V2 code may use useAccessPermissions for non-RBAC domains.
 *   - No file can import permissionsContext (deleted)
 *
 * Note: useUserData is in src/shared/ and is intentionally used by both V1 and V2.
 */

const path = require('path');

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Enforce V1/V2/shared import boundaries',
    },
    messages: {
      v1ImportsV2: 'V1 code cannot import from V2. Move shared code to src/shared/.',
      v2ImportsV1: 'V2 code cannot import from V1. Use V2 or shared data layers instead.',
      sharedImportsVersioned: 'Shared code cannot import from {{version}}. Only V1/V2 can import from shared.',
      noLegacyPermissionsInV2:
        'V2 RBAC feature islands (roles, groups, workspaces) must use Kessel domain hooks from src/v2/hooks/useRbacAccess.ts, not useAccessPermissions. If this file checks non-RBAC permissions (e.g. cost-management), disable this rule with a comment explaining why.',
      noPermissionsContext: 'permissionsContext has been deleted. Use useUserData() (V1) or domain hooks (V2) directly.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    const normalizedFilename = filename.replace(/\\/g, '/');

    const isV1 = normalizedFilename.includes('/src/v1/');
    const isV2 = normalizedFilename.includes('/src/v2/');
    const isShared = normalizedFilename.includes('/src/shared/');

    function checkImport(node, importPath) {
      if (!importPath || typeof importPath !== 'string') return;

      // Only check relative imports
      if (!importPath.startsWith('.')) return;

      const resolvedImport = path.resolve(path.dirname(filename), importPath).replace(/\\/g, '/');

      // Check: no file imports permissionsContext
      if (resolvedImport.includes('permissionsContext') || importPath.includes('permissionsContext')) {
        context.report({ node, messageId: 'noPermissionsContext' });
        return;
      }

      // Check: V1 cannot import V2
      if (isV1 && resolvedImport.includes('/src/v2/')) {
        context.report({ node, messageId: 'v1ImportsV2' });
        return;
      }

      // Check: V2 cannot import V1
      if (isV2 && resolvedImport.includes('/src/v1/')) {
        context.report({ node, messageId: 'v2ImportsV1' });
        return;
      }

      // Check: shared cannot import V1 or V2
      if (isShared && resolvedImport.includes('/src/v1/')) {
        context.report({ node, messageId: 'sharedImportsVersioned', data: { version: 'V1' } });
        return;
      }
      if (isShared && resolvedImport.includes('/src/v2/')) {
        context.report({ node, messageId: 'sharedImportsVersioned', data: { version: 'V2' } });
        return;
      }

      // Check: V2 RBAC feature islands cannot import useAccessPermissions
      // These islands have Kessel domain hook equivalents.
      // Other V2 code may use useAccessPermissions for non-RBAC domains (cost, inventory).
      if (isV2 && importPath.includes('useAccessPermissions')) {
        const KESSEL_FEATURE_ISLANDS = [
          '/src/v2/features/roles/',
          '/src/v2/features/users-and-user-groups/',
          '/src/v2/features/workspaces/',
        ];
        if (KESSEL_FEATURE_ISLANDS.some((island) => normalizedFilename.includes(island))) {
          context.report({
            node,
            messageId: 'noLegacyPermissionsInV2',
          });
        }
      }
    }

    return {
      ImportDeclaration(node) {
        checkImport(node, node.source.value);
      },
      CallExpression(node) {
        if (
          node.callee.type === 'Identifier' &&
          node.callee.name === 'require' &&
          node.arguments.length > 0 &&
          node.arguments[0].type === 'Literal'
        ) {
          checkImport(node, node.arguments[0].value);
        }
        if (
          node.callee.type === 'Import' &&
          node.arguments.length > 0 &&
          node.arguments[0].type === 'Literal'
        ) {
          checkImport(node, node.arguments[0].value);
        }
      },
    };
  },
};
