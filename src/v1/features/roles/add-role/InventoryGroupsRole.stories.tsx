import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import InventoryGroupsRole from './InventoryGroupsRole';
import { createInventoryHandlers } from '../../../data/mocks/inventory.handlers';
import { type MockInventoryGroup, defaultInventoryGroups } from '../../../data/mocks/inventory.fixtures';

const FIXTURE_GROUP_1 = defaultInventoryGroups[0];
const FIXTURE_GROUP_2 = defaultInventoryGroups[1];

const inventoryGroupsSpy = fn();

const extendedMapper = {
  ...componentMapper,
  'inventory-groups-role': InventoryGroupsRole,
};

const HOSTS_READ_PERMISSION = { uuid: 'inventory:hosts:read' };
const HOSTS_WRITE_PERMISSION = { uuid: 'inventory:hosts:write' };
const GROUPS_READ_PERMISSION = { uuid: 'inventory:groups:read' };
const NON_INVENTORY_PERMISSION = { uuid: 'rbac:role:read' };

interface WrapperProps {
  inventoryPermissions: { uuid: string }[];
}

const InventoryGroupsRoleWithForm: React.FC<WrapperProps> = ({ inventoryPermissions }) => (
  <FormRenderer
    componentMapper={extendedMapper}
    FormTemplate={(props) => <Pf4FormTemplate {...props} showFormControls={false} />}
    schema={{
      fields: [
        {
          component: 'inventory-groups-role',
          name: 'inventory-groups-role',
        },
      ],
    }}
    onSubmit={() => {}}
    initialValues={{
      'add-permissions-table': [...inventoryPermissions, NON_INVENTORY_PERMISSION],
    }}
  />
);

