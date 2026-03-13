import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

import { UsersAndUserGroups } from './UsersAndUserGroups';
import { usersHandlers } from '../../../../shared/data/mocks/users.handlers';
import { groupsHandlers } from '../../../../shared/data/mocks/groups.handlers';
import { Users } from './users/Users';
import { UserGroups } from './user-groups/UserGroups';

// Mock data for testing
const mockUsers = [
  {
    username: 'john.doe',
    email: 'john.doe@example.com',
    first_name: 'John',
    last_name: 'Doe',
    is_active: true,
    is_org_admin: false,
    external_source_id: '123',
  },
  {
    username: 'jane.smith',
    email: 'jane.smith@example.com',
    first_name: 'Jane',
    last_name: 'Smith',
    is_active: true,
    is_org_admin: true,
    external_source_id: '456',
  },
];

const mockGroups = [
  {
    uuid: '1',
    name: 'Administrators',
    description: 'System administrators with full access',
    principalCount: 5,
    roleCount: 3,
    created: '2023-01-01T00:00:00Z',
    modified: '2023-06-15T10:30:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
  {
    uuid: '2',
    name: 'Developers',
    description: 'Development team members',
    principalCount: 12,
    roleCount: 2,
    created: '2023-02-01T00:00:00Z',
    modified: '2023-06-10T14:20:00Z',
    platform_default: false,
    admin_default: false,
    system: false,
  },
];

const meta: Meta<typeof UsersAndUserGroups> = {
  component: UsersAndUserGroups,
  decorators: [
    () => (
      <MemoryRouter initialEntries={['/iam/access-management/users-and-user-groups/users']}>
        <Routes>
          <Route path="/iam/access-management/users-and-user-groups" element={<UsersAndUserGroups />}>
            <Route path="users" element={<Users />} />
            <Route path="user-groups" element={<UserGroups />} />
            <Route index element={<Users />} />
          </Route>
        </Routes>
      </MemoryRouter>
    ),
  ],
  parameters: {},
};

export default meta;

// Main container story with autodocs
export const Default: StoryObj<typeof UsersAndUserGroups> = {
  tags: ['autodocs'],
  render: () => <></>, // Router handles rendering via decorator
  parameters: {
    test: {
      dangerouslyIgnoreUnhandledErrors: true, // Ignore Chrome context errors in outlet components
    },
    docs: {
      description: {
        story: `
**Default View**: Main access management container with tab navigation between Users and User Groups.

## Container Responsibilities
- **Tab Navigation**: Provides tabbed interface switching between Users and User Groups views
- **Route Management**: Handles URL routing for /users and /user-groups paths
- **Layout Structure**: Provides consistent page header and content layout
- **Outlet Integration**: Uses React Router outlet to render child route components
- **Reference Management**: Manages tab content refs for accessibility and focus management

## Architecture Pattern
This is a **feature container** that:
- Manages routing between Users and User Groups features
- Provides layout structure with ContentHeader and tabbed interface
- Uses React Router Outlet pattern for nested routing
- Handles automatic redirect from base path to users path

## Additional Test Stories

For testing specific scenarios, see these additional stories:

Use this story to test basic container rendering and tab structure. For comprehensive routing tests, use individual user and user-group container stories.
        `,
      },
    },
    msw: {
      handlers: [...usersHandlers(mockUsers), ...groupsHandlers(mockGroups)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify container and tab structure', async () => {
      await expect(canvas.findByText('Users and User Groups')).resolves.toBeInTheDocument();

      await expect(canvas.findByRole('region')).resolves.toBeInTheDocument();
      await expect(canvas.findByRole('tab', { name: /users/i })).resolves.toBeInTheDocument();
      await expect(canvas.findByRole('tab', { name: /user groups/i })).resolves.toBeInTheDocument();

      const usersTab = await canvas.findByRole('tab', { name: /users/i });
      await expect(usersTab).toHaveAttribute('aria-selected', 'true');

      await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
    });

    await step('Navigate to User Groups tab', async () => {
      const userGroupsTab = await canvas.findByRole('tab', { name: /user groups/i });
      await userEvent.click(userGroupsTab);

      await expect(canvas.findByText('Administrators')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Developers')).resolves.toBeInTheDocument();
    });

    await step('Navigate back to Users tab', async () => {
      const usersTab = await canvas.findByRole('tab', { name: /users/i });
      await userEvent.click(usersTab);

      await expect(canvas.findByText('john.doe')).resolves.toBeInTheDocument();
    });
  },
};
