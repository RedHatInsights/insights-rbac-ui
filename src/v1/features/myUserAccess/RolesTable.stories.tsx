import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { findSortButton } from '../../../test-utils/tableHelpers';
import { RolesTable } from './RolesTable';
import { v1RolesHandlers, v1RolesLoadingHandlers } from '../../data/mocks/roles.handlers';

// Mock roles data
const mockRoles = [
  {
    uuid: 'role-1',
    display_name: 'Advisor Administrator',
    name: 'advisor-admin',
    description: 'Full access to Advisor services',
    accessCount: 5,
    applications: ['advisor', 'compliance', 'vulnerability'],
    system: false,
    platform_default: false,
    created: '2024-01-01',
    modified: '2024-01-01',
    policyCount: 1,
  },
  {
    uuid: 'role-2',
    display_name: 'Compliance Viewer',
    name: 'compliance-viewer',
    description: 'Read-only access to Compliance reports',
    accessCount: 2,
    applications: ['advisor', 'compliance', 'vulnerability'],
    system: false,
    platform_default: false,
    created: '2024-01-01',
    modified: '2024-01-01',
    policyCount: 1,
  },
  {
    uuid: 'role-3',
    display_name: 'Vulnerability Manager',
    name: 'vulnerability-manager',
    description: 'Manage vulnerability scanning and reports',
    accessCount: 8,
    applications: ['advisor', 'compliance', 'vulnerability'],
    system: false,
    platform_default: false,
    created: '2024-01-01',
    modified: '2024-01-01',
    policyCount: 1,
  },
];

// Mock role permissions data for expanded view
const mockRolePermissions = [
  {
    permission: 'advisor:*:*',
    resourceDefinitions: [{ attributeFilter: { key: 'insights.advisor.source', operation: 'equal', value: 'advisor' } }],
  },
  {
    permission: 'compliance:policies:read',
    resourceDefinitions: [],
  },
];

