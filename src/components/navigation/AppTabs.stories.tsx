import React from 'react';
import type { Meta, StoryFn, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router-dom';
import { AppTabs, AppTabsProps, TabItem } from './AppTabs';

// Extended props for Storybook that includes routing control
type AppTabsStoryProps = AppTabsProps & {
  initialRoute?: string;
};

/**
 * Mock tab items for Storybook stories
 *
 * @description Sample tab navigation items for demonstration
 */
const mockTabItems: TabItem[] = [
  { eventKey: 0, title: 'Roles', name: '/groups/test-group-1/roles', to: 'roles' },
  { eventKey: 1, title: 'Members', name: '/groups/test-group-1/members', to: 'members' },
  { eventKey: 2, title: 'Service accounts', name: '/groups/test-group-1/service-accounts', to: 'service-accounts' },
];

export default {
  component: AppTabs,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'A presentational component that renders tab navigation using PatternFly components. Automatically determines the active tab based on the current route and handles navigation.',
      },
    },
  },
  argTypes: {
    tabItems: {
      description: 'Array of tab items to display',
      control: { type: 'object' },
    },
    isHeader: {
      description: 'Whether this is a header tab component (affects CSS class)',
      control: { type: 'boolean' },
    },
    initialRoute: {
      description: 'Initial route for the MemoryRouter (for testing different active states)',
      control: { type: 'text' },
    },
  },
  decorators: [
    (Story: StoryFn, { args }: { args: AppTabsStoryProps }) => (
      <MemoryRouter initialEntries={[args.initialRoute || '/groups/test-group-1/roles']}>
        <Story />
      </MemoryRouter>
    ),
  ],
} as Meta<AppTabsStoryProps>;

type Story = StoryObj<AppTabsStoryProps>;

export const Default: Story = {
  args: {
    tabItems: mockTabItems,
    isHeader: false,
  },
};

export const HeaderTabs: Story = {
  args: {
    tabItems: mockTabItems,
    isHeader: true,
  },
};

export const WithMoreTabs: Story = {
  args: {
    tabItems: [
      { eventKey: 0, title: 'Overview', name: '/groups/test-group-1/overview', to: 'overview' },
      { eventKey: 1, title: 'Roles', name: '/groups/test-group-1/roles', to: 'roles' },
      { eventKey: 2, title: 'Members', name: '/groups/test-group-1/members', to: 'members' },
      { eventKey: 3, title: 'Service Accounts', name: '/groups/test-group-1/service-accounts', to: 'service-accounts' },
      { eventKey: 4, title: 'Settings', name: '/groups/test-group-1/settings', to: 'settings' },
    ],
    isHeader: false,
  },
};

export const ActiveOnMembers: Story = {
  parameters: {
    docs: {
      disable: true,
    },
  },
  args: {
    tabItems: mockTabItems,
    isHeader: false,
    initialRoute: '/groups/test-group-1/members',
  },
};

export const ActiveOnServiceAccounts: Story = {
  parameters: {
    docs: {
      disable: true,
    },
  },
  args: {
    tabItems: mockTabItems,
    isHeader: false,
    initialRoute: '/groups/test-group-1/service-accounts',
  },
};
