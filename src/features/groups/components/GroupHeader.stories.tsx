import React from 'react';
import type { Meta, StoryFn } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router-dom';
import { BreadcrumbItem, Group, GroupHeader, GroupHeaderProps } from './GroupHeader';
import { AppTabs } from '../../../components/navigation/AppTabs';

/**
 * Mock group data for Storybook stories
 *
 * @description Sample group data that represents a typical group in the application
 */
const mockGroup: Group = {
  id: 'test-group-1',
  name: 'Test Group',
  description: 'This is a test group for demonstration purposes',
  platform_default: false,
  system: false,
  admin_default: false,
};

const mockPlatformDefaultGroup: Group = {
  id: 'default-access-group',
  name: 'Default Access Group',
  description: 'Default access group for the platform',
  platform_default: true,
  system: false,
  admin_default: false,
};

const mockSystemGroup: Group = {
  id: 'system-group-1',
  name: 'System Group',
  description: 'System managed group',
  platform_default: false,
  system: true,
  admin_default: false,
};

/**
 * Mock breadcrumb data for Storybook stories
 *
 * @description Sample breadcrumb navigation items for demonstration
 */
const mockBreadcrumbs: BreadcrumbItem[] = [
  {
    title: 'Groups',
    to: '/groups',
  },
  {
    title: 'Test Group',
    isActive: true,
  },
];

const mockTabItems = [
  { eventKey: 0, title: 'Roles', name: '/groups/test-group-1/roles', to: 'roles' },
  { eventKey: 1, title: 'Members', name: '/groups/test-group-1/members', to: 'members' },
  { eventKey: 2, title: 'Service accounts', name: '/groups/test-group-1/service-accounts', to: 'service-accounts' },
];

export default {
  component: GroupHeader,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A presentational component that displays the header section for a group detail page. Includes breadcrumb navigation, group information, action buttons, and various states such as loading, error, and informational alerts.',
      },
    },
  },
  argTypes: {
    group: {
      description: 'The group object containing name, description, and other group information',
      control: { type: 'object' },
    },
    isGroupLoading: {
      description: 'Controls the display of loading skeleton while group data is being fetched',
      control: { type: 'boolean' },
    },
    groupExists: {
      description: 'Determines whether to show the group content or an error state',
      control: { type: 'boolean' },
    },
    groupId: {
      description: 'Unique identifier for the group, used in navigation and error messages',
      control: { type: 'text' },
    },
    isPlatformDefault: {
      description: 'Controls special behavior for the default access group, including restore functionality',
      control: { type: 'boolean' },
    },
    isResetWarningVisible: {
      description: 'Controls the display of the confirmation modal for restoring default group settings',
      control: { type: 'boolean' },
    },
    isDropdownOpen: {
      description: 'Controls the visibility of the action dropdown menu (Edit/Delete)',
      control: { type: 'boolean' },
    },
    showDefaultGroupChangedInfo: {
      description: 'Controls the display of an informational alert when the default group has been modified',
      control: { type: 'boolean' },
    },
    breadcrumbs: {
      description: 'Array of breadcrumb items for navigation hierarchy display',
      control: { type: 'object' },
    },
    location: {
      description: 'Current route location used to determine which action links to show',
      control: { type: 'object' },
    },
    children: {
      description: 'Optional child components to render within the header (e.g., tab navigation)',
      control: false,
    },
  },
  decorators: [
    (Story: StoryFn) => (
      <MemoryRouter initialEntries={['/groups/test-group-1/roles']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} as Meta<typeof GroupHeader>;

const Template: StoryFn<typeof GroupHeader> = (args: GroupHeaderProps) => <GroupHeader {...args} />;

export const Default = Template.bind({});
Default.args = {
  group: mockGroup,
  isGroupLoading: false,
  groupExists: true,
  groupId: 'test-group-1',
  isPlatformDefault: false,
  isResetWarningVisible: false,
  isDropdownOpen: false,
  showDefaultGroupChangedInfo: false,

  breadcrumbs: mockBreadcrumbs,

  location: { pathname: '/groups/test-group-1/roles' },

  children: <AppTabs isHeader tabItems={mockTabItems} />,
};

export const Loading = Template.bind({});
Loading.args = {
  ...Default.args,
  isGroupLoading: true,
  group: undefined,
};

export const PlatformDefaultGroup = Template.bind({});
PlatformDefaultGroup.args = {
  ...Default.args,
  group: mockPlatformDefaultGroup,
  isPlatformDefault: true,
  groupId: 'default-access-group',
  breadcrumbs: [
    { title: 'Groups', to: '/groups' },
    { title: 'Default Access Group', isActive: true },
  ],

  children: (
    <AppTabs
      isHeader
      tabItems={[
        { eventKey: 0, title: 'Roles', name: '/groups/default-access-group/roles', to: 'roles' },
        { eventKey: 1, title: 'Members', name: '/groups/default-access-group/members', to: 'members' },
      ]}
    />
  ),
};

export const SystemGroup = Template.bind({});
SystemGroup.args = {
  ...Default.args,
  group: mockSystemGroup,
  breadcrumbs: [
    { title: 'Groups', to: '/groups' },
    { title: 'System Group', isActive: true },
  ],
};

export const WithDefaultGroupChangedInfo = Template.bind({});
WithDefaultGroupChangedInfo.args = {
  ...PlatformDefaultGroup.args,
  showDefaultGroupChangedInfo: true,
};

export const WithResetWarning = Template.bind({});
WithResetWarning.parameters = {
  docs: {
    disable: true,
  },
};
WithResetWarning.args = {
  ...PlatformDefaultGroup.args,
  isResetWarningVisible: true,
};

export const WithDropdownOpen = Template.bind({});
WithDropdownOpen.args = {
  ...Default.args,
  isDropdownOpen: true,
};

export const GroupNotFound = Template.bind({});
GroupNotFound.args = {
  ...Default.args,
  groupExists: false,
  group: undefined,
  isGroupLoading: false,
  breadcrumbs: [
    { title: 'Groups', to: '/groups' },
    { title: 'Invalid Group', isActive: true },
  ],
  children: undefined,
};

export const AdminDefaultGroup = Template.bind({});
AdminDefaultGroup.args = {
  ...Default.args,
  group: {
    ...mockGroup,
    admin_default: true,
    name: 'Admin Default Group',
  },
  breadcrumbs: [
    { title: 'Groups', to: '/groups' },
    { title: 'Admin Default Group', isActive: true },
  ],
};
