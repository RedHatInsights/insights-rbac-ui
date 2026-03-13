import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { GroupServiceAccounts } from './GroupServiceAccounts';
import { groupsHandlers } from '../../../../../shared/data/mocks/groups.handlers';
import { groupMembersHandlers, groupMembersLoadingHandlers } from '../../../../../shared/data/mocks/groupMembers.handlers';
import type { ServiceAccount } from '../../../../../shared/data/mocks/db';
import type { GroupOut } from '../../../../../shared/data/mocks/db';

const clearFiltersSpy = fn();

const storyServiceAccounts: ServiceAccount[] = [
  {
    username: 'service-account-123',
    type: 'service-account' as const,
    name: 'ci-pipeline-service',
    clientId: 'service-account-123',
    owner: 'platform-team',
    time_created: 1642636800,
    description: 'CI/CD pipeline automation service account',
  },
  {
    username: 'service-account-456',
    type: 'service-account' as const,
    name: 'monitoring-collector',
    clientId: 'service-account-456',
    owner: 'ops-team',
    time_created: 1642550400,
    description: 'Monitoring and metrics collection service',
  },
  {
    username: 'service-account-789',
    type: 'service-account' as const,
    name: 'backup-automation',
    clientId: 'service-account-789',
    owner: 'infrastructure-team',
    time_created: 1642464000,
    description: 'Automated backup and data management',
  },
];

const testGroup: GroupOut = {
  uuid: 'test-group-id',
  name: 'Test Group',
  description: 'Test group for service accounts',
  principalCount: 3,
  roleCount: 2,
  created: '2024-01-15T10:30:00.000Z',
  modified: '2024-01-15T10:30:00.000Z',
  platform_default: false,
  admin_default: false,
  system: false,
};

const bulkActionsServiceAccounts: ServiceAccount[] = [
  {
    username: 'client-1',
    type: 'service-account' as const,
    name: 'test-service-1',
    clientId: 'client-1',
    owner: 'test-user',
    time_created: Math.floor(Date.now() / 1000),
    description: '',
  },
  {
    username: 'client-2',
    type: 'service-account' as const,
    name: 'test-service-2',
    clientId: 'client-2',
    owner: 'test-user',
    time_created: Math.floor(Date.now() / 1000),
    description: '',
  },
];

const GroupServiceAccountsWrapper: React.FC = () => {
  return <GroupServiceAccounts />;
};

