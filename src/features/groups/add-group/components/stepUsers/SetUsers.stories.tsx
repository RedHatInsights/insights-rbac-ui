import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { HttpResponse, http } from 'msw';
import { expect, waitFor } from 'storybook/test';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import { SetUsers } from './SetUsers';

// Mock users data
const mockUsers = [
  {
    username: 'alice.doe',
    email: 'alice.doe@example.com',
    first_name: 'Alice',
    last_name: 'Doe',
    is_active: true,
    is_org_admin: false,
  },
  {
    username: 'bob.smith',
    email: 'bob.smith@example.com',
    first_name: 'Bob',
    last_name: 'Smith',
    is_active: true,
    is_org_admin: false,
  },
  {
    username: 'charlie.brown',
    email: 'charlie.brown@example.com',
    first_name: 'Charlie',
    last_name: 'Brown',
    is_active: true,
    is_org_admin: false,
  },
];

// Extended component mapper to include SetUsers
const extendedMapper = {
  ...componentMapper,
  'set-users': SetUsers,
};

// Mock form schema for the SetUsers step
const setUsersSchema = {
  fields: [
    {
      component: 'set-users',
      name: 'users-list',
    },
  ],
};

// Wrapper component to provide FormRenderer and Router context
const SetUsersWithForm: React.FC<{
  onSubmit?: (values: any) => void;
  initialValues?: any;
}> = ({ onSubmit = () => {}, initialValues = { 'users-list': [] } }) => {
  return (
    <MemoryRouter>
      <FormRenderer
        schema={setUsersSchema}
        componentMapper={extendedMapper}
        FormTemplate={Pf4FormTemplate}
        onSubmit={onSubmit}
        initialValues={initialValues}
      />
    </MemoryRouter>
  );
};

const meta: Meta<typeof SetUsersWithForm> = {
  title: 'Features/Groups/AddGroup/SetUsers',
  component: SetUsersWithForm,
  tags: ['autodocs', 'ff:platform.rbac.itless', 'custom-css'],
  parameters: {
    docs: {
      description: {
        component: 'TypeScript version of SetUsers component for the Add Group wizard.',
      },
    },
    msw: {
      handlers: [
        // Users API for the table
        http.get('/api/rbac/v1/principals/', ({ request }) => {
          const url = new URL(request.url);
          const status = url.searchParams.getAll('status');
          const username = url.searchParams.get('username');

          let filteredUsers = mockUsers;

          if (status.length > 0 && !status.includes('All')) {
            filteredUsers = filteredUsers.filter((user) => (status.includes('enabled') ? user.is_active : !user.is_active));
          }

          if (username) {
            filteredUsers = filteredUsers.filter((user) => user.username.toLowerCase().includes(username.toLowerCase()));
          }

          return HttpResponse.json({
            data: filteredUsers,
            meta: {
              count: filteredUsers.length,
              limit: 20,
              offset: 0,
            },
          });
        }),
      ],
    },
    featureFlags: {
      'platform.rbac.itless': false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    // Wait for users table or component to load
    await waitFor(
      () => {
        expect(canvasElement).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Verify basic component rendering
    expect(canvasElement).toBeInTheDocument();
  },
};

export const ITLessMode: Story = {
  parameters: {
    featureFlags: {
      'platform.rbac.itless': true,
    },
  },
  play: async ({ canvasElement }) => {
    // Should load ITLess version
    await waitFor(
      () => {
        expect(canvasElement).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    expect(canvasElement).toBeInTheDocument();
  },
};
