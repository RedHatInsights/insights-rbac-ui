/**
 * ESLint Rule: extractable-message-descriptor
 *
 * FormatJS extraction only reads a message descriptor ({ id, defaultMessage })
 * written directly as the first argument of formatMessage()/defineMessage(),
 * or as a value inside defineMessages({ ... }). Descriptors anywhere else
 * (ternary branches, config objects, variables) render at runtime from their
 * defaultMessage but silently disappear from the translation catalog.
 *
 * Bad:  intl.formatMessage(isAdmin ? { id: 'admin', ... } : { id: 'viewer', ... })
 * Good: const messages = defineMessages({ admin: { ... }, viewer: { ... } });
 *       intl.formatMessage(isAdmin ? messages.admin : messages.viewer)
 */

const EXTRACTABLE_CALLS = new Set(['formatMessage', 'defineMessage', '$t', '$formatMessage']);

const keyName = (property) =>
  property.type === 'Property' && !property.computed ? (property.key.type === 'Identifier' ? property.key.name : property.key.value) : undefined;

const calleeName = (call) => {
  if (call.callee.type === 'Identifier') return call.callee.name;
  if (call.callee.type === 'MemberExpression' && !call.callee.computed) return call.callee.property.name;
  return undefined;
};

const isExtractable = (node) => {
  const parent = node.parent;
  if (parent.type === 'CallExpression' && parent.arguments[0] === node) {
    return EXTRACTABLE_CALLS.has(calleeName(parent));
  }
  if (parent.type === 'Property' && parent.value === node && parent.parent.type === 'ObjectExpression') {
    const call = parent.parent.parent;
    return call.type === 'CallExpression' && call.arguments[0] === parent.parent && calleeName(call) === 'defineMessages';
  }
  return false;
};

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Require message descriptors to be written where FormatJS extraction can read them',
    },
    messages: {
      notExtractable:
        "Message '{{id}}' is not extractable by FormatJS. Pass the descriptor directly to intl.formatMessage(), or declare it with defineMessage()/defineMessages() and reference that.",
    },
    schema: [],
  },
  create(context) {
    return {
      ObjectExpression(node) {
        const keys = new Map(node.properties.map((p) => [keyName(p), p]));
        const id = keys.get('id');
        if (!id || !keys.has('defaultMessage') || id.value.type !== 'Literal' || typeof id.value.value !== 'string') return;
        if (!isExtractable(node)) {
          context.report({ node, messageId: 'notExtractable', data: { id: id.value.value } });
        }
      },
    };
  },
};