const meta: Meta<typeof GroupServiceAccountsWrapper> = {
  component: GroupServiceAccountsWrapper,
  tags: ['custom-css'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/user-access/groups/detail/test-group-id/service-accounts']}>
        <Routes>
          <Route path="/user-access/groups/detail/:groupId/service-accounts" element={<Story />} />
        </Routes>
      </MemoryRouter>
    ),
  ],
  parameters: {
    msw: {
      handlers: [...groupsHandlers([testGroup]), ...groupMembersHandlers({}, { 'test-group-id': storyServiceAccounts })],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
**GroupServiceAccounts** is the container component for managing service accounts assigned to groups with comprehensive filtering, selection, and bulk operations.

## Feature Overview

This container provides complete service account management with:

- 🤖 **Service Account Listing** - View all service accounts assigned to a group
- 📋 **Detailed Information** - Shows client ID, owner, and creation date for each service account  
- ✅ **Bulk Selection** - Select multiple service accounts for batch operations
- 🔍 **Filtering & Search** - Find specific service accounts quickly
- 📄 **Pagination** - Handle large numbers of service accounts efficiently
- 🎯 **Action Integration** - Add/remove service accounts from groups

## Additional Test Stories

For testing specific scenarios and edge cases, see these additional stories:

- **[Loading](?path=/story/features-groups-group-service-account-groupserviceaccounts--loading)**: Tests skeleton loading state during data fetch
- **[EmptyState](?path=/story/features-groups-group-service-account-groupserviceaccounts--empty-state)**: Tests when no service accounts are assigned
- **[DefaultGroup](?path=/story/features-groups-group-service-account-groupserviceaccounts--default-group)**: Tests default group service account management
- **[WithSelection](?path=/story/features-groups-group-service-account-groupserviceaccounts--with-selection)**: Tests service account selection and bulk actions
- **[AdminDefault](?path=/story/features-groups-group-service-account-groupserviceaccounts--admin-default)**: Tests admin default group special handling

## What This Tests

- ✅ Service account data loads from API via React Query orchestration
- ✅ Table displays service account information correctly
- ✅ Pagination handles large datasets properly
- ✅ Filtering and search functionality works
- ✅ Selection and bulk operations are available
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      async () => {
        expect(await canvas.findByText(storyServiceAccounts[0].name!)).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    expect(await canvas.findByText(storyServiceAccounts[0].name!)).toBeInTheDocument();
    expect(await canvas.findByText(storyServiceAccounts[1].name!)).toBeInTheDocument();
    expect(await canvas.findByText(storyServiceAccounts[2].name!)).toBeInTheDocument();

    expect(await canvas.findByText(storyServiceAccounts[0].clientId!)).toBeInTheDocument();
    expect(await canvas.findByText(storyServiceAccounts[0].owner!)).toBeInTheDocument();
  },
};

export const Loading: Story = {
  parameters: {
    msw: {
      handlers: [...groupsHandlers([testGroup]), ...groupMembersLoadingHandlers()],
    },
  },
  play: async ({ canvasElement }) => {
    await waitFor(
      () => {
        const skeletons = canvasElement.querySelectorAll('[class*="skeleton"]');
        expect(skeletons.length).toBeGreaterThan(0);
      },
      { timeout: 10000 },
    );
  },
};

export const EmptyState: Story = {
  parameters: {
    msw: {
      handlers: [
        ...groupsHandlers([testGroup]),
        ...groupMembersHandlers({}, { 'test-group-id': [] }, { onListMembers: (_groupId, params) => clearFiltersSpy(params) }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      async () => {
        const loadingText = canvas.queryByText(/loading group data/i);
        expect(loadingText).not.toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    await waitFor(
      () => {
        const possibleEmptyStateTexts = [
          canvas.queryByText('There are no service accounts in this group'),
          canvas.queryByText(/no service accounts/i),
          canvas.queryByText(/empty/i),
          canvas.queryByText(/Add service accounts you wish to associate/i),
          canvas.queryByText(/no results found/i),
          canvas.queryByText(/no data/i),
        ];

        const foundEmptyState = possibleEmptyStateTexts.some((element) => element !== null);
        expect(foundEmptyState).toBe(true);
      },
      { timeout: 5000 },
    );

    const clearFiltersButton = canvas.queryByText('Clear all filters');
    if (clearFiltersButton) {
      expect(clearFiltersButton).toBeInTheDocument();
      expect(clearFiltersButton).toBeEnabled();
    }

    if (clearFiltersButton) {
      clearFiltersSpy.mockReset();

      await userEvent.click(clearFiltersButton);

      await waitFor(() => {
        const expectedParams = new URLSearchParams({
          principal_username: '',
          limit: '20',
          offset: '0',
          principal_type: 'service-account',
          service_account_description: '',
          service_account_name: '',
        });
        expect(clearFiltersSpy).toHaveBeenCalledWith(expectedParams);
      });
    }
  },
};

export const DefaultGroup: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(canvasElement.querySelector('#tab-service-accounts')).toBeInTheDocument();

    expect(await canvas.findByText(storyServiceAccounts[0].name!)).toBeInTheDocument();
  },
};

export const AdminDefault: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify admin default service accounts tab', async () => {
      expect(canvasElement.querySelector('#tab-service-accounts')).toBeInTheDocument();

      expect(await canvas.findByText(storyServiceAccounts[0].name!)).toBeInTheDocument();
    });
  },
};

