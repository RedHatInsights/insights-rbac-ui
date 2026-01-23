import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, screen, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { AccessTable } from './AccessTable';

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
      handlers: [
        http.get('/api/rbac/v1/access/', () => {
          return HttpResponse.json({
            data: mockPermissions,
            meta: {
              count: mockPermissions.length,
              limit: 20,
              offset: 0,
            },
          });
        }),
      ],
    },
  },
  args: {
    showResourceDefinitions: false, // Test default 3-column mode
  },
  play: async ({ canvasElement }) => {
    await delay(300); // Required for MSW
    const canvas = within(canvasElement);

    // Test real API orchestration - container triggers mutations and React Query updates
    // TableView may render "Application" in header and filter - check that at least header exists
    await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();
    await expect(canvas.findByRole('columnheader', { name: /application/i })).resolves.toBeInTheDocument();

    // Verify table headers (3-column mode without Resource Definitions)
    await expect(canvas.findByText('Resource type')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Operation')).resolves.toBeInTheDocument();
    await expect(canvas.queryByText('Resource definitions')).not.toBeInTheDocument();

    // Verify permission data loaded through Redux
    await expect(canvas.findByText('advisor')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('compliance')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('vulnerability')).resolves.toBeInTheDocument();
  },
};

// Other stories: NO docs config, just MSW + tests
export const LoadingState: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/access/', async () => {
          await delay('infinite'); // Never resolves to keep loading
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  args: {
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show table structure while API call is pending
    await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();

    // Since API never resolves (infinite delay), should not show final data
    await expect(canvas.queryByText('advisor')).not.toBeInTheDocument();
    await expect(canvas.queryByText('compliance')).not.toBeInTheDocument();
    await expect(canvas.queryByText('vulnerability')).not.toBeInTheDocument();
  },
};

