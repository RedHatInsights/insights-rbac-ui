/**
 * ESLint Rule: no-direct-get-user
 *
 * Errors when `getUser` is accessed from `usePlatformAuth()` in any form:
 *
 *   const { getUser } = usePlatformAuth();          // destructuring
 *   const auth = usePlatformAuth(); auth.getUser();  // property access
 *   usePlatformAuth().getUser();                     // inline call
 *
 * Rationale: getUser() returns a new Promise on every call. Putting it in a
 * useEffect dependency array causes infinite re-render loops that freeze the
 * page. useUserData() provides the same identity data through a stable,
 * centralized hook that resolves once and caches the result.
 *
 * The single legitimate consumer (useUserData.ts) suppresses this rule with
 * an inline eslint-disable comment.
 */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban getUser() from usePlatformAuth() to prevent infinite re-render loops',
    },
    messages: {
      noGetUser:
        'Do not use getUser() from usePlatformAuth(). Use useUserData() from src/hooks/useUserData.ts instead — it provides stable, centralized user identity data without re-render loops.',
    },
    schema: [],
  },
  create(context) {
    const platformAuthVars = new Set();

    return {
      VariableDeclarator(node) {
        if (
          node.init &&
          node.init.type === 'CallExpression' &&
          node.init.callee.type === 'Identifier' &&
          node.init.callee.name === 'usePlatformAuth'
        ) {
          // Pattern 1: const { getUser } = usePlatformAuth()
          if (node.id.type === 'ObjectPattern') {
            for (const prop of node.id.properties) {
              if (prop.type === 'Property' && prop.key.type === 'Identifier' && prop.key.name === 'getUser') {
                context.report({ node: prop, messageId: 'noGetUser' });
              }
            }
          }

          // Track variable name for property access detection
          if (node.id.type === 'Identifier') {
            platformAuthVars.add(node.id.name);
          }
        }
      },

      MemberExpression(node) {
        if (node.property.type !== 'Identifier' || node.property.name !== 'getUser') {
          return;
        }

        // Pattern 2: auth.getUser where auth = usePlatformAuth()
        if (node.object.type === 'Identifier' && platformAuthVars.has(node.object.name)) {
          context.report({ node, messageId: 'noGetUser' });
          return;
        }

        // Pattern 3: usePlatformAuth().getUser()
        if (
          node.object.type === 'CallExpression' &&
          node.object.callee.type === 'Identifier' &&
          node.object.callee.name === 'usePlatformAuth'
        ) {
          context.report({ node, messageId: 'noGetUser' });
        }
      },
    };
  },
};
