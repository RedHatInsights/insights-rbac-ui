import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React, { useState } from 'react';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { clearAndType } from '../../../../../test-utils/interactionHelpers';
import { InlineWorkspacePicker } from './InlineWorkspacePicker';
import { type TreeViewWorkspaceItem } from './TreeViewWorkspaceItem';
import { BrowserRouter } from 'react-router-dom';
import { IntlProvider } from 'react-intl';
import { workspacesErrorHandlers, workspacesHandlers, workspacesLoadingHandlers } from '../../../../data/mocks/workspaces.handlers';

const pickerWorkspaces = [
  {
    id: 'ws-root',
    name: 'Root Workspace',
    description: 'Organization root',
    parent_id: undefined,
    type: 'root' as const,
    created: '2024-01-01T00:00:00Z',
    modified: '2024-01-01T00:00:00Z',
  },
  {
    id: 'ws-prod',
    name: 'Production',
    description: 'Production workspace',
    parent_id: 'ws-root',
    type: 'standard' as const,
    created: '2024-01-02T00:00:00Z',
    modified: '2024-01-02T00:00:00Z',
  },
  {
    id: 'ws-staging',
    name: 'Staging',
    description: 'Staging workspace',
    parent_id: 'ws-root',
    type: 'standard' as const,
    created: '2024-01-03T00:00:00Z',
    modified: '2024-01-03T00:00:00Z',
  },
  {
    id: 'ws-dev',
    name: 'Dev Cluster',
    description: 'Dev environment',
    parent_id: 'ws-prod',
    type: 'standard' as const,
    created: '2024-01-04T00:00:00Z',
    modified: '2024-01-04T00:00:00Z',
  },
];

const ALL_IDS = pickerWorkspaces.map((w) => w.id);

const PickerWrapper: React.FC<{
  onSelect: (ws: TreeViewWorkspaceItem | null) => void;
  requiredPermission?: 'create' | 'move';
  extraDisabledIds?: Set<string>;
  extraDisabledTooltipOverrides?: Map<string, string>;
  allExpanded?: boolean;
}> = ({ onSelect, ...rest }) => {
  const [selected, setSelected] = useState<TreeViewWorkspaceItem | undefined>();
  return (
    <div style={{ maxWidth: 600, padding: 16 }}>
      <InlineWorkspacePicker
        {...rest}
        selectedWorkspace={selected}
        onSelect={(ws) => {
          setSelected(ws ?? undefined);
          onSelect(ws);
        }}
      />
      {selected && (
        <p data-testid="selection-result" style={{ marginTop: 12 }}>
          Selected: {selected.name}
        </p>
      )}
    </div>
  );
};

const meta: Meta<typeof InlineWorkspacePicker> = {
  component: InlineWorkspacePicker,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <IntlProvider locale="en" messages={{}}>
          <Story />
        </IntlProvider>
      </BrowserRouter>
    ),
  ],
  parameters: {
    workspacePermissions: {
      view: ALL_IDS,
      edit: ALL_IDS,
      delete: ALL_IDS,
      create: ALL_IDS,
      move: ALL_IDS,
    },
    msw: {
      handlers: [...workspacesHandlers(pickerWorkspaces)],
    },
    docs: {
      description: {
        component: `
Reusable inline workspace tree picker with search, permission gating, and custom disabled states.
Used by the create-workspace wizard and the move-workspace dialog.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => <PickerWrapper onSelect={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByLabelText(/search workspaces/i)).resolves.toBeInTheDocument();
    await expect(canvas.findByRole('tree')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Root Workspace')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Production')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Dev Cluster')).resolves.toBeInTheDocument();
  },
};

export const Selection: Story = {
  name: 'Select a workspace',
  render: () => {
    const spy = fn();
    return <PickerWrapper onSelect={spy} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    const tree = await canvas.findByRole('tree');
    const target = await within(tree).findByText('Production');
    await user.click(target);

    await expect(canvas.findByTestId('selection-result')).resolves.toHaveTextContent('Selected: Production');
  },
};

export const Search: Story = {
  name: 'Search filtering',
  render: () => <PickerWrapper onSelect={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    const searchInput = await canvas.findByLabelText(/search workspaces/i);
    await clearAndType(user, () => searchInput as HTMLInputElement, 'staging');

    const tree = await canvas.findByRole('tree');
    await expect(within(tree).findByText('Staging')).resolves.toBeInTheDocument();
    await expect(within(tree).queryByText('Dev Cluster')).not.toBeInTheDocument();
  },
};

export const WithPermissionGating: Story = {
  name: 'Permission-gated (create)',
  parameters: {
    workspacePermissions: {
      view: ALL_IDS,
      edit: ALL_IDS,
      delete: ALL_IDS,
      create: ['ws-root', 'ws-prod'],
      move: ALL_IDS,
    },
  },
  render: () => <PickerWrapper onSelect={fn()} requiredPermission="create" />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tree = await canvas.findByRole('tree');
    const treeScope = within(tree);

    // Staging should be disabled (no create permission)
    const stagingText = await treeScope.findByText('Staging');
    const disabledSpan = stagingText.closest('span[style]');
    await expect(disabledSpan).not.toBeNull();

    // Production should NOT be disabled
    const prodText = await treeScope.findByText('Production');
    const prodSpan = prodText.closest('span[style]');
    await expect(prodSpan).toBeNull();
  },
};

export const WithExtraDisabledIds: Story = {
  name: 'Extra disabled IDs with tooltip overrides',
  render: () => {
    const extra = new Set(['ws-prod', 'ws-dev']);
    const overrides = new Map([
      ['ws-prod', 'This is the workspace being moved'],
      ['ws-dev', 'Cannot move a workspace under itself'],
    ]);
    return <PickerWrapper onSelect={fn()} extraDisabledIds={extra} extraDisabledTooltipOverrides={overrides} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const tree = await canvas.findByRole('tree');
    const treeScope = within(tree);

    // Production and Dev Cluster should be disabled
    const prodText = await treeScope.findByText('Production');
    await expect(prodText.closest('span[style]')).not.toBeNull();

    const devText = await treeScope.findByText('Dev Cluster');
    await expect(devText.closest('span[style]')).not.toBeNull();

    // Root and Staging should be enabled
    const rootText = await treeScope.findByText('Root Workspace');
    await expect(rootText.closest('span[style]')).toBeNull();
  },
};

export const Loading: Story = {
  parameters: {
    msw: { handlers: [...workspacesLoadingHandlers()] },
  },
  render: () => <PickerWrapper onSelect={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await expect(canvas.findByTestId('workspace-loading')).resolves.toBeInTheDocument();
  },
};

export const ErrorState: Story = {
  name: 'Error loading workspaces',
  parameters: {
    test: { dangerouslyIgnoreUnhandledErrors: true },
    msw: { handlers: [...workspacesErrorHandlers(500)] },
  },
  render: () => <PickerWrapper onSelect={fn()} />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await waitFor(
      async () => {
        await expect(canvas.findByTestId('workspace-load-error')).resolves.toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  },
};
