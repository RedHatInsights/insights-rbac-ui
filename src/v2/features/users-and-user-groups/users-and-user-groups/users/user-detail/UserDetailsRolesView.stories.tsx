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
import type { RoleBinding } from '../../../../../../v2/data/queries/roleBindings';
import { BINDING_TENANT_ADMIN_JOHN_PROD } from '../../../../../../v2/data/mocks/seed';
import { USER_JOHN } from '../../../../../../shared/data/mocks/seed';

const testBindings: RoleBinding[] = [BINDING_TENANT_ADMIN_JOHN_PROD];

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
**UserDetailsRolesView** displays roles assigned to a user via role bindings (V2 API).

Columns: Role name, User Group, Workspace.
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
    userId: USER_JOHN.username,
    ouiaId: 'user-roles-view',
  },
  parameters: {
    msw: {
      handlers: [...createRoleBindingsListHandlers(testBindings)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify role name displayed', async () => {
      await expect(canvas.findByText(BINDING_TENANT_ADMIN_JOHN_PROD.role.name)).resolves.toBeInTheDocument();
    });

    await step('Verify user group displayed', async () => {
      await expect(canvas.findByText(BINDING_TENANT_ADMIN_JOHN_PROD.subject.groupName!)).resolves.toBeInTheDocument();
    });

    await step('Verify workspace displayed', async () => {
      await expect(canvas.findByText(BINDING_TENANT_ADMIN_JOHN_PROD.resource.name)).resolves.toBeInTheDocument();
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
      await expect(canvas.queryByText(BINDING_TENANT_ADMIN_JOHN_PROD.role.name)).not.toBeInTheDocument();
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
