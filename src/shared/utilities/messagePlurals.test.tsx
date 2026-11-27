import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { createIntl, createIntlCache } from 'react-intl';
import { describe, expect, it } from 'vitest';
import messages from '../../Messages';
import sourceCatalog from '../../../locales/translation-template.json';

const messageIds = ['removeServiceAccountsText', 'deleteWorkspaceModalBody', 'deleteUserGroupModalBody', 'deleteCustomRoleModalBody'] as const;
const selectedName = 'Selected item';
const groupName = 'Selected group';
const cache = createIntlCache();

// Exercise the source patterns as locale messages: grammatical "one" is not exact count 1.
describe.each(['en', 'fr', 'ja', 'ko', 'zh-CN'])('Exact-count source messages in %s', (locale) => {
  describe.each(messageIds)('%s', (id) => {
    const intl = createIntl(
      {
        locale,
        messages: { [id]: messages[id].defaultMessage },
        onError: (error) => {
          throw error;
        },
      },
      cache,
    );

    const renderMessage = (count: number) =>
      renderToStaticMarkup(
        <>
          {intl.formatMessage(messages[id], {
            count,
            name: selectedName,
            group: groupName,
            b: (chunks) => <b>{chunks}</b>,
          })}
        </>,
      );

    it('shows the selected item name in bold for exactly one item', () => {
      const output = renderMessage(1);
      expect(output).toContain(`<b>${selectedName}</b>`);
      if (id === 'removeServiceAccountsText') {
        expect(output).toContain(`<b>${groupName}</b>`);
      }
    });

    it.each([0, 2, 5])('shows the count, not a selected item name, for %i items', (count) => {
      const output = renderMessage(count);
      expect(output).toContain(String(count));
      expect(output).not.toContain(selectedName);
      if (id === 'removeServiceAccountsText') {
        expect(output).toContain(`<b>${groupName}</b>`);
      }
    });
  });
});

describe('Exact-count source catalog extraction', () => {
  it.each(messageIds)('%s matches its source descriptor', (id) => {
    expect(sourceCatalog[id].defaultMessage).toBe(messages[id].defaultMessage);
  });
});
