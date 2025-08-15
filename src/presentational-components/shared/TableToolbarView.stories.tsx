import React from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { compoundExpand, sortable } from '@patternfly/react-table';
import { Button } from '@patternfly/react-core';
import TableToolbarView from './TableToolbarView';
import { PlusIcon } from '@patternfly/react-icons';
import { cellWidth } from '@patternfly/react-table';

const meta: Meta<typeof TableToolbarView> = {
  title: 'Presentational Components/Shared/TableToolbarView',
  component: TableToolbarView,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: 'A comprehensive table component with toolbar, filtering, pagination, and selection capabilities.',
      },
    },
  },
  argTypes: {
    className: { control: 'text' },
    isCompact: { control: 'boolean' },
    borders: { control: 'boolean' },
    isLoading: { control: 'boolean' },
    isSelectable: { control: 'boolean' },
    isFilterable: { control: 'boolean' },
    hideFilterChips: { control: 'boolean' },
    hideHeader: { control: 'boolean' },
    noData: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof TableToolbarView>;

// Sample data
const sampleColumns = [
  { title: 'Name', key: 'name', transforms: [sortable] },
  { title: 'Email', key: 'email', transforms: [sortable] },
  { title: 'Role', key: 'role', transforms: [sortable] },
  { title: 'Status', key: 'status', transforms: [sortable] },
];

const sampleRows = [
  {
    uuid: '1',
    cells: ['John Doe', 'john.doe@example.com', 'Admin', 'Active'],
    requires: ['admin'],
  },
  {
    uuid: '2',
    cells: ['Jane Smith', 'jane.smith@example.com', 'User', 'Active'],
    requires: ['user'],
  },
  {
    uuid: '3',
    cells: ['Bob Johnson', 'bob.johnson@example.com', 'Manager', 'Inactive'],
    requires: ['manager'],
  },
];

const sampleData = [
  { username: 'johndoe', name: 'John Doe', email: 'john.doe@example.com', role: 'Admin', status: 'Active' },
  { username: 'janesmith', name: 'Jane Smith', email: 'jane.smith@example.com', role: 'User', status: 'Active' },
  { username: 'bobjohnson', name: 'Bob Johnson', email: 'bob.johnson@example.com', role: 'Manager', status: 'Inactive' },
];

const mockFetchData = (params: any) => {
  console.log('Fetch data called with:', params);
};

const mockSetFilterValue = (value: any) => {
  console.log('Set filter value:', value);
};

const mockSetCheckedItems = (items: any) => {
  console.log('Set checked items:', items);
};

export const Default: Story = {
  args: {
    columns: sampleColumns,
    rows: sampleRows,
    data: sampleData,
    titlePlural: 'Users',
    titleSingular: 'User',
    tableId: 'users-table',
    pagination: {
      limit: 10,
      offset: 0,
      count: 3,
    },
    fetchData: mockFetchData,
    setFilterValue: mockSetFilterValue,
    isFilterable: true,
    filterPlaceholder: 'Filter by name...',
  },
};

export const WithToolbarButtons: Story = {
  args: {
    ...Default.args,
    toolbarButtons: () => [
      <Button key="add-user" variant="primary" icon={<PlusIcon />}>
        Add User
      </Button>,
    ],
  },
};

export const SelectableRows: Story = {
  args: {
    ...Default.args,
    isSelectable: true,
    checkedRows: [],
    setCheckedItems: mockSetCheckedItems,
  },
};

export const LoadingState: Story = {
  args: {
    ...Default.args,
    isLoading: true,
    rows: [],
  },
};

export const EmptyState: Story = {
  args: {
    ...Default.args,
    rows: [],
    filterValue: '',
    filters: [],
    isLoading: false,
    toolbarButtons: () => [],
  },
};

export const EmptyStateWithFilters: Story = {
  args: {
    ...Default.args,
    rows: [],
    filterValue: 'nonexistent',
    filters: [{ value: 'test', key: 'status' }] as any,
    isLoading: false,
    emptyFilters: { name: '', status: '' },
    toolbarButtons: () => [],
  },
};

export const CompactTable: Story = {
  args: {
    ...Default.args,
    isCompact: true,
  },
};

export const NoBorders: Story = {
  args: {
    ...Default.args,
    borders: false,
  },
};

export const WithCustomFilters: Story = {
  args: {
    ...Default.args,
    filters: [
      {
        key: 'status',
        label: 'Status',
        value: '',
        placeholder: 'Filter by status',
        type: 'checkbox',
        items: [
          { value: 'active', label: 'Active' },
          { value: 'inactive', label: 'Inactive' },
        ],
      },
      {
        key: 'role',
        label: 'Role',
        value: '',
        placeholder: 'Filter by role',
        type: 'checkbox',
        items: [
          { value: 'admin', label: 'Admin' },
          { value: 'user', label: 'User' },
          { value: 'manager', label: 'Manager' },
        ],
      },
    ] as any,
  },
};

export const WithSorting: Story = {
  args: {
    ...Default.args,
    columns: [
      { title: 'Name', key: 'name', transforms: [sortable] },
      { title: 'Email', key: 'email', transforms: [sortable] },
      { title: 'Role', key: 'role', transforms: [sortable] },
      { title: 'Status', key: 'status', transforms: [sortable] },
    ],
    sortBy: { direction: 'asc', index: 0 },
    onSort: (event: any, index: any, direction: any) => {
      console.log('Sort:', { index, direction });
    },
  },
};

export const WithActions: Story = {
  args: {
    ...Default.args,
    actionResolver: (rowData: any, rowIndex: any) => [
      {
        title: 'Edit',
        onClick: () => console.log('Edit row:', rowIndex),
      },
      {
        title: 'Delete',
        onClick: () => console.log('Delete row:', rowIndex),
      },
    ],
  },
};

export const ExpandableRows: Story = {
  args: {
    ...Default.args,
    isExpandable: true,
    columns: [
      { title: 'Name', key: 'name', transforms: [sortable] },
      { title: 'Email', key: 'email', transforms: [sortable] },
      { title: 'Role', key: 'role', transforms: [sortable] },
      { title: 'Status', key: 'status', cellTransforms: [compoundExpand, cellWidth(20)] },
    ],
    rows: [
      {
        uuid: '1',
        cells: ['John Doe', 'john.doe@example.com', 'Admin', { title: 'Active', props: { isOpen: false } }],
        requires: ['admin'],
      },
      {
        uuid: '1-details',
        parent: 0,
        compoundParent: 3,
        cells: [
          {
            props: { colSpan: 4, className: 'pf-m-no-padding' },
            title: (
              <div style={{ padding: '1rem' }}>
                <h4>User Details</h4>
                <p>
                  <strong>Department:</strong> Engineering
                </p>
                <p>
                  <strong>Location:</strong> New York
                </p>
                <p>
                  <strong>Last Login:</strong> 2024-01-15
                </p>
              </div>
            ),
          },
        ],
      },
      {
        uuid: '2',
        cells: ['Jane Smith', 'jane.smith@example.com', 'User', { title: 'Active', props: { isOpen: false } }],
        requires: ['user'],
      },
      {
        uuid: '2-details',
        parent: 2,
        compoundParent: 3,
        cells: [
          {
            props: { colSpan: 4, className: 'pf-m-no-padding' },
            title: (
              <div style={{ padding: '1rem' }}>
                <h4>User Details</h4>
                <p>
                  <strong>Department:</strong> Marketing
                </p>
                <p>
                  <strong>Location:</strong> San Francisco
                </p>
                <p>
                  <strong>Last Login:</strong> 2024-01-14
                </p>
              </div>
            ),
          },
        ],
      },
    ],
    onExpand: (event: any, rowIndex: number, colIndex: number, isOpen: boolean) => {
      console.log('Expand row:', { rowIndex, colIndex, isOpen });
    },
  },
};

export const NoBottomPagination: Story = {
  args: {
    ...Default.args,
    pagination: {
      ...(Default.args?.pagination || {}),
      noBottom: true,
    },
  },
};

export const WithCustomEmptyState: Story = {
  args: {
    ...Default.args,
    rows: [],
    noData: true,
    noDataDescription: ['No users have been created yet.', 'Create your first user to get started.'],
    emptyProps: {
      className: 'custom-empty-state',
    },
    toolbarButtons: () => [],
  },
};
