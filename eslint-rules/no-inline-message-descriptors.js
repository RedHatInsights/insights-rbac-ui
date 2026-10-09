/**
 * ESLint Rule: no-inline-message-descriptors
 *
 * Errors when a react-intl message descriptor is declared inline instead of
 * centrally in src/Messages.js:
 *
 *   intl.formatMessage({
 *     id: 'someId',
 *     defaultMessage: 'Some text',      // ← inline descriptor
 *   });
 *
 *   <FormattedMessage defaultMessage="Some text" />   // ← literal prop
 *
 *   const messages = defineMessages({ ... });          // ← local registry
 *
 * Rationale: the translation pipeline only knows about src/Messages.js.
 * `translations:extract` globs `src/*.js` (Messages.js), so inline descriptors
 * are never extracted, never reach Phrase, and never come back translated —
 * they render their English defaultMessage in every locale forever. The
 * Storybook tooling (Jawa pseudo-locale, missing-translation markers) is also
 * built from Messages.js, so inline descriptors are invisible to both checks.
 *
 * Stories, tests, and user journeys legitimately construct ad-hoc catalogs
 * and are exempt via the eslint.config.js file scoping for this rule.
 */

/** @type {import('eslint').Rule.RuleModule} */
module.exports = {
  meta: {
    type: 'problem',
    docs: {
      description: 'Ban inline react-intl message descriptors outside src/Messages.js',
    },
    messages: {
      noInlineDescriptor:
        'Inline message descriptor. Declare it in src/Messages.js and reference it (e.g. intl.formatMessage(messages.someId)). Inline descriptors are invisible to formatjs extraction, never reach Phrase, and always render their English defaultMessage.',
      noLocalDefineMessages:
        'defineMessages() is only allowed in src/Messages.js. Move these descriptors to the central registry so extraction and the Storybook translation tooling can see them.',
    },
    schema: [],
  },
  create(context) {
    const filename = context.filename || context.getFilename();
    if (filename.endsWith('Messages.js')) {
      return {};
    }

    /** String literal or template literal without expressions. */
    function isStaticString(node) {
      if (!node) return false;
      if (node.type === 'Literal') return typeof node.value === 'string';
      if (node.type === 'TemplateLiteral') return node.expressions.length === 0;
      return false;
    }

    return {
      // { defaultMessage: '...' } inside object literals (descriptor objects)
      Property(node) {
        if (node.key.type !== 'Identifier' || node.key.name !== 'defaultMessage') return;
        if (node.parent.type !== 'ObjectExpression') return;
        if (node.value.type === 'JSXExpressionContainer') return; // not valid here, ignore
        if (isStaticString(node.value)) {
          context.report({ node, messageId: 'noInlineDescriptor' });
        }
      },
      // defineMessages({...}) outside src/Messages.js
      CallExpression(node) {
        if (node.callee.type === 'Identifier' && node.callee.name === 'defineMessages') {
          context.report({ node, messageId: 'noLocalDefineMessages' });
        }
      },
      // <FormattedMessage defaultMessage="..." />
      JSXAttribute(node) {
        if (node.name.name !== 'defaultMessage') return;
        const value = node.value;
        if (value && value.type === 'Literal' && typeof value.value === 'string') {
          context.report({ node, messageId: 'noInlineDescriptor' });
        }
        if (value && value.type === 'JSXExpressionContainer' && isStaticString(value.expression)) {
          context.report({ node, messageId: 'noInlineDescriptor' });
        }
      },
    };
  },
};
