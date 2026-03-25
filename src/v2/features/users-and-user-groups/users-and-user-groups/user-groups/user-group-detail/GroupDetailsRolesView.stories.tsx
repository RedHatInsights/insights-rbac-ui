import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { MemoryRouter } from 'react-router-dom';
import { DataViewEventsProvider } from '@patternfly/react-data-view';

import { GroupDetailsRolesView } from './GroupDetailsRolesView';
import {
  createRoleBindingsListHandlers,
  roleBindingsErrorHandlers,
  roleBindingsLoadingHandlers,
} from '../../../../../../v2/data/mocks/roleBindings.handlers';
import type { RoleBinding } from '../../../../../../v2/data/queries/roleBindings';
import { BINDING_TENANT_ADMIN_ADMINS_PROD, BINDING_WS_ADMIN_ADMINS_DEV } from '../../../../../../v2/data/mocks/seed';
import { GROUP_PLATFORM_ADMINS } from '../../../../../../shared/data/mocks/seed';

const TEST_GROUP_ID = GROUP_PLATFORM_ADMINS.uuid;

const testBindings: RoleBinding[] = [BINDING_TENANT_ADMIN_ADMINS_PROD, BINDING_WS_ADMIN_ADMINS_DEV];

const meta: Meta<typeof GroupDetailsRolesView> = {
  component: GroupDetailsRolesView,
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
**GroupDetailsRolesView** displays roles assigned to a user group via role bindings (V2 API).

Columns: Role name, Workspace.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof GroupDetailsRolesView>;

export const Default: Story = {
  args: {
    groupId: TEST_GROUP_ID,
    ouiaId: 'group-roles-view-default',
  },
  tags: ['autodocs'],
  parameters: {
    msw: {
      handlers: [...createRoleBindingsListHandlers(testBindings)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify role names displayed', async () => {
      await expect(canvas.findByText(BINDING_TENANT_ADMIN_ADMINS_PROD.role.name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(BINDING_WS_ADMIN_ADMINS_DEV.role.name)).resolves.toBeInTheDocument();
    });

    await step('Verify workspace names displayed', async () => {
      await expect(canvas.findByText(BINDING_TENANT_ADMIN_ADMINS_PROD.resource.name)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(BINDING_WS_ADMIN_ADMINS_DEV.resource.name)).resolves.toBeInTheDocument();
    });
  },
};

export const Loading: Story = {
  args: {
    groupId: 'loading-group-id',
    ouiaId: 'group-roles-view-loading',
  },
  parameters: {
    msw: {
      handlers: [...roleBindingsLoadingHandlers()],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify loading state', async () => {
      await expect(canvas.findByLabelText('GroupRolesView')).resolves.toBeInTheDocument();
    });
  },
};

export const EmptyGroup: Story = {
  args: {
    groupId: 'empty-group-id',
    ouiaId: 'group-roles-view-empty',
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
      await expect(canvas.findByText('This group currently has no roles assigned to it.')).resolves.toBeInTheDocument();
    });
  },
};

export const APIError: Story = {
  args: {
    groupId: 'error-group-id',
    ouiaId: 'group-roles-view-api-error',
  },
  parameters: {
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
    msw: {
      handlers: [...roleBindingsErrorHandlers(500)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify API error state', async () => {
      await expect(
        await canvas.findByText((content, element) => element?.textContent === 'Something went wrong. Please try again.'),
      ).toBeInTheDocument();
    });
  },
};

export const NetworkFailure: Story = {
  args: {
    groupId: 'network-error-group-id',
    ouiaId: 'group-roles-view-network-error',
  },
  parameters: {
    test: {
      dangerouslyIgnoreUnhandledErrors: true,
    },
    msw: {
      handlers: [...roleBindingsErrorHandlers(500)],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify network failure state', async () => {
      await expect(
        await canvas.findByText((content, element) => element?.textContent === 'Something went wrong. Please try again.'),
      ).toBeInTheDocument();
    });
  },
};
