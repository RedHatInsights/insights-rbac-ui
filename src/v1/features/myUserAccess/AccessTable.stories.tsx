import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { findSortButton } from '../../../test-utils/tableHelpers';
import { AccessTable } from './AccessTable';
import { accessHandlers, accessLoadingHandlers } from '../../data/mocks/access.handlers';

// Mock permissions data
const mockPermissions = [
  {
    permission: 'advisor:*:*',
    resourceDefinitions: [
      { attributeFilter: { key: 'insights.advisor.source', operation: 'equal', value: 'advisor' } },
      { attributeFilter: { key: 'insights.advisor.environment', operation: 'equal', value: 'production' } },
    ],
  },
  {
    permission: 'compliance:policies:read',
    resourceDefinitions: [],
  },
  {
    permission: 'vulnerability:*:*',
    resourceDefinitions: [{ attributeFilter: { key: 'insights.vulnerability.source', operation: 'equal', value: 'scanner' } }],
  },
];

const meta: Meta<typeof AccessTable> = {
  component: AccessTable,
  parameters: {},
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
  },
  argTypes: {
    showResourceDefinitions: {
      control: 'boolean',
      description: 'Whether to show the Resource Definitions column',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof AccessTable>;

export const Default: Story = {
  tags: ['autodocs'], // ONLY default story gets autodocs
  parameters: {
    docs: {
      description: {
        story: `
**Default View**: Complete permissions table container with real API orchestration. Tests React Query mutations, reducers, and component integration end-to-end in 3-column mode (without Resource Definitions).

## Dual Mode Support

AccessTable supports two display modes controlled by \`showResourceDefinitions\` prop:
- **3-column mode** (default): Application, Resource Type, Operation
- **4-column mode**: Adds Resource Definitions column with modal functionality

## Additional Test Stories

For testing specific scenarios, see these additional stories:

- **[LoadingState](?path=/story/features-myuseraccess-accesstable--loading-state)**: Loading permissions from API
- **[EmptyPermissions](?path=/story/features-myuseraccess-accesstable--empty-permissions)**: No permissions available
- **[FilteringInteraction](?path=/story/features-myuseraccess-accesstable--filtering-interaction)**: Tests that filtering triggers correct API calls
- **[WithResourceDefinitions](?path=/story/features-myuseraccess-accesstable--with-resource-definitions)**: 4-column mode with Resource Definitions and modal functionality
        `,
      },
    },
    msw: {
      handlers: accessHandlers(mockPermissions as unknown as Parameters<typeof accessHandlers>[0]),
    },
  },
  args: {
    showResourceDefinitions: false, // Test default 3-column mode
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify table headers and permission data', async () => {
      expect(await canvas.findByRole('columnheader', { name: /application/i })).toBeInTheDocument();

      expect(await canvas.findByText('Resource type')).toBeInTheDocument();
      expect(await canvas.findByText('Operation')).toBeInTheDocument();
      expect(canvas.queryByText('Resource definitions')).not.toBeInTheDocument();

      expect(await canvas.findByText('advisor')).toBeInTheDocument();
      expect(await canvas.findByText('compliance')).toBeInTheDocument();
      expect(await canvas.findByText('vulnerability')).toBeInTheDocument();
    });
  },
};

// Other stories: NO docs config, just MSW + tests
export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: accessLoadingHandlers(),
    },
  },
  args: {
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify loading state', async () => {
      expect(await canvas.findByRole('grid')).toBeInTheDocument();

      expect(canvas.queryByText('advisor')).not.toBeInTheDocument();
      expect(canvas.queryByText('compliance')).not.toBeInTheDocument();
      expect(canvas.queryByText('vulnerability')).not.toBeInTheDocument();
    });
  },
};

export const EmptyPermissions: Story = {
  parameters: {
    msw: {
      handlers: accessHandlers([]),
    },
  },
  args: {
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify empty state', async () => {
      expect(await canvas.findByText('Configure permissions')).toBeInTheDocument();
      expect(await canvas.findByText('To configure user access, create at least one permission.')).toBeInTheDocument();
    });
  },
};

