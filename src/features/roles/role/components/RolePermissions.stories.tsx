import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router-dom';
import { fn } from 'storybook/test';
import { RolePermissions } from './RolePermissions';

const meta: Meta<typeof RolePermissions> = {
  title: 'Features/Roles/Role/Components/RolePermissions',
  component: RolePermissions,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
  },
};

export default meta;
type Story = StoryObj<typeof RolePermissions>;

const mockPermissions = [
  {
    uuid: 'cost-management:*:*',
    permission: 'cost-management:*:*',
    resourceDefinitions: [],
    modified: '2024-01-15T10:30:00Z',
  },
  {
    uuid: 'inventory:hosts:read',
    permission: 'inventory:hosts:read',
    resourceDefinitions: [{ attributeFilter: { value: ['host-1', 'host-2'] } }],
    modified: '2024-01-15T10:30:00Z',
  },
  {
    uuid: 'inventory:groups:write',
    permission: 'inventory:groups:write',
    resourceDefinitions: [],
    modified: '2024-01-15T10:30:00Z',
  },
];

export const Default: Story = {
  args: {
    cantAddPermissions: false,
    isLoading: false,
    isRecordLoading: false,
    roleUuid: 'role-123',
    roleName: 'Custom Role',
    isSystemRole: false,
    filteredPermissions: mockPermissions,
    applications: ['cost-management', 'inventory'],
    resources: [
      { label: 'hosts', value: 'hosts' },
      { label: 'groups', value: 'groups' },
    ],
    operations: [
      { label: 'read', value: 'read' },
      { label: 'write', value: 'write' },
    ],
    showResourceDefinitions: true,
    onRemovePermissions: fn(),
    onNavigateToAddPermissions: fn(),
    onFiltersChange: fn(),
    currentFilters: { applications: [], resources: [], operations: [] },
  },
};

export const Loading: Story = {
  args: {
    ...Default.args,
    isLoading: true,
  },
};

export const SystemRole: Story = {
  args: {
    ...Default.args,
    cantAddPermissions: true,
    isSystemRole: true,
  },
};

export const EmptyPermissions: Story = {
  args: {
    ...Default.args,
    filteredPermissions: [],
  },
};

export const NoResourceDefinitions: Story = {
  args: {
    ...Default.args,
    showResourceDefinitions: false,
    filteredPermissions: [
      {
        uuid: 'rbac:role:read',
        permission: 'rbac:role:read',
        resourceDefinitions: [],
        modified: '2024-01-15T10:30:00Z',
      },
      {
        uuid: 'rbac:group:write',
        permission: 'rbac:group:write',
        resourceDefinitions: [],
        modified: '2024-01-15T10:30:00Z',
      },
    ],
  },
};

export const ManyPermissions: Story = {
  args: {
    ...Default.args,
    filteredPermissions: Array.from({ length: 25 }, (_, i) => ({
      uuid: `permission-${i}`,
      permission: `app-${i % 3}:resource-${i % 5}:operation-${i % 2 === 0 ? 'read' : 'write'}`,
      resourceDefinitions: [],
      modified: '2024-01-15T10:30:00Z',
    })),
    applications: ['app-0', 'app-1', 'app-2'],
    resources: [
      { label: 'resource-0', value: 'resource-0' },
      { label: 'resource-1', value: 'resource-1' },
      { label: 'resource-2', value: 'resource-2' },
      { label: 'resource-3', value: 'resource-3' },
      { label: 'resource-4', value: 'resource-4' },
    ],
    operations: [
      { label: 'read', value: 'read' },
      { label: 'write', value: 'write' },
    ],
  },
};

export const PlatformDefaultRole: Story = {
  args: {
    ...Default.args,
    cantAddPermissions: true,
    roleName: 'Platform Default Role',
  },
};
