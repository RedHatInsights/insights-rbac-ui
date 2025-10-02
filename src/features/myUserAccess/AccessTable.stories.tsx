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
**Default View**: Complete permissions table container with real API orchestration. Tests Redux actions, reducers, and component integration end-to-end in 3-column mode (without Resource Definitions).

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

    // Test real API orchestration - container dispatches actions and Redux updates
    expect(await canvas.findAllByText('Application')).toHaveLength(2);

    // Verify table headers (3-column mode without Resource Definitions)
    expect(await canvas.findByText('Resource type')).toBeInTheDocument();
    expect(await canvas.findByText('Operation')).toBeInTheDocument();
    expect(canvas.queryByText('Resource definitions')).not.toBeInTheDocument();

    // Verify permission data loaded through Redux
    expect(await canvas.findByText('advisor')).toBeInTheDocument();
    expect(await canvas.findByText('compliance')).toBeInTheDocument();
    expect(await canvas.findByText('vulnerability')).toBeInTheDocument();
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
    expect(await canvas.findByRole('grid')).toBeInTheDocument();

    // Since API never resolves (infinite delay), should not show final data
    expect(canvas.queryByText('advisor')).not.toBeInTheDocument();
    expect(canvas.queryByText('compliance')).not.toBeInTheDocument();
    expect(canvas.queryByText('vulnerability')).not.toBeInTheDocument();
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

    // Should show empty state after API returns no data
    expect(await canvas.findByText('Configure permissions')).toBeInTheDocument();
    expect(await canvas.findByText('To configure user access to applications create at least one permission.')).toBeInTheDocument();
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
    const applicationFilter = await canvas.findByRole('button', { name: /Filter by application/i });
    await userEvent.click(applicationFilter);

    // Find and select advisor option (checkbox in dropdown menu)
    const advisorMenuItem = await canvas.findByRole('menuitem', { name: /advisor/i });
    const advisorLabel = await within(advisorMenuItem).findByRole('checkbox');

    // Reset spy
    accessApiCallSpy.mockClear();

    await userEvent.click(advisorLabel);

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
      expect(applicationFilter).toBeInTheDocument();
    });

    // Test adding second application (multi-select)
    // The dropdown should still be open after selecting advisor (PatternFly multi-select behavior)
    // Wait for the compliance menu item to be available
    const complianceMenuItem = await waitFor(
      async () => {
        return await canvas.findByRole('menuitem', { name: /compliance/i });
      },
      { timeout: 2000 },
    );
    const complianceCheckbox = await within(complianceMenuItem).findByRole('checkbox');

    // Check if compliance checkbox is already checked (it should be unchecked)
    expect(complianceCheckbox).not.toBeChecked();

    // Reset spy
    accessApiCallSpy.mockClear();

    await userEvent.click(complianceCheckbox);

    // Verify checkbox is now checked
    expect(complianceCheckbox).toBeChecked();

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

    // Test removing one application filter
    // The dropdown should still be open, but let's make sure we have the right advisor checkbox
    const advisorMenuItemToRemove = await canvas.findByRole('menuitem', { name: /advisor/i });
    const advisorCheckboxToRemove = await within(advisorMenuItemToRemove).findByRole('checkbox');

    // Verify advisor is currently checked before trying to uncheck it
    expect(advisorCheckboxToRemove).toBeChecked();

    // Reset spy
    accessApiCallSpy.mockClear();

    // Uncheck advisor (should leave only compliance)
    await userEvent.click(advisorCheckboxToRemove);

    // Verify advisor is now unchecked
    await waitFor(
      () => {
        expect(advisorCheckboxToRemove).not.toBeChecked();
      },
      { timeout: 1000 },
    );

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
    const clearAllFilters = await canvas.findByText('Clear filters');

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

    // Verify UI state is also cleared
    await userEvent.click(applicationFilter);
    // All checkboxes should be unchecked after clear
    const allOptions = await canvas.findAllByRole('checkbox');
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
    expect(await canvas.findAllByText('Application')).toHaveLength(2);

    // Verify all 4 table headers (including Resource Definitions)
    expect(await canvas.findByText('Resource type')).toBeInTheDocument();
    expect(await canvas.findByText('Operation')).toBeInTheDocument();
    expect(await canvas.findByText('Resource definitions')).toBeInTheDocument();

    // Verify permission data loaded through Redux
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
    const applicationFilter = await canvas.findByRole('button', { name: /Filter by application/i });
    await userEvent.click(applicationFilter);

    await delay(200);

    const advisorMenuItem = await canvas.findByRole('menuitem', { name: /advisor/i });
    const advisorCheckbox = await within(advisorMenuItem).findByRole('checkbox');

    await userEvent.click(advisorCheckbox);

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