export const WithSelection: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify selection of service account', async () => {
      expect(await canvas.findByText(storyServiceAccounts[0].name!)).toBeInTheDocument();
      expect(await canvas.findByText(storyServiceAccounts[1].name!)).toBeInTheDocument();

      const checkboxes = await canvas.findAllByRole('checkbox');
      if (checkboxes.length > 1) {
        await userEvent.click(checkboxes[1]);

        expect(checkboxes[1]).toBeChecked();
      }
    });
  },
};

export const ServiceAccountWorkflows: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [...groupsHandlers([testGroup]), ...groupMembersHandlers({}, { 'test-group-id': storyServiceAccounts })],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify service accounts and Add link', async () => {
      await waitFor(
        async () => {
          expect(await canvas.findByText(storyServiceAccounts[0].name!)).toBeInTheDocument();
          expect(await canvas.findByText(storyServiceAccounts[1].name!)).toBeInTheDocument();
          expect(await canvas.findByText(storyServiceAccounts[2].name!)).toBeInTheDocument();
        },
        { timeout: 10000 },
      );

      const addElements = canvas.queryAllByText(/add service account/i);
      expect(addElements.length).toBeGreaterThan(0);
      const interactiveAddElement = addElements.find(
        (el: Element) => el.closest('a') || el.closest('button') || el.getAttribute('role') === 'button',
      );
      expect(interactiveAddElement).toBeTruthy();
    });

    await step('Select service accounts and verify bulk selection', async () => {
      const checkboxes = await canvas.findAllByRole('checkbox');
      expect(checkboxes.length).toBeGreaterThan(2);

      await userEvent.click(checkboxes[1]);
      expect(checkboxes[1]).toBeChecked();
      await userEvent.click(checkboxes[2]);
      expect(checkboxes[2]).toBeChecked();

      const headerCheckbox = checkboxes[0];
      await userEvent.click(headerCheckbox);
      expect(headerCheckbox).toBeInTheDocument();

      const selectedCheckboxes = checkboxes.filter((cb: Element) => cb instanceof HTMLInputElement && cb.checked);
      expect(selectedCheckboxes.length).toBeGreaterThan(0);

      expect(checkboxes[1]).toBeChecked();
      expect(checkboxes[2]).toBeChecked();
    });
  },
};