const meta: Meta<typeof RolesTable> = {
  component: RolesTable,
  parameters: {
    msw: {
      handlers: v1RolesHandlers(mockRoles.map((r) => ({ ...r, access: mockRolePermissions })) as unknown as Parameters<typeof v1RolesHandlers>[0]),
    },
  },
  argTypes: {
    apps: {
      control: 'object',
      description: 'List of applications to show roles for',
      table: {
        type: { summary: 'string[]' },
        defaultValue: { summary: '[]' },
      },
    },
    showResourceDefinitions: {
      control: 'boolean',
      description: 'Whether to show the Resource Definitions column',
      table: {
        type: { summary: 'boolean' },
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof RolesTable>;

export const Default: Story = {
  tags: ['autodocs'], // ONLY default story gets autodocs
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Complete roles table container with real API orchestration. Tests React Query mutations, reducers, and component integration end-to-end.

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[LoadingState](?path=/story/features-myuseraccess-rolestable--loading-state)**: Loading roles from API
- **[EmptyRoles](?path=/story/features-myuseraccess-rolestable--empty-roles)**: No roles available
- **[FilteringInteraction](?path=/story/features-myuseraccess-rolestable--filtering-interaction)**: Tests that filtering triggers correct API calls
- **[PermissionExpansion](?path=/story/features-myuseraccess-rolestable--permission-expansion)**: Testing permission row expansion functionality
- **[WithoutResourceDefinitions](?path=/story/features-myuseraccess-rolestable--without-resource-definitions)**: Table without resource definitions column
        `,
      },
    },
  },
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify table and role data loaded', async () => {
      expect(await canvas.findByRole('grid')).toBeInTheDocument();

      expect(await canvas.findByText('Advisor Administrator')).toBeInTheDocument();
      expect(await canvas.findByText('Compliance Viewer')).toBeInTheDocument();
      expect(await canvas.findByText('Vulnerability Manager')).toBeInTheDocument();
    });
  },
};

// Track API calls for parameter verification
const apiCallSpy = fn();

// Other stories: NO docs config, just MSW + tests
export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: v1RolesLoadingHandlers(),
    },
  },
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify loading state', async () => {
      expect(await canvas.findByRole('grid')).toBeInTheDocument();

      expect(canvas.queryByText('Advisor Administrator')).not.toBeInTheDocument();
      expect(canvas.queryByText('Compliance Viewer')).not.toBeInTheDocument();
      expect(canvas.queryByText('Vulnerability Manager')).not.toBeInTheDocument();
    });
  },
};

export const EmptyRoles: Story = {
  parameters: {
    msw: {
      handlers: v1RolesHandlers([]),
    },
  },
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty state', async () => {
      expect(await canvas.findByText('Configure roles')).toBeInTheDocument();
    });
  },
};

export const FilteringInteraction: Story = {
  parameters: {
    msw: {
      handlers: v1RolesHandlers(mockRoles.map((r) => ({ ...r, access: mockRolePermissions })) as unknown as Parameters<typeof v1RolesHandlers>[0], {
        onList: (params) =>
          apiCallSpy({
            name: params?.get?.('name') ?? null,
            application: params?.get?.('application') ?? null,
            limit: params?.get?.('limit') ?? null,
            offset: params?.get?.('offset') ?? null,
            orderBy: params?.get?.('orderBy') ?? params?.get?.('order_by') ?? null,
            scope: params?.get?.('scope') ?? null,
          }),
      }),
    },
  },
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial API call', async () => {
      await waitFor(() => {
        expect(apiCallSpy).toHaveBeenCalled();
        const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
        expect(lastCall.scope).toBe('principal');
        expect(lastCall.application).toBe('advisor,compliance,vulnerability');
      });
    });

    await step('Apply role name filter', async () => {
      const roleFilter = await canvas.findByPlaceholderText('Filter by role name...');

      apiCallSpy.mockClear();

      await userEvent.type(roleFilter, 'admin');

      await waitFor(
        () => {
          expect(apiCallSpy).toHaveBeenCalled();
          const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
          expect(lastCall.name).toBe('admin');
          expect(lastCall.scope).toBe('principal');
          expect(lastCall.application).toBe('advisor,compliance,vulnerability');
        },
        { timeout: 1000 },
      );
    });

    await step('Apply application filter', async () => {
      const filterDropdownButton = await canvas.findByRole('button', { name: /Role name/i });
      await userEvent.click(filterDropdownButton);

      const applicationOption = await within(document.body).findByRole('menuitem', { name: /Application/i });
      await userEvent.click(applicationOption);

      const applicationFilter = await canvas.findByRole('button', { name: /Filter by application/i });

      apiCallSpy.mockClear();

      await userEvent.click(applicationFilter);

      const advisorMenuItem = await within(document.body).findByText('advisor');
      await userEvent.click(advisorMenuItem);

      await waitFor(
        () => {
          expect(apiCallSpy).toHaveBeenCalled();
          const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
          expect(lastCall.application).toBe('advisor');
          expect(lastCall.name).toBe('admin');
        },
        { timeout: 1000 },
      );
    });

    await step('Clear all filters', async () => {
      const clearAllFilters = await canvas.findByRole('button', { name: /clear filters/i });

      apiCallSpy.mockClear();

      await userEvent.click(clearAllFilters);

      await waitFor(
        () => {
          expect(apiCallSpy).toHaveBeenCalled();
          const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
          expect(lastCall.name).toBeNull();
          expect(lastCall.application).toBe('advisor,compliance,vulnerability');
        },
        { timeout: 1000 },
      );
    });
  },
};

export const PermissionExpansion: Story = {
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify roles loaded', async () => {
      expect(await canvas.findByText('Advisor Administrator')).toBeInTheDocument();
      expect(await canvas.findByText('Compliance Viewer')).toBeInTheDocument();
    });

    await step('Expand role and verify permissions', async () => {
      const permissionsCount = await canvas.findByText('5');
      await userEvent.click(permissionsCount);

      await waitFor(() => {
        const tbody = permissionsCount.closest('tbody');
        const table = tbody?.querySelector('table');
        if (!table) throw new Error('Could not find expanded table');
        const expandedRow = within(table);
        expect(expandedRow.queryByText('advisor')).toBeInTheDocument();
        expect(expandedRow.queryByText('compliance')).toBeInTheDocument();
      });
    });
  },
};

export const WithoutResourceDefinitions: Story = {
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify table without resource definitions column', async () => {
      expect(await canvas.findByRole('grid')).toBeInTheDocument();
      expect(await canvas.findByText('Advisor Administrator')).toBeInTheDocument();

      expect(canvas.queryByText('Resource Definitions')).not.toBeInTheDocument();
    });
  },
};

export const SortingInteraction: Story = {
  parameters: {
    msw: {
      handlers: v1RolesHandlers(mockRoles as unknown as Parameters<typeof v1RolesHandlers>[0], {
        onList: (params) =>
          apiCallSpy({
            name: params?.get?.('name') ?? null,
            application: params?.get?.('application') ?? null,
            limit: params?.get?.('limit') ?? null,
            offset: params?.get?.('offset') ?? null,
            orderBy: params?.get?.('orderBy') ?? params?.get?.('order_by') ?? null,
            scope: params?.get?.('scope') ?? null,
          }),
      }),
    },
  },
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wait for data to load', async () => {
      await canvas.findByText('Advisor Administrator');
    });

    await step('Verify initial sort', async () => {
      expect(apiCallSpy).toHaveBeenCalled();
      const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
      expect(lastCall.orderBy).toBe('display_name');
    });

    await step('Toggle to descending sort', async () => {
      const rolesButton = await findSortButton(canvas, /roles/i);

      apiCallSpy.mockClear();

      await userEvent.click(rolesButton);

      await waitFor(
        () => {
          expect(apiCallSpy).toHaveBeenCalled();
          const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
          expect(lastCall.orderBy).toBe('-display_name');
        },
        { timeout: 1000 },
      );
    });

    await step('Toggle to ascending sort', async () => {
      const rolesButton = await findSortButton(canvas, /roles/i);

      apiCallSpy.mockClear();

      await userEvent.click(rolesButton);

      await waitFor(
        () => {
          expect(apiCallSpy).toHaveBeenCalled();
          const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
          expect(lastCall.orderBy).toBe('display_name');
        },
        { timeout: 1000 },
      );
    });

    await step('Add role filter and verify sort preserved', async () => {
      const roleFilter = await canvas.findByRole('button', { name: /Role name/i });
      await userEvent.click(roleFilter);

      const roleNameMenuItem = await within(document.body).findByRole('menuitem', { name: /Role name/i });
      await userEvent.click(roleNameMenuItem);

      const roleNameInput = await canvas.findByPlaceholderText(/Filter by role name/i);

      apiCallSpy.mockClear();

      await userEvent.type(roleNameInput, 'admin');

      await waitFor(
        () => {
          expect(apiCallSpy).toHaveBeenCalled();
          const lastCall = apiCallSpy.mock.calls[apiCallSpy.mock.calls.length - 1][0];
          expect(lastCall.name).toBe('admin');
          expect(lastCall.orderBy).toBe('display_name');
        },
        { timeout: 1000 },
      );
    });
  },
};
