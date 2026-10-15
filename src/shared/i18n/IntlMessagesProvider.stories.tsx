import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, sb, waitFor, within } from 'storybook/test';
import { useIntl } from 'react-intl';
import { messageCatalogs } from './messageCatalogs';
import { IntlMessagesProvider } from './IntlMessagesProvider';
import messageDescriptors from '../../Messages';

sb.mock(import('./messageCatalogs.ts'));

const enDefaults = Object.fromEntries(Object.entries(messageDescriptors).map(([k, v]) => [k, v.defaultMessage as string]));

function catalog(translations: Record<string, string>) {
  const messages = Object.fromEntries(
    Object.entries(enDefaults).map(([k, v]) => [k, k in translations ? translations[k] : `\u{1F6A8} UNTRANSLATED \u{1F6A8} ${v}`]),
  );
  return () => Promise.resolve({ default: messages });
}

function TestHarness({ messageId, defaultMessage }: { messageId: string; defaultMessage?: string }) {
  const intl = useIntl();
  return (
    <div>
      <div data-testid="formatted">{intl.formatMessage({ id: messageId, defaultMessage: defaultMessage ?? `[default: ${messageId}]` })}</div>
      <div data-testid="locale">{intl.locale}</div>
    </div>
  );
}

const meta: Meta = {
  title: 'Components/IntlMessagesProvider',
  tags: ['i18n'],
  component: IntlMessagesProvider,
  parameters: {
    noWrapping: true,
  },
};

export default meta;
type Story = StoryObj;

export const LoadsEnglish: Story = {
  render: () => (
    <IntlMessagesProvider locale="en">
      <TestHarness messageId="add" defaultMessage="Add" />
    </IntlMessagesProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const formatted = await canvas.findByTestId('formatted');
    expect(formatted.textContent).toBe('Add');
    const locale = await canvas.findByTestId('locale');
    expect(locale.textContent).toBe('en');
  },
};

export const French: Story = {
  beforeEach: () => {
    messageCatalogs.fr = catalog({ add: 'Ajouter', cancel: 'Annuler', save: 'Enregistrer' });
  },
  render: () => (
    <IntlMessagesProvider locale="fr">
      <TestHarness messageId="add" defaultMessage="Add" />
    </IntlMessagesProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      const formatted = canvas.queryByTestId('formatted');
      expect(formatted.textContent).toBe('Ajouter');
    });
    const locale = await canvas.findByTestId('locale');
    expect(locale.textContent).toBe('fr');
  },
};

export const Korean: Story = {
  beforeEach: () => {
    messageCatalogs.ko = catalog({ add: '추가', cancel: '취소', save: '저장' });
  },
  render: () => (
    <IntlMessagesProvider locale="ko">
      <TestHarness messageId="add" defaultMessage="Add" />
    </IntlMessagesProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      const formatted = canvas.queryByTestId('formatted');
      expect(formatted.textContent).toBe('추가');
    });
  },
};

export const Chinese: Story = {
  beforeEach: () => {
    messageCatalogs['zh-CN'] = catalog({ add: '添加', cancel: '取消', save: '保存' });
  },
  render: () => (
    <IntlMessagesProvider locale="zh-CN">
      <TestHarness messageId="add" defaultMessage="Add" />
    </IntlMessagesProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      const formatted = canvas.queryByTestId('formatted');
      expect(formatted.textContent).toBe('添加');
    });
  },
};

export const Japanese: Story = {
  beforeEach: () => {
    messageCatalogs.ja = catalog({ add: '追加', cancel: 'キャンセル', save: '保存' });
  },
  render: () => (
    <IntlMessagesProvider locale="ja">
      <TestHarness messageId="add" defaultMessage="Add" />
    </IntlMessagesProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      const formatted = canvas.queryByTestId('formatted');
      expect(formatted.textContent).toBe('追加');
    });
  },
};

export const MissingTranslationShowsMarker: Story = {
  beforeEach: () => {
    messageCatalogs.fr = catalog({ add: 'Ajouter' });
  },
  render: () => (
    <IntlMessagesProvider locale="fr">
      <TestHarness messageId="accessManagementDoc" defaultMessage="Understanding access management" />
    </IntlMessagesProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(async () => {
      const formatted = canvas.queryByTestId('formatted');
      expect(formatted.textContent).toContain('UNTRANSLATED');
      expect(formatted.textContent).toContain('Understanding access management');
    });
  },
};

export const SlowNetworkLoad: Story = {
  beforeEach: () => {
    messageCatalogs.fr = () =>
      new Promise((resolve) =>
        setTimeout(() => {
          const messages = Object.fromEntries(Object.entries(enDefaults).map(([k, v]) => [k, `[FR] ${v}`]));
          resolve({ default: messages });
        }, 2000),
      );
  },
  render: () => (
    <IntlMessagesProvider locale="fr">
      <TestHarness messageId="add" defaultMessage="Add" />
    </IntlMessagesProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      async () => {
        const formatted = canvas.queryByTestId('formatted');
        expect(formatted.textContent).toBe('[FR] Add');
      },
      { timeout: 5000 },
    );
  },
};

export const FailedLoadFallsBackToDefaultMessage: Story = {
  beforeEach: () => {
    messageCatalogs.fr = () => Promise.reject(new Error('Network error'));
  },
  render: () => (
    <IntlMessagesProvider locale="fr">
      <TestHarness messageId="add" defaultMessage="Add" />
    </IntlMessagesProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const formatted = await canvas.findByTestId('formatted');
    expect(formatted.textContent).toBe('Add');
  },
};

export const UnknownLocaleFallsBackToDefaultMessage: Story = {
  render: () => (
    <IntlMessagesProvider locale="xx-XX">
      <TestHarness messageId="add" defaultMessage="Add" />
    </IntlMessagesProvider>
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const formatted = await canvas.findByTestId('formatted');
    expect(formatted.textContent).toBe('Add');
  },
};
