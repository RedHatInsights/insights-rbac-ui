/**
 * ESLint Rule: no-cross-version-imports
 *
 * Enforces strict import boundaries between V1, V2, and shared code:
 *   - src/v1/ cannot import from src/v2/
 *   - src/v2/ cannot import from src/v1/
 *   - Any file outside src/v1/ and src/v2/ cannot import from either
 *     (this covers src/shared/ and prevents rogue paths like src/data/
 *     or src/features/ from bypassing the boundary)
 *
 * Additional:
 *   - No file can import permissionsContext (deleted)
 *
 * Note: useAccessPermissions and useUserData are V1-only (src/v1/hooks/).
 * useIdentity is in src/shared/ and is the shared Chrome identity primitive.
 * V2 uses Kessel domain hooks for RBAC permissions and useNonRbacPermissions
 * (shared) for non-RBAC domains (cost-management, inventory).
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
      sharedImportsVersioned:
        'Non-versioned code cannot import from {{version}}. Files outside src/v1/ and src/v2/ must not depend on versioned code. Move shared code to src/shared/.',
      noPermissionsContext: 'permissionsContext has been deleted. Use useUserData() (V1) or domain hooks (V2) directly.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.getFilename();
    const normalizedFilename = filename.replace(/\\/g, '/');

    const isInSrc = normalizedFilename.includes('/src/');
    const isV1 = normalizedFilename.includes('/src/v1/');
    const isV2 = normalizedFilename.includes('/src/v2/');

    // Entry points that must bridge into versioned code:
    // - src/Iam.tsx: app shell rendering V1 or V2
    // - src/federated-modules/*: module federation wrappers exposing V2 components
    const isEntryPoint =
      normalizedFilename.endsWith('/src/Iam.tsx') || normalizedFilename.includes('/src/federated-modules/');
    const isNonVersioned = isInSrc && !isV1 && !isV2 && !isEntryPoint;

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

      // Check: any non-versioned src/ file cannot import V1 or V2
      // This covers src/shared/, src/docs/, and prevents rogue paths
      // like src/data/ or src/features/ from bypassing the boundary.
      if (isNonVersioned && resolvedImport.includes('/src/v1/')) {
        context.report({ node, messageId: 'sharedImportsVersioned', data: { version: 'V1' } });
        return;
      }
      if (isNonVersioned && resolvedImport.includes('/src/v2/')) {
        context.report({ node, messageId: 'sharedImportsVersioned', data: { version: 'V2' } });
        return;
      }

      // useAccessPermissions is now in src/v1/ so V2 importing it is already
      // caught by the V2→V1 boundary check above. No additional check needed.
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