// Track API calls for parameter verification
const accessApiCallSpy = fn();

export const FilteringInteraction: Story = {
  parameters: {
    msw: {
      handlers: accessHandlers(mockPermissions as unknown as Parameters<typeof accessHandlers>[0], {
        onList: (params) =>
          accessApiCallSpy({
            application: params.get('application') ?? null,
            limit: params.get('limit') ?? null,
            offset: params.get('offset') ?? null,
            order_by: params.get('order_by') ?? null,
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
    const body = within(document.body);

    await step('Verify initial API call', async () => {
      await waitFor(() => {
        expect(accessApiCallSpy).toHaveBeenCalled();
        const lastCall = accessApiCallSpy.mock.calls[accessApiCallSpy.mock.calls.length - 1][0];
        expect(lastCall.application).toBe('advisor,compliance,vulnerability');
        expect(lastCall.limit).toBe('20');
        expect(lastCall.offset).toBe('0');
      });
    });

    await step('Apply single application filter', async () => {
      const applicationButtons = await canvas.findAllByRole('button', { name: /Application/i });
      await userEvent.click(applicationButtons[1]);

      const advisorCheckbox = await body.findByRole('checkbox', { name: /advisor/i });

      accessApiCallSpy.mockClear();

      await userEvent.click(advisorCheckbox);

      await waitFor(
        () => {
          expect(accessApiCallSpy).toHaveBeenCalled();
          const lastCall = accessApiCallSpy.mock.calls[accessApiCallSpy.mock.calls.length - 1][0];
          expect(lastCall.application).toBe('advisor');
          expect(lastCall.limit).toBe('20');
          expect(lastCall.offset).toBe('0');
        },
        { timeout: 1000 },
      );

      await waitFor(async () => {
        expect(applicationButtons[1]).toBeInTheDocument();
      });
    });

    await step('Add second application filter', async () => {
      const complianceCheckbox = await body.findByRole('checkbox', { name: /compliance/i });

      accessApiCallSpy.mockClear();

      await userEvent.click(complianceCheckbox);

      await waitFor(
        () => {
          expect(accessApiCallSpy).toHaveBeenCalled();
          const lastCall = accessApiCallSpy.mock.calls[accessApiCallSpy.mock.calls.length - 1][0];
          expect(lastCall.application).toMatch(/compliance/);
          expect(lastCall.application).toMatch(/advisor/);
        },
        { timeout: 1000 },
      );
    });

    await step('Remove one application filter', async () => {
      const advisorCheckboxToRemove = await body.findByRole('checkbox', { name: /advisor/i });

      accessApiCallSpy.mockClear();

      await userEvent.click(advisorCheckboxToRemove);

      await waitFor(
        () => {
          expect(accessApiCallSpy).toHaveBeenCalled();
          const lastCall = accessApiCallSpy.mock.calls[accessApiCallSpy.mock.calls.length - 1][0];
          expect(lastCall.application).toBe('compliance');
        },
        { timeout: 1000 },
      );
    });

    await step('Clear all filters and verify UI state', async () => {
      const clearAllFiltersButtons = await canvas.findAllByText('Clear filters');
      const clearAllFilters = clearAllFiltersButtons[0];

      accessApiCallSpy.mockClear();

      await userEvent.click(clearAllFilters);

      await waitFor(
        () => {
          expect(accessApiCallSpy).toHaveBeenCalled();
          const lastCall = accessApiCallSpy.mock.calls[accessApiCallSpy.mock.calls.length - 1][0];
          expect(lastCall.application).toBe('advisor,compliance,vulnerability');
          expect(lastCall.limit).toBe('20');
          expect(lastCall.offset).toBe('0');
        },
        { timeout: 1000 },
      );

      const applicationButtonsAfterClear = await canvas.findAllByRole('button', { name: /Application/i });
      await userEvent.click(applicationButtonsAfterClear[1]);

      const allOptions = await body.findAllByRole('checkbox');
      allOptions.forEach((checkbox) => {
        expect(checkbox).not.toBeChecked();
      });
    });
  },
};

export const WithResourceDefinitions: Story = {
  parameters: {
    msw: {
      handlers: accessHandlers(mockPermissions as unknown as Parameters<typeof accessHandlers>[0]),
    },
  },
  args: {
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify table with resource definitions column', async () => {
      expect(await canvas.findByRole('columnheader', { name: /application/i })).toBeInTheDocument();

      expect(await canvas.findByText('Resource type')).toBeInTheDocument();
      expect(await canvas.findByText('Operation')).toBeInTheDocument();
      expect(await canvas.findByText('Resource definitions')).toBeInTheDocument();

      expect(await canvas.findByText('advisor')).toBeInTheDocument();
      expect(await canvas.findByText('compliance')).toBeInTheDocument();
      expect(await canvas.findByText('vulnerability')).toBeInTheDocument();
    });

    await step('Open resource definitions modal', async () => {
      const resourceDefLink = await canvas.findByText('2');
      await userEvent.click(resourceDefLink);

      const modal = await screen.findByRole('dialog');
      expect(modal).toBeInTheDocument();

      const modalContent = within(modal);
      expect(await modalContent.findByText('Resource definitions')).toBeInTheDocument();
    });
  },
};

export const SortingInteraction: Story = {
  parameters: {
    msw: {
      handlers: accessHandlers(mockPermissions as unknown as Parameters<typeof accessHandlers>[0], {
        onList: (params) =>
          accessApiCallSpy({
            application: params.get('application') ?? null,
            limit: params.get('limit') ?? null,
            offset: params.get('offset') ?? null,
            order_by: params.get('order_by') ?? null,
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

    await step('Wait for data load and verify initial sort', async () => {
      await canvas.findByText('policies', {}, { timeout: 10000 });

      await waitFor(() => {
        expect(accessApiCallSpy).toHaveBeenCalled();
        const lastCall = accessApiCallSpy.mock.calls[accessApiCallSpy.mock.calls.length - 1][0];
        expect(lastCall.order_by).toBe('application');
      });
    });

    await step('Sort by Application descending', async () => {
      const applicationButton = await findSortButton(canvas, /application/i);

      await userEvent.click(applicationButton);

      await waitFor(() => {
        const calls = accessApiCallSpy.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.order_by).toBe('-application');
      });
    });

    await step('Sort by Resource Type', async () => {
      const resourceTypeButton = await findSortButton(canvas, /resource type/i);

      await userEvent.click(resourceTypeButton);

      await waitFor(
        () => {
          expect(accessApiCallSpy).toHaveBeenCalled();
          const calls = accessApiCallSpy.mock.calls;
          const lastCall = calls[calls.length - 1][0];
          expect(lastCall.order_by).toBe('resource_type');
        },
        { timeout: 1000 },
      );
    });

    await step('Sort by Operation', async () => {
      const operationButton = await findSortButton(canvas, /operation/i);

      await userEvent.click(operationButton);

      await waitFor(
        () => {
          expect(accessApiCallSpy).toHaveBeenCalled();
          const calls = accessApiCallSpy.mock.calls;
          const lastCall = calls[calls.length - 1][0];
          expect(lastCall.order_by).toBe('verb');
        },
        { timeout: 1000 },
      );
    });

    await step('Add application filter and verify sort preserved', async () => {
      const applicationButtonsForSort = await canvas.findAllByRole('button', { name: /Application/i });
      await userEvent.click(applicationButtonsForSort[1]);

      const bodyForSort = within(document.body);
      const advisorCheckboxForSort = await bodyForSort.findByRole('checkbox', { name: /advisor/i });
      await userEvent.click(advisorCheckboxForSort);

      await waitFor(
        () => {
          expect(accessApiCallSpy).toHaveBeenCalled();
          const calls = accessApiCallSpy.mock.calls;
          const lastCall = calls[calls.length - 1][0];
          expect(lastCall.application).toBe('advisor');
          expect(lastCall.order_by).toBe('verb');
        },
        { timeout: 2000 },
      );
    });
  },
};