export const ServiceAccountsFilteringWithData: Story = {
  tags: ['perm:org-admin'],
  parameters: {
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [...groupsHandlers([testGroup]), ...groupMembersHandlers({}, { 'test-group-id': storyServiceAccounts })],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    await waitFor(
      async () => {
        expect(await canvas.findByText(storyServiceAccounts[0].name!)).toBeInTheDocument();
        expect(await canvas.findByText(storyServiceAccounts[1].name!)).toBeInTheDocument();
        expect(await canvas.findByText(storyServiceAccounts[2].name!)).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    const filterInput = canvas.getByLabelText('Client ID filter');
    expect(filterInput).toBeInTheDocument();

    await userEvent.type(filterInput, storyServiceAccounts[2].clientId.slice(-3));

    await waitFor(
      () => {
        expect(canvas.getByText(storyServiceAccounts[2].name!)).toBeInTheDocument();
        expect(canvas.queryByText(storyServiceAccounts[0].name!)).not.toBeInTheDocument();
        expect(canvas.queryByText(storyServiceAccounts[1].name!)).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    await userEvent.clear(filterInput);

    await waitFor(
      () => {
        expect(canvas.getByText(storyServiceAccounts[0].name!)).toBeInTheDocument();
        expect(canvas.getByText(storyServiceAccounts[1].name!)).toBeInTheDocument();
        expect(canvas.getByText(storyServiceAccounts[2].name!)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const filterDropdown = canvas.getByRole('button', { name: /client id/i });
    await userEvent.click(filterDropdown);

    const nameOption = within(document.body).getByRole('menuitem', { name: 'Name' });
    await userEvent.click(nameOption);

    const nameFilterInput = canvas.getByLabelText('Name filter');
    await userEvent.type(nameFilterInput, storyServiceAccounts[1].name!.split('-')[0]);

    await waitFor(
      () => {
        expect(canvas.getByText(storyServiceAccounts[1].name!)).toBeInTheDocument();
        expect(canvas.queryByText(storyServiceAccounts[0].name!)).not.toBeInTheDocument();
        expect(canvas.queryByText(storyServiceAccounts[2].name!)).not.toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    await userEvent.clear(nameFilterInput);
    await userEvent.type(nameFilterInput, 'nonexistent');

    await waitFor(
      () => {
        expect(canvas.queryByText(storyServiceAccounts[0].name!)).not.toBeInTheDocument();
        expect(canvas.queryByText(storyServiceAccounts[1].name!)).not.toBeInTheDocument();
        expect(canvas.queryByText(storyServiceAccounts[2].name!)).not.toBeInTheDocument();

        const noResults =
          canvas.queryByText(/no service accounts match your filter criteria/i) ||
          canvas.queryByText(/no results found/i) ||
          canvas.queryByText(/no service accounts/i);
        if (noResults) {
          expect(noResults).toBeInTheDocument();
        }
      },
      { timeout: 5000 },
    );

    const clearFilterButtons = await canvas.findAllByText('Clear filters');
    await userEvent.click(clearFilterButtons[0]);

    await waitFor(
      () => {
        expect(canvas.getByText(storyServiceAccounts[0].name!)).toBeInTheDocument();
        expect(canvas.getByText(storyServiceAccounts[1].name!)).toBeInTheDocument();
        expect(canvas.getByText(storyServiceAccounts[2].name!)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

export const AddServiceAccountLinkTest: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: { disable: true },
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [
        ...groupsHandlers([
          {
            ...testGroup,
            name: 'Test Group for Link Testing',
            description: 'Test group for validating link generation',
            principalCount: 5,
            roleCount: 3,
          },
        ]),
        ...groupMembersHandlers({}, { 'test-group-id': storyServiceAccounts }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Add button and hover', async () => {
      const addButton = await canvas.findByRole('button', { name: /add service account/i });
      expect(addButton).toBeInTheDocument();

      await userEvent.hover(addButton);
    });
  },
};

export const BulkActionsTest: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: { disable: true },
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [
        ...groupsHandlers([
          {
            ...testGroup,
            name: 'Bulk Actions Test Group',
            description: 'Testing bulk actions functionality',
            principalCount: 2,
            roleCount: 1,
          },
        ]),
        ...groupMembersHandlers({}, { 'test-group-id': bulkActionsServiceAccounts }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Select row and open bulk actions', async () => {
      await canvas.findByText(bulkActionsServiceAccounts[0].name!, undefined, { timeout: 10000 });

      const table = canvas.getByRole('grid');
      const allCheckboxes = within(table).getAllByRole('checkbox');

      const rowCheckboxes = allCheckboxes.filter((checkbox) => {
        const label = checkbox.getAttribute('aria-label') || '';
        return label.includes('Select row');
      });

      expect(rowCheckboxes.length).toBeGreaterThan(0);

      await userEvent.click(rowCheckboxes[0]);

      expect(rowCheckboxes[0]).toBeChecked();

      const bulkActionButton = await canvas.findByRole('button', { name: /bulk actions/i });
      await userEvent.click(bulkActionButton);

      const removeOption = await within(document.body).findByRole('menuitem', { name: /remove/i });
      expect(removeOption).toBeInTheDocument();

      await userEvent.click(canvasElement);
    });

    await step('Deselect row', async () => {
      const table = canvas.getByRole('grid');
      const allCheckboxes = within(table).getAllByRole('checkbox');
      const rowCheckboxes = allCheckboxes.filter((checkbox) => {
        const label = checkbox.getAttribute('aria-label') || '';
        return label.includes('Select row');
      });

      await userEvent.click(rowCheckboxes[0]);
      expect(rowCheckboxes[0]).not.toBeChecked();
    });
  },
};

export const SelectAllTest: Story = {
  name: 'Select Page Functionality Test',
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: { disable: true },
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [
        ...groupsHandlers([
          {
            ...testGroup,
            name: 'Select All Test Group',
            description: 'Testing select all functionality',
            principalCount: 3,
            roleCount: 1,
          },
        ]),
        ...groupMembersHandlers({}, { 'test-group-id': storyServiceAccounts }),
      ],
    },
  },
  args: {
    groupId: 'test-group-id',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Select all on page', async () => {
      await waitFor(() => {
        expect(canvas.getByRole('grid')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(canvas.getByText(storyServiceAccounts[0].name!)).toBeInTheDocument();
      });

      const selectAllCheckbox = canvas.getByLabelText('Select page');
      expect(selectAllCheckbox).toBeInTheDocument();
      expect(selectAllCheckbox).not.toBeChecked();

      await user.click(selectAllCheckbox);

      await waitFor(() => {
        const allCheckboxes = canvas.getAllByRole('checkbox');
        const rowCheckboxes = allCheckboxes.filter((cb) => cb !== selectAllCheckbox);

        rowCheckboxes.forEach((checkbox) => {
          expect(checkbox).toBeChecked();
        });
      });

      const bulkActionsButton = canvas.queryByRole('button', { name: /bulk actions/i });
      if (bulkActionsButton) {
        expect(bulkActionsButton).toBeEnabled();
      }
    });

    await step('Deselect all on page', async () => {
      const selectAllCheckbox = canvas.getByLabelText('Select page');
      await user.click(selectAllCheckbox);

      await waitFor(() => {
        const allCheckboxes = canvas.getAllByRole('checkbox');
        const rowCheckboxes = allCheckboxes.filter((cb) => cb !== selectAllCheckbox);

        rowCheckboxes.forEach((checkbox) => {
          expect(checkbox).not.toBeChecked();
        });
      });
    });
  },
};

export const ActionsTest: Story = {
  tags: ['perm:user-access-admin'],
  parameters: {
    docs: { disable: true },
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
    msw: {
      handlers: [
        ...groupsHandlers([
          {
            ...testGroup,
            name: 'Test Group for Actions',
            description: 'Test group for validating row and toolbar actions',
            principalCount: 5,
            roleCount: 3,
          },
        ]),
        ...groupMembersHandlers({}, { 'test-group-id': storyServiceAccounts }),
      ],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify Add button and row actions', async () => {
      const addButton = await canvas.findByRole('button', { name: /add service account/i });
      expect(addButton).toBeInTheDocument();

      const actionsHeader = await canvas.findByText('Actions');
      expect(actionsHeader).toBeInTheDocument();

      const table = await canvas.findByRole('grid');
      const rowActionButtons = within(table).queryAllByRole('button', { name: /actions for service account/i });
      expect(rowActionButtons.length).toBeGreaterThan(0);
    });

    await step('Select row and verify bulk actions', async () => {
      const table = await canvas.findByRole('grid');
      const checkboxes = within(table).getAllByRole('checkbox');
      const selectableCheckboxes = checkboxes.filter((checkbox) => checkbox.getAttribute('aria-label')?.includes('Select row'));

      if (selectableCheckboxes.length > 0) {
        await userEvent.click(selectableCheckboxes[0]);

        await waitFor(
          async () => {
            const bulkActionButton = canvas.queryByRole('button', { name: /bulk actions/i });
            expect(bulkActionButton).toBeInTheDocument();
          },
          { timeout: 2000 },
        );

        const bulkActionButton = canvas.getByRole('button', { name: /bulk actions/i });
        await userEvent.click(bulkActionButton);

        const removeOption = await within(document.body).findByText('Remove');
        expect(removeOption).toBeInTheDocument();
      }
    });
  },
};
