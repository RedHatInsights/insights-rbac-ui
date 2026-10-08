import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, screen, within } from 'storybook/test';
import { DeleteGroupModal } from '../v2/features/users-and-user-groups/users-and-user-groups/user-groups/components/DeleteGroupModal';
import type { Group } from '../v2/data/queries/groups';
import { WorkspacesEmptyState } from '../v2/features/workspaces/components/WorkspacesEmptyState';

const group = (uuid: string, name: string): Group => ({
  uuid,
  name,
  description: '',
  principalCount: 0,
  roleCount: 0,
  created: '2023-01-01T00:00:00Z',
  modified: '2023-01-01T00:00:00Z',
  platform_default: false,
  admin_default: false,
  system: false,
});

const meta: Meta<typeof DeleteGroupModal> = {
  title: 'Documentation/Locale Switching',
  component: DeleteGroupModal,
  tags: ['autodocs'],
  args: {
    isOpen: true,
    groups: [group('1', 'Platform admins')],
    onClose: fn(),
    onConfirm: fn(),
  },
  parameters: {
    docs: {
      description: {
        component: `
Demonstrates independent locale-catalog loading in Storybook; the application runtime still selects English.

The preview decorator dynamically loads only the catalog selected by the **Locale** toolbar (or a story's
\`globals.locale\`). English uses \`src/locales/en.json\`; \`zh-CN\` loads the small demo catalog in
\`.storybook/locales/zh-CN.demo.json\`, kept outside production catalogs. Missing IDs fall back through each descriptor's
English \`defaultMessage\` (see **Chinese Partial Translation**). \`src/docs/localeDemoCatalog.test.ts\` keeps demo IDs and
ICU placeholders in sync with the English source.

Chinese has only the \`other\` plural category, so the demo body uses \`=1\` to keep the single-group wording. The
Cancel button and checkbox label are PatternFly \`WarningModal\` defaults that the app does not translate yet.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const English: Story = {
  globals: { locale: 'en' },
  play: async () => {
    const modal = await screen.findByRole('dialog');
    await expect(within(modal).findByRole('heading', { name: /Delete user group\?/ })).resolves.toBeInTheDocument();
    await expect(within(modal).findByRole('button', { name: 'Delete' })).resolves.toBeInTheDocument();
  },
};

export const ChineseSingleGroup: Story = {
  globals: { locale: 'zh-CN' },
  play: async () => {
    const modal = await screen.findByRole('dialog');
    await expect(within(modal).findByRole('heading', { name: /删除用户组？/ })).resolves.toBeInTheDocument();
    await expect(within(modal).findByText('Platform admins')).resolves.toBeInTheDocument();
    await expect(within(modal).findByText(/将影响用户访问配置/)).resolves.toBeInTheDocument();
    await expect(within(modal).findByRole('button', { name: '删除' })).resolves.toBeInTheDocument();
  },
};

export const ChineseMultipleGroups: Story = {
  globals: { locale: 'zh-CN' },
  args: {
    groups: [group('1', 'Platform admins'), group('2', 'Auditors'), group('3', 'Developers')],
  },
  play: async () => {
    const modal = await screen.findByRole('dialog');
    await expect(within(modal).findByText('删除 3 个用户组将影响用户访问配置。')).resolves.toBeInTheDocument();
  },
};

// Partial delivery: the demo catalog translates the title but not the subtitle,
// so the subtitle falls back to the English source message.
export const ChinesePartialTranslation: Story = {
  globals: { locale: 'zh-CN' },
  tags: ['locale-catalog'],
  render: () => <WorkspacesEmptyState />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByRole('heading', { name: '未找到工作区' })).resolves.toBeInTheDocument();
    await expect(canvas.findByText('This filter criteria matches no workspaces. Try changing your filter input.')).resolves.toBeInTheDocument();
  },
};
