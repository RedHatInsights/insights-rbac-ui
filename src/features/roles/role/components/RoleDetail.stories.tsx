import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { RoleDetail } from './RoleDetail';

const meta: Meta<typeof RoleDetail> = {
  component: RoleDetail,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
**RoleDetail** is a presentational component that renders the role detail page header and layout.

It handles:
- Page header with title and description
- Action dropdown (Edit/Delete)
- Breadcrumbs
- Error states (role not found, group not found)
- Permission checks (NotAuthorized view)

This component is pure UI - it receives all data and callbacks as props.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RoleDetail>;

const mockBreadcrumbs = [
  { title: 'Roles', to: '/roles' },
  { title: 'Custom Administrator Role', isActive: true },
];

const onDropdownToggleMock = fn();
const onDeleteMock = fn();
const onBackClickMock = fn();

export const Default: Story = {
  args: {
    title: 'Custom Administrator Role',
    description: 'A custom role for managing platform resources',
    isLoading: false,
    isSystemRole: false,
    roleExists: true,
    groupExists: true,
    isDropdownOpen: false,
    onDropdownToggle: onDropdownToggleMock,
    breadcrumbs: mockBreadcrumbs,
    editLink: '/roles/role-123/edit',
    deleteLink: '/roles/role-123/remove',
    onDelete: onDeleteMock,
    onBackClick: onBackClickMock,
    hasPermission: true,
    children: <div>Permissions table content goes here</div>,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify title is displayed as heading
    expect(await canvas.findByRole('heading', { name: /Custom Administrator Role/i })).toBeInTheDocument();

    // Verify description is displayed
    expect(await canvas.findByText('A custom role for managing platform resources')).toBeInTheDocument();

    // Verify action dropdown is present
    const kebabToggle = canvasElement.querySelector('#role-actions-dropdown');
    expect(kebabToggle).toBeInTheDocument();

    // Verify children content is rendered
    expect(await canvas.findByText('Permissions table content goes here')).toBeInTheDocument();
  },
};

export const SystemRole: Story = {
  args: {
    ...Default.args,
    title: 'System Administrator',
    description: 'Built-in system role',
    isSystemRole: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify title is displayed
    expect(await canvas.findByText('System Administrator')).toBeInTheDocument();

    // System roles should NOT show action dropdown
    const kebabToggle = canvasElement.querySelector('#role-actions-dropdown');
    expect(kebabToggle).not.toBeInTheDocument();
  },
};

export const LoadingState: Story = {
  args: {
    ...Default.args,
    title: undefined,
    description: undefined,
    isLoading: true,
  },
  play: async ({ canvasElement }) => {
    // Loading state shows placeholder
    const placeholder = canvasElement.querySelector('.ins-c-skeleton');
    expect(placeholder).toBeInTheDocument();
  },
};

export const ActionDropdownOpen: Story = {
  args: {
    ...Default.args,
    isDropdownOpen: true,
  },
  play: async ({ canvasElement }) => {
    // Open the dropdown
    const kebabToggle = canvasElement.querySelector('#role-actions-dropdown');
    if (!kebabToggle) throw new Error('Kebab toggle not found');
    await userEvent.click(kebabToggle);

    // Verify Edit and Delete actions are visible
    expect(await within(document.body).findByText('Edit')).toBeInTheDocument();
    expect(await within(document.body).findByText('Delete')).toBeInTheDocument();
  },
};

export const RoleNotFound: Story = {
  args: {
    ...Default.args,
    title: undefined,
    roleExists: false,
    breadcrumbs: [],
    errorType: 'role',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify error message is displayed
    expect(await canvas.findByText('Role not found')).toBeInTheDocument();
    expect(await canvas.findByText(/Role with ID does not exist/)).toBeInTheDocument();

    // Verify back button is present
    const backButton = await canvas.findByRole('button', { name: /Back to previous page/i });
    expect(backButton).toBeInTheDocument();
  },
};

export const GroupNotFound: Story = {
  args: {
    ...Default.args,
    title: undefined,
    groupExists: false,
    roleExists: true,
    breadcrumbs: [],
    errorType: 'group',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify error message is displayed
    expect(await canvas.findByText('Group not found')).toBeInTheDocument();
    expect(await canvas.findByText(/Group with ID does not exist/)).toBeInTheDocument();
  },
};

export const NoPermission: Story = {
  args: {
    ...Default.args,
    hasPermission: false,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify NotAuthorized component is displayed
    expect(await canvas.findByText(/You need User Access Administrator or Organization Administrator/)).toBeInTheDocument();
  },
};

export const WithGroupContext: Story = {
  args: {
    ...Default.args,
    breadcrumbs: [
      { title: 'Groups', to: '/groups' },
      { title: 'Engineering Team', to: '/groups/group-456' },
      { title: 'Custom Administrator Role', isActive: true },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify all breadcrumbs are displayed
    expect(await canvas.findByText('Groups')).toBeInTheDocument();
    expect(await canvas.findByText('Engineering Team')).toBeInTheDocument();

    // Verify title as heading (not breadcrumb)
    expect(await canvas.findByRole('heading', { name: /Custom Administrator Role/i })).toBeInTheDocument();
  },
};

export const NoDescription: Story = {
  args: {
    ...Default.args,
    description: undefined,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Title should be present as heading
    expect(await canvas.findByRole('heading', { name: /Custom Administrator Role/i })).toBeInTheDocument();

    // Description should not be present
    const description = canvas.queryByText('A custom role for managing platform resources');
    expect(description).not.toBeInTheDocument();
  },
};