const meta: Meta<typeof InventoryGroupsRoleWithForm> = {
  component: InventoryGroupsRoleWithForm,
  tags: ['inventory-groups-role'],
  parameters: {
    layout: 'padded',
    msw: {
      handlers: createInventoryHandlers(defaultInventoryGroups, [], {
        networkDelay: 100,
        onGroupsList: (req) => inventoryGroupsSpy(req),
      }),
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '900px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InventoryGroupsRoleWithForm>;

/**
 * Default: hosts:read + groups:read permissions.
 * Verifies both permission rows render and dropdown shows the two fixture groups.
 */
export const Default: Story = {
  tags: ['autodocs'],
  args: {
    inventoryPermissions: [HOSTS_READ_PERMISSION, GROUPS_READ_PERMISSION],
  },
  parameters: {
    docs: {
      description: {
        story: `
Renders the InventoryGroupsRole component with \`inventory:hosts:read\` and \`inventory:groups:read\` permissions.

**Verifies:**
- Both permission rows render (hosts:read, groups:read)
- Dropdown opens and shows the two fixture groups (RHEL Servers, Satellite Hosts)
- "Select all" option is present
- "Ungrouped systems" appears only for hosts permissions

## Additional stories
- **[WithHostsPermission](?path=/story/v1-features-roles-add-role-inventorygroupsrolewithform--with-hosts-permission)**: Ungrouped systems option
- **[TypeaheadFiltering](?path=/story/v1-features-roles-add-role-inventorygroupsrolewithform--typeahead-filtering)**: Client-side search
- **[SelectAndDeselect](?path=/story/v1-features-roles-add-role-inventorygroupsrolewithform--select-and-deselect)**: Selection flow
- **[LargeDataset](?path=/story/v1-features-roles-add-role-inventorygroupsrolewithform--large-dataset)**: 60+ groups with cap
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify permissions and dropdown options', async () => {
      await expect(canvas.findByText(/hosts:read/)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(/groups:read/)).resolves.toBeInTheDocument();

      const toggles = await canvas.findAllByRole('combobox');
      await expect(toggles.length).toBe(2);

      await userEvent.click(toggles[0]);

      const body = within(document.body);
      await expect(body.findByText(FIXTURE_GROUP_1.name)).resolves.toBeInTheDocument();
      await expect(body.findByText(FIXTURE_GROUP_2.name)).resolves.toBeInTheDocument();
      await expect(body.findByText(/select all/i)).resolves.toBeInTheDocument();
    });
  },
};

/**
 * Single hosts:read permission: verifies "Ungrouped systems" option and divider.
 */
export const WithHostsPermission: Story = {
  args: {
    inventoryPermissions: [HOSTS_READ_PERMISSION],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify hosts permission and ungrouped systems option', async () => {
      await expect(canvas.findByText(/hosts:read/)).resolves.toBeInTheDocument();

      const toggle = await canvas.findByRole('combobox');
      await userEvent.click(toggle);

      const body = within(document.body);
      await expect(body.findByText(/ungrouped systems/i)).resolves.toBeInTheDocument();
      await expect(body.findByText(FIXTURE_GROUP_1.name)).resolves.toBeInTheDocument();
      await expect(body.findByText(FIXTURE_GROUP_2.name)).resolves.toBeInTheDocument();
    });
  },
};

/**
 * Single groups:read permission: "Ungrouped systems" should NOT appear.
 */
export const WithGroupsPermission: Story = {
  args: {
    inventoryPermissions: [GROUPS_READ_PERMISSION],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify groups permission without ungrouped systems', async () => {
      await expect(canvas.findByText(/groups:read/)).resolves.toBeInTheDocument();

      const toggle = await canvas.findByRole('combobox');
      await userEvent.click(toggle);

      const body = within(document.body);
      await expect(body.findByText(FIXTURE_GROUP_1.name)).resolves.toBeInTheDocument();

      const ungrouped = body.queryByText(/ungrouped systems/i);
      await expect(ungrouped).not.toBeInTheDocument();
    });
  },
};

/**
 * Type-ahead filtering: type in the search box, verify client-side filter narrows options.
 */
export const TypeaheadFiltering: Story = {
  args: {
    inventoryPermissions: [HOSTS_READ_PERMISSION],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify typeahead filtering', async () => {
      const toggle = await canvas.findByRole('combobox');
      await userEvent.click(toggle);

      const body = within(document.body);
      await expect(body.findByText(FIXTURE_GROUP_1.name)).resolves.toBeInTheDocument();
      await expect(body.findByText(FIXTURE_GROUP_2.name)).resolves.toBeInTheDocument();

      await userEvent.type(toggle, 'RHEL');

      await expect(body.findByText(FIXTURE_GROUP_1.name)).resolves.toBeInTheDocument();
      await expect(body.queryByText(FIXTURE_GROUP_2.name)).not.toBeInTheDocument();
    });
  },
};

/**
 * Select a group, verify chip appears; deselect, verify chip gone.
 */
export const SelectAndDeselect: Story = {
  args: {
    inventoryPermissions: [HOSTS_READ_PERMISSION],
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Select and deselect group', async () => {
      const toggle = await canvas.findByRole('combobox');
      await userEvent.click(toggle);

      const body = within(document.body);
      const option = await body.findByText(FIXTURE_GROUP_1.name);
      await userEvent.click(option);

      await waitFor(async () => {
        await expect(canvas.findByText('selected')).resolves.toBeInTheDocument();
      });

      await userEvent.click(toggle);

      const optionAgain = await body.findByText(FIXTURE_GROUP_1.name);
      await userEvent.click(optionAgain);

      await waitFor(async () => {
        await expect(canvas.queryByText('selected')).not.toBeInTheDocument();
      });
    });
  },
};

/**
 * "Copy to all" copies the first row's selection to every other row.
 * Ungrouped systems (null ID) is filtered out for non-hosts permissions.
 */
export const CopyToAll: Story = {
  args: {
    inventoryPermissions: [HOSTS_READ_PERMISSION, HOSTS_WRITE_PERMISSION, GROUPS_READ_PERMISSION],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const body = within(document.body);

    const toggles = await canvas.findAllByRole('combobox');
    await expect(toggles.length).toBe(3);

    // Select "Ungrouped systems" + first fixture group in the first dropdown (hosts:read)
    await userEvent.click(toggles[0]);

    const ungroupedOption = await body.findByText(/ungrouped systems/i);
    await userEvent.click(ungroupedOption);

    const groupOption = await body.findByText(FIXTURE_GROUP_1.name);
    await userEvent.click(groupOption);

    // Close the dropdown
    await userEvent.click(toggles[0]);

    // First row should show a "selected" chip — only one row has selections so far
    const chipsBeforeCopy = canvas.getAllByText('selected');
    await expect(chipsBeforeCopy).toHaveLength(1);

    // Click "Copy to all"
    const copyBtn = await canvas.findByText(/copy to all/i);
    await userEvent.click(copyBtn);

    // All three rows should now show a "selected" chip
    await waitFor(() => {
      const chipsAfterCopy = canvas.getAllByText('selected');
      expect(chipsAfterCopy).toHaveLength(3);
    });

    // Verify badge counts:
    // hosts rows get the full selection (ungrouped + group = 2)
    // groups:read row gets null-id filtered out (group only = 1)
    const badges = canvas.getAllByText(/^\d+$/);
    const badgeValues = badges.map((el) => el.textContent);
    await expect(badgeValues).toEqual(['2', '2', '1']);
  },
};

function generateManyGroups(count: number): MockInventoryGroup[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `inv-group-${i + 1}`,
    name: `Inventory Group ${String(i + 1).padStart(3, '0')}`,
    host_count: i * 10,
    updated: '2024-01-01T00:00:00Z',
  }));
}

const LARGE_GROUPS = generateManyGroups(60);

/**
 * 60 groups: dropdown caps at 50 and shows "type to refine" hint.
 */
export const LargeDataset: Story = {
  args: {
    inventoryPermissions: [HOSTS_READ_PERMISSION],
  },
  parameters: {
    msw: {
      handlers: createInventoryHandlers(LARGE_GROUPS, [], { networkDelay: 100 }),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const toggle = await canvas.findByRole('combobox');
    await userEvent.click(toggle);

    const body = within(document.body);
    await expect(body.findByText(LARGE_GROUPS[0].name)).resolves.toBeInTheDocument();
    await expect(body.findByText(LARGE_GROUPS[49].name)).resolves.toBeInTheDocument();

    await expect(body.queryByText(LARGE_GROUPS[50].name)).not.toBeInTheDocument();

    await expect(body.findByText(/showing 50 of 60/i)).resolves.toBeInTheDocument();
  },
};

/**
 * Loading state: shows spinner while API call is in-flight.
 */
export const Loading: Story = {
  args: {
    inventoryPermissions: [HOSTS_READ_PERMISSION],
  },
  parameters: {
    msw: {
      handlers: [...createInventoryHandlers([], [], { networkDelay: 999999 })],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify loading state', async () => {
      const toggle = await canvas.findByRole('combobox');
      await userEvent.click(toggle);

      const body = within(document.body);
      await expect(body.findByRole('progressbar')).resolves.toBeInTheDocument();
    });
  },
};
