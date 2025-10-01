import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { fn } from 'storybook/test';
import { expect, userEvent, within } from 'storybook/test';
import { WorkspaceSelector } from './WorkspaceSelector';
import { TreeViewDataItem } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { TreeView } from '@patternfly/react-core/dist/dynamic/components/TreeView';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { Alert, AlertVariant } from '@patternfly/react-core/dist/dynamic/components/Alert';

const meta: Meta<typeof WorkspaceSelector> = {
  component: WorkspaceSelector,
  tags: ['autodocs', 'custom-css'],
  parameters: {
    docs: {
      story: {
        height: '400px',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WorkspaceSelector>;

// Mock workspace data
const mockWorkspaces: TreeViewDataItem[] = [
  {
    id: 'prod',
    name: 'Production',
    children: [
      { id: 'prod-web', name: 'Web Services' },
      { id: 'prod-api', name: 'API Services' },
    ],
  },
  {
    id: 'dev',
    name: 'Development',
    children: [{ id: 'dev-test', name: 'Testing' }],
  },
];

// Simple render functions
const renderMenuToggle = ({ menuToggleRef, onMenuToggleClick, isDisabled, selectedItem }: any) => (
  <MenuToggle ref={menuToggleRef} onClick={onMenuToggleClick} isDisabled={isDisabled}>
    {selectedItem ? selectedItem.name : 'Select workspace'}
  </MenuToggle>
);

const renderTreeView = ({ treeElements, selectedItem, onSelect, isLoading, isError }: any) => {
  if (isError) return <Alert variant={AlertVariant.danger} title="Failed to load workspaces" />;
  if (isLoading) return <Spinner />;
  if (treeElements.length === 0) return <p>No workspaces available</p>;

  return <TreeView data={treeElements} activeItems={selectedItem ? [selectedItem] : []} onSelect={onSelect} />;
};

const baseArgs = {
  isMenuExpanded: true, // Always expanded to show the dropdown content
  setIsMenuExpanded: fn(),
  isLoading: false,
  isError: false,
  selectedItem: null,
  setSelectedItem: fn(),
  treeElements: mockWorkspaces,
  filteredTreeElements: mockWorkspaces,
  searchInputValue: '',
  setSearchInputValue: fn(),
  areElementsFiltered: false,
  onSearchFilter: fn(),
  onSelectItem: fn(),
  onFetchData: fn(),
  renderMenuToggle,
  renderTreeView,
  onButtonClick: fn(),
};

export const DropdownWithWorkspaces: Story = {
  args: baseArgs,
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Wait for component to fully render
    await expect(canvas.findByPlaceholderText('Find a workspace by name')).resolves.toBeInTheDocument();
    // Wait for search input to appear
    const searchInput = await canvas.findByPlaceholderText('Find a workspace by name');
    await expect(searchInput).toBeInTheDocument();

    // Wait for tree view workspaces to appear
    await expect(canvas.findByText('Production')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Development')).resolves.toBeInTheDocument();

    // Wait for action button to appear
    const actionButton = await canvas.findByText('View list');
    await expect(actionButton).toBeInTheDocument();

    // Test tree view selection
    await userEvent.click(await canvas.findByText('Production'));
    await expect(args.onSelectItem).toHaveBeenCalled();

    // Test action button click
    await userEvent.click(actionButton);
    await expect(args.onButtonClick).toHaveBeenCalled();
  },
};

export const DropdownLoading: Story = {
  args: {
    ...baseArgs,
    isLoading: true,
  },
};

export const DropdownError: Story = {
  args: {
    ...baseArgs,
    isError: true,
  },
};

export const DropdownEmpty: Story = {
  args: {
    ...baseArgs,
    treeElements: [],
    filteredTreeElements: [],
  },
};

export const DropdownFiltered: Story = {
  args: {
    ...baseArgs,
    searchInputValue: 'prod',
    areElementsFiltered: true,
    filteredTreeElements: [mockWorkspaces[0]], // Only Production workspace
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);

    // Wait for component to fully render with search value
    await expect(canvas.findByDisplayValue('prod')).resolves.toBeInTheDocument();

    // Wait for search input with value to appear
    const searchInput = await canvas.findByDisplayValue('prod');
    await expect(searchInput).toBeInTheDocument();

    // Wait for filtered workspace to appear
    await expect(canvas.findByText('Production')).resolves.toBeInTheDocument();

    // Verify Development is not shown (filtered out)
    await expect(canvas.queryByText('Development')).not.toBeInTheDocument();

    // Test search input interaction
    await userEvent.clear(searchInput);
    await userEvent.type(searchInput, 'dev');
    await expect(args.onSearchFilter).toHaveBeenCalledWith('dev');
  },
};
