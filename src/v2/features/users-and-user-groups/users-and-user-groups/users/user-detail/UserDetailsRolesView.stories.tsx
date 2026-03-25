import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { DataViewEventsProvider } from '@patternfly/react-data-view';

import { UserDetailsRolesView } from './UserDetailsRolesView';
import {
  createRoleBindingsListHandlers,
  roleBindingsErrorHandlers,
  roleBindingsLoadingHandlers,
} from '../../../../../../v2/data/mocks/roleBindings.handlers';
import type { MockRoleBinding } from '../../../../../../v2/data/mocks/roleBindings.fixtures';

const MOCK_USER_BINDINGS: MockRoleBinding[] = [
  {
    id: 'b-1',
    role_id: 'role-1',
    role_name: 'Organization Administrator',
    subject_type: 'user',
    subject_id: 'john.doe',
    resource_id: 'ws-1',
    resource_type: 'workspace',
    created: '2024-01-01T00:00:00Z',
  },
  {
    id: 'b-2',
    role_id: 'role-2',
    role_name: 'User Access Administrator',
    subject_type: 'user',
    subject_id: 'john.doe',
    resource_id: 'ws-1',
    resource_type: 'workspace',
    created: '2024-01-01T00:00:00Z',
  },
  {
    id: 'b-3',
    role_id: 'role-3',
    role_name: 'Insights Viewer',
    subject_type: 'user',
    subject_id: 'john.doe',
    resource_id: 'ws-2',
    resource_type: 'workspace',
    created: '2024-01-01T00:00:00Z',
  },
  {
    id: 'b-4',
    role_id: 'role-4',
    role_name: 'Custom Development Role',
    subject_type: 'user',
    subject_id: 'john.doe',
    resource_id: 'ws-3',
    resource_type: 'workspace',
    created: '2024-01-01T00:00:00Z',
  },
];

const meta: Meta<typeof UserDetailsRolesView> = {
  component: UserDetailsRolesView,
  decorators: [
    (Story) => (
      <MemoryRouter>
        <DataViewEventsProvider>
          <div style={{ height: '500px', padding: '1rem' }}>
            <Story />
          </div>
        </DataViewEventsProvider>
      </MemoryRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
**UserDetailsRolesView** shows roles assigned to a user via V2 role bindings.

Columns: Role name, User Group (through which the binding applies), Workspace.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof UserDetailsRolesView>;

export const Default: Story = {
  tags: ['autodocs'],
  args: {
    userId: 'john.doe',
    ouiaId: 'user-roles-view',
  },
  parameters: {
    msw: {
      handlers: [...createRoleBindingsListHandlers(MOCK_USER_BINDINGS)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify role binding data renders', async () => {
      await expect(canvas.findByText(MOCK_USER_BINDINGS[0].role_name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(MOCK_USER_BINDINGS[1].role_name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(MOCK_USER_BINDINGS[2].role_name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(MOCK_USER_BINDINGS[3].role_name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(MOCK_USER_BINDINGS[0].resource_id)).resolves.toBeInTheDocument();
    });
  },
};

export const Loading: Story = {
  args: {
    userId: 'loading.user',
    ouiaId: 'user-roles-view-loading',
  },
  parameters: {
    msw: {
      handlers: [...roleBindingsLoadingHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify loading state', async () => {
      await expect(canvas.findByLabelText('UserRolesView', {}, { timeout: 10000 })).resolves.toBeInTheDocument();
      await expect(canvas.queryByText('Organization Administrator')).not.toBeInTheDocument();
    });
  },
};

export const EmptyUserRoles: Story = {
  args: {
    userId: 'empty.user',
    ouiaId: 'user-roles-view-empty',
  },
  parameters: {
    msw: {
      handlers: [...createRoleBindingsListHandlers([])],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty state', async () => {
      await expect(canvas.findByText('No roles found')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('This user has no roles assigned.')).resolves.toBeInTheDocument();
    });
  },
};

export const APIError: Story = {
  args: {
    userId: 'error.user',
    ouiaId: 'user-roles-view-error',
  },
  parameters: {
    msw: {
      handlers: [...roleBindingsErrorHandlers(500)],
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify API error state', async () => {
      await expect(canvas.findByText('Unable to load roles')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Something went wrong. Please try again.')).resolves.toBeInTheDocument();
    });
  },
};

export const NetworkFailure: Story = {
  args: {
    userId: 'network.user',
    ouiaId: 'user-roles-view-network',
  },
  parameters: {
    msw: {
      handlers: [...roleBindingsErrorHandlers(500)],
    },
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify network failure state', async () => {
      await expect(canvas.findByText('Unable to load roles')).resolves.toBeInTheDocument();
      await expect(canvas.findByText('Something went wrong. Please try again.')).resolves.toBeInTheDocument();
    });
  },
};