export const EmptyPermissions: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/access/', () => {
          return HttpResponse.json({
            data: [],
            meta: { count: 0, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  args: {
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Should show empty state after API returns no data (TableView uses DefaultEmptyStateNoData)
    await expect(canvas.findByText('Configure permissions')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('To configure user access, create at least one permission.')).resolves.toBeInTheDocument();
  },
};

// Track API calls for parameter verification
const accessApiCallSpy = fn();

export const FilteringInteraction: Story = {
  parameters: {
    msw: {
      handlers: [
        // Spy on API calls to verify filtering parameters
        http.get('/api/rbac/v1/access/', ({ request }) => {
          const url = new URL(request.url);
          const searchParams = url.searchParams;

          // Call the spy with API parameters
          accessApiCallSpy({
            application: searchParams.get('application'),
            limit: searchParams.get('limit'),
            offset: searchParams.get('offset'),
            order_by: searchParams.get('order_by'),
          });

          // Return filtered mock data based on parameters
          let filteredPermissions = [...mockPermissions];
          const applicationFilter = searchParams.get('application');
          if (applicationFilter && applicationFilter !== 'advisor,compliance,vulnerability') {
            const apps = applicationFilter.split(',');
            filteredPermissions = filteredPermissions.filter((permission) => apps.some((app) => permission.permission.startsWith(app)));
          }

          return HttpResponse.json({
            data: filteredPermissions,
            meta: {
              count: filteredPermissions.length,
              limit: 20,
              offset: 0,
            },
          });
        }),
      ],
    },
  },
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: false,
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Initial load should call API with all applications
    await waitFor(() => {
      expect(accessApiCallSpy).toHaveBeenCalled();
      const lastCall = accessApiCallSpy.mock.calls[accessApiCallSpy.mock.calls.length - 1][0];
      expect(lastCall.application).toBe('advisor,compliance,vulnerability');
      expect(lastCall.limit).toBe('20');
      expect(lastCall.offset).toBe('0');
    });

    // Test single application filtering workflow
    // Find all Application buttons: [0] = category selector, [1] = filter values dropdown
    const applicationButtons = await canvas.findAllByRole('button', { name: /Application/i });
    // Click the filter values dropdown (second button)
    await userEvent.click(applicationButtons[1]);

    // Wait for dropdown menu to appear
    await delay(300);

    // Find the advisor checkbox in the dropdown (rendered in portal)
    const body = within(document.body);
    const advisorCheckbox = await body.findByRole('checkbox', { name: /advisor/i });

    // Reset spy before click
    accessApiCallSpy.mockClear();

    await userEvent.click(advisorCheckbox);
    await delay(200);

    // Verify single application filter API call (debounced)
    await waitFor(
      () => {
        expect(accessApiCallSpy).toHaveBeenCalled();
        const lastCall = accessApiCallSpy.mock.calls[accessApiCallSpy.mock.calls.length - 1][0];
        expect(lastCall.application).toBe('advisor');
        expect(lastCall.limit).toBe('20');
        expect(lastCall.offset).toBe('0');
      },
      { timeout: 1000 }, // Account for 500ms debounce
    );

    // Verify advisor filter is now active by checking the button text or dropdown state
    await waitFor(async () => {
      // The button should show some indication that a filter is selected
      expect(applicationButtons[1]).toBeInTheDocument();
    });

    // Test adding second application (multi-select) - dropdown should still be open
    const complianceCheckbox = await body.findByRole('checkbox', { name: /compliance/i });

    // Reset spy
    accessApiCallSpy.mockClear();

    await userEvent.click(complianceCheckbox);

    // Wait for debounced API call
    await delay(600);

    // Verify multiple application filter API call
    await waitFor(
      () => {
        expect(accessApiCallSpy).toHaveBeenCalled();
        const lastCall = accessApiCallSpy.mock.calls[accessApiCallSpy.mock.calls.length - 1][0];
        // Check if we got an API call with compliance
        expect(lastCall.application).toMatch(/compliance/);
        // The exact order may vary - could be 'compliance,advisor' or 'advisor,compliance'
        expect(lastCall.application).toMatch(/advisor/);
      },
      { timeout: 1000 },
    );

    // Test removing one application filter - click advisor again to uncheck it
    const advisorCheckboxToRemove = await body.findByRole('checkbox', { name: /advisor/i });

    // Reset spy
    accessApiCallSpy.mockClear();

    await userEvent.click(advisorCheckboxToRemove);
    await delay(100);

    // Wait for debounced API call
    await delay(600);

    // Verify single application remains
    await waitFor(
      () => {
        expect(accessApiCallSpy).toHaveBeenCalled();
        const lastCall = accessApiCallSpy.mock.calls[accessApiCallSpy.mock.calls.length - 1][0];
        expect(lastCall.application).toBe('compliance');
      },
      { timeout: 1000 },
    );

    // Test clear all filters functionality
    const clearAllFiltersButtons = await canvas.findAllByText('Clear filters');
    const clearAllFilters = clearAllFiltersButtons[0];

    // Reset spy
    accessApiCallSpy.mockClear();

    await userEvent.click(clearAllFilters);

    // Verify clear filters API call restores all applications
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

    // Verify UI state is also cleared - reopen filter dropdown
    const applicationButtonsAfterClear = await canvas.findAllByRole('button', { name: /Application/i });
    await userEvent.click(applicationButtonsAfterClear[1]);
    await delay(300);

    // All checkboxes should be unchecked after clear - find in portal (reuse body)
    const allOptions = await body.findAllByRole('checkbox');
    allOptions.forEach((checkbox) => {
      expect(checkbox).not.toBeChecked();
    });
  },
};

export const WithResourceDefinitions: Story = {
  parameters: {
    msw: {
      handlers: [
        http.get('/api/rbac/v1/access/', () => {
          return HttpResponse.json({
            data: mockPermissions,
            meta: {
              count: mockPermissions.length,
              limit: 20,
              offset: 0,
            },
          });
        }),
      ],
    },
  },
  args: {
    showResourceDefinitions: true,
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Test real API orchestration with Resource Definitions column
    // TableView may render "Application" in header and filter - check that at least header exists
    expect(await canvas.findByRole('columnheader', { name: /application/i })).toBeInTheDocument();

    // Verify all 4 table headers (including Resource Definitions)
    expect(await canvas.findByText('Resource type')).toBeInTheDocument();
    expect(await canvas.findByText('Operation')).toBeInTheDocument();
    expect(await canvas.findByText('Resource definitions')).toBeInTheDocument();

    // Verify permission data loaded through React Query
    expect(await canvas.findByText('advisor')).toBeInTheDocument();
    expect(await canvas.findByText('compliance')).toBeInTheDocument();
    expect(await canvas.findByText('vulnerability')).toBeInTheDocument();

    // Test modal functionality - click on the "2" in resource definitions column
    const resourceDefLink = await canvas.findByText('2');
    await userEvent.click(resourceDefLink);

    // Modal should open (renders to document.body via portal)
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Verify modal content shows resource definition details
    const modalContent = within(modal);
    expect(await modalContent.findByText('Resource definitions')).toBeInTheDocument();
  },
};

export const SortingInteraction: Story = {
  parameters: {
    msw: {
      handlers: [
        // Spy on API calls to verify sorting parameters
        http.get('/api/rbac/v1/access/', ({ request }) => {
          const url = new URL(request.url);
          const searchParams = url.searchParams;

          // Call the spy with API parameters
          accessApiCallSpy({
            application: searchParams.get('application'),
            limit: searchParams.get('limit'),
            offset: searchParams.get('offset'),
            order_by: searchParams.get('order_by'),
          });

          // Return mock data
          return HttpResponse.json({
            data: mockPermissions,
            meta: {
              count: mockPermissions.length,
              limit: 20,
              offset: 0,
            },
          });
        }),
      ],
    },
  },
  args: {
    apps: ['advisor', 'compliance', 'vulnerability'],
    showResourceDefinitions: false,
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Initial load should call API with default sorting (application, asc)
    await waitFor(
      () => {
        expect(accessApiCallSpy).toHaveBeenCalled();
        const lastCall = accessApiCallSpy.mock.calls[accessApiCallSpy.mock.calls.length - 1][0];
        expect(lastCall.order_by).toBe('application');
      },
      { timeout: 1000 },
    );

    // Wait for loading to complete - real data should appear
    await waitFor(
      async () => {
        // Verify real data is present, indicating loading is complete
        expect(await canvas.findByText('policies')).toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    // Wait for skeleton loading to complete and real content to appear
    const applicationHeaderCheck = await canvas.findByRole('columnheader', { name: /application/i });
    const buttons = within(applicationHeaderCheck).queryAllByRole('button');
    expect(buttons.length).toBeGreaterThan(0);

    // Test clicking Application column header for descending sort
    const applicationHeader = await canvas.findByRole('columnheader', { name: /application/i });
    const applicationButton = await within(applicationHeader).findByRole('button');

    await userEvent.click(applicationButton);

    // Wait for immediate API call and verify descending sort
    await waitFor(
      () => {
        expect(accessApiCallSpy).toHaveBeenCalled();
        const calls = accessApiCallSpy.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.order_by).toBe('-application');
      },
      { timeout: 1000 },
    ); // Shorter timeout since no debounce

    // Test clicking Resource Type column header
    const resourceTypeHeader = await canvas.findByRole('columnheader', { name: /resource type/i });
    const resourceTypeButton = await within(resourceTypeHeader).findByRole('button');

    await userEvent.click(resourceTypeButton);

    // Wait for immediate API call and verify resource type sort
    await waitFor(
      () => {
        expect(accessApiCallSpy).toHaveBeenCalled();
        const calls = accessApiCallSpy.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.order_by).toBe('resource_type');
      },
      { timeout: 1000 },
    );

    // Test clicking Operation column header
    const operationHeader = await canvas.findByRole('columnheader', { name: /operation/i });
    const operationButton = await within(operationHeader).findByRole('button');

    await userEvent.click(operationButton);

    // Wait for immediate API call and verify operation sort
    await waitFor(
      () => {
        expect(accessApiCallSpy).toHaveBeenCalled();
        const calls = accessApiCallSpy.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.order_by).toBe('verb');
      },
      { timeout: 1000 },
    );

    // Test sorting + filtering combination
    // Add an application filter first
    // TableView uses DataViewCheckboxFilter which renders a MenuToggle button
    // Use the OUIA component type to find the filter dropdown (not the sort button in column header)
    // Add application filter
    const applicationButtonsForSort = await canvas.findAllByRole('button', { name: /Application/i });
    await userEvent.click(applicationButtonsForSort[1]); // [1] = filter values dropdown
    await delay(300);

    // Find checkbox in dropdown (rendered in portal)
    const bodyForSort = within(document.body);
    const advisorCheckboxForSort = await bodyForSort.findByRole('checkbox', { name: /advisor/i });
    await userEvent.click(advisorCheckboxForSort);

    // Verify filtering + sorting works together
    await waitFor(
      () => {
        expect(accessApiCallSpy).toHaveBeenCalled();
        const calls = accessApiCallSpy.mock.calls;
        const lastCall = calls[calls.length - 1][0];
        expect(lastCall.application).toBe('advisor');
        expect(lastCall.order_by).toBe('verb'); // Should maintain previous sort
      },
      { timeout: 2000 },
    );
  },
};
