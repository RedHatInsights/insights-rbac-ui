import React from 'react';
import { render, screen } from '@testing-library/react';
import { useIntl } from 'react-intl';
import { describe, expect, it, vi } from 'vitest';
import { IntlMessagesProvider } from './IntlMessagesProvider';
import { loadLocaleMessages } from './localeCatalogs';

const Greeting: React.FC = () => {
  const intl = useIntl();
  return (
    <>
      <span>{intl.formatMessage({ id: 'greeting', defaultMessage: 'Hello' })}</span>
      <span>{intl.formatMessage({ id: 'untranslated', defaultMessage: 'English fallback' })}</span>
    </>
  );
};

describe('IntlMessagesProvider', () => {
  it('loads only the selected catalog and falls back to descriptor defaults', async () => {
    const loadMessages = vi.fn(async (selectedLocale: string) => {
      expect(selectedLocale).toBe('zh-CN');
      return { greeting: '你好' };
    });

    render(
      <IntlMessagesProvider locale="zh-CN" loadMessages={loadMessages} fallback={<span>Loading catalog</span>}>
        <Greeting />
      </IntlMessagesProvider>,
    );

    expect(screen.getByText('Loading catalog')).toBeInTheDocument();
    expect(await screen.findByText('你好')).toBeInTheDocument();
    expect(screen.getByText('English fallback')).toBeInTheDocument();
    expect(loadMessages).toHaveBeenCalledTimes(1);
  });

  it('loads the production English catalog from its own module', async () => {
    const messages = await loadLocaleMessages('en');

    expect(messages.delete).toBe('Delete');
  });
});
