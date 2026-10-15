import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router-dom';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { expectLoadingVisible } from '../../../test-utils/interactionHelpers';
import { type AuditLogEntry, AuditLogTable } from './AuditLogTable';

// ----------------------------------------------------------------------------
// Mocks
// ----------------------------------------------------------------------------

const mockEntries: AuditLogEntry[] = [
  {
    id: '1',
    date: '2024-02-20T14:32:00Z',
    requester: 'admin@example.com',
    description: 'Added user jdoe to group Platform Users',
    resource: 'Group',
    action: 'Add member',
  },
  {
    id: '2',
    date: '2024-02-20T13:15:00Z',
    requester: 'org.admin@example.com',
    description: 'Removed role Cost Management Viewer from group Finance',
    resource: 'Role',
    action: 'Remove',
  },
  {
    id: '3',
    date: '2024-02-20T11:00:00Z',
    requester: 'admin@example.com',
    description: 'Created role Custom Auditor',
    resource: 'Role',
    action: 'Create',
  },
  {
    id: '4',
    date: '2024-02-19T16:45:00Z',
    requester: 'admin@example.com',
    description: 'Deleted group Legacy Access',
    resource: 'Group',
    action: 'Delete',
  },
  {
    id: '5',
    date: '2024-02-19T10:20:00Z',
    requester: 'org.admin@example.com',
    description: 'Edited role Platform Administrator permissions',
    resource: 'Role',
    action: 'Edit',
  },
];

const RESOURCES = ['Group', 'Role', 'User', 'Permission'] as const;
const ACTIONS = ['Add member', 'Remove', 'Create', 'Delete', 'Edit'] as const;

/** Generate many mock entries for pagination testing (default 25 = 2 pages at perPage 20). */
function buildMockEntriesForPagination(count: number = 25): AuditLogEntry[] {
  const base = mockEntries;
  const entries: AuditLogEntry[] = [...base];
  for (let i = base.length; i < count; i++) {
    const n = i + 1;
    entries.push({
      id: String(n),
      date: `2024-02-${18 + (i % 3)}T${10 + (i % 8)}:${(i % 60).toString().padStart(2, '0')}:00Z`,
      requester: i % 3 === 0 ? 'admin@example.com' : 'org.admin@example.com',
      description: `Audit action ${n}: ${ACTIONS[i % ACTIONS.length]} on ${RESOURCES[i % RESOURCES.length]}`,
      resource: RESOURCES[i % RESOURCES.length],
      action: ACTIONS[i % ACTIONS.length],
    });
  }
  return entries;
}

const mockEntriesPaginated = buildMockEntriesForPagination(25);
const PAGINATION_PAGE_1_ENTRY = mockEntriesPaginated[5];
const PAGINATION_PAGE_2_ENTRY = mockEntriesPaginated[20];

// ----------------------------------------------------------------------------
// Meta
// ----------------------------------------------------------------------------

const meta: Meta<typeof AuditLogTable> = {
  component: AuditLogTable,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/user-access/audit-log']}>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
**AuditLogTable** is a paginated table of audit log entries for user access actions.

## Features
- Columns: Date, Requester, Description, Resource, Action
- Pagination with configurable page size (10, 20, 50)
- URL-synced table state (page, perPage)
- Loading skeleton, empty state, and error state

## Data contract
The component receives \`entries\`, \`totalCount\`, \`isLoading\`, and \`error\` from the parent. The parent (e.g. AuditLog page) is responsible for fetching and filtering data.
        `,
      },
    },
  },
  args: {
    entries: mockEntries,
    totalCount: mockEntries.length,
    isLoading: false,
    error: null,
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

// ----------------------------------------------------------------------------
// Stories
// ----------------------------------------------------------------------------

/** Default view with mock audit log entries. */
export const Default: Story = {};

/** Loading state shows table skeleton. */
export const Loading: Story = {
  args: {
    entries: [],
    totalCount: 0,
    isLoading: true,
    error: null,
  },
  play: async ({ canvasElement, step }) => {
    await step('Verify loading', async () => {
      await waitFor(
        async () => {
          expectLoadingVisible(canvasElement);
        },
        { timeout: 10000 },
      );
    });
  },
};

/** Empty state when there are no entries and no error. */
export const Empty: Story = {
  args: {
    entries: [],
    totalCount: 0,
    isLoading: false,
    error: null,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify empty', async () => {
      await expect(canvas.findByText(/no audit log entries found/i)).resolves.toBeInTheDocument();
    });
  },
};

/** Error state when the client provides an error message. */
export const Error: Story = {
  args: {
    entries: [],
    totalCount: 0,
    isLoading: false,
    error: 'Failed to load audit log. Please try again.',
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify error', async () => {
      await expect(canvas.findByText(/failed to load audit log/i)).resolves.toBeInTheDocument();
    });
  },
};

/**
 * Pagination with enough entries to show multiple pages (25 entries, 20 per page).
 * Verifies pagination controls and that changing page updates the visible rows.
 */
export const Pagination: Story = {
  args: {
    entries: mockEntriesPaginated,
    totalCount: mockEntriesPaginated.length,
    isLoading: false,
    error: null,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify pagination', async () => {
      await waitFor(() => {
        expect(canvas.queryByText(PAGINATION_PAGE_1_ENTRY.description)).toBeInTheDocument();
      });

      const nextButtons = canvas.getAllByRole('button', { name: /next/i });
      expect(nextButtons.length).toBeGreaterThan(0);
      await userEvent.click(nextButtons[0]);

      await waitFor(() => {
        expect(canvas.queryByText(PAGINATION_PAGE_2_ENTRY.description)).toBeInTheDocument();
      });
      expect(canvas.queryByText(PAGINATION_PAGE_1_ENTRY.description)).not.toBeInTheDocument();
    });
  },
};
