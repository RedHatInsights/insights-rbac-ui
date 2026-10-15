/**
 * Audit Log Journey
 *
 * Features tested:
 * - Audit log table with columns: Date, Requester, Description, Resource, Action
 * - Data loads from API and renders correctly
 * - Page header with title and subtitle
 * - Navigation to audit log via sidebar
 */

import type { StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { navigateToPage, resetStoryState } from '../_shared/helpers';
import { auditHandlers, v2DefaultHandlers } from './_shared';
import { auditLogsForPagination, defaultAuditLogs } from '../../v2/data/mocks/audit.fixtures';
import { clearAndType, switchFilterColumn, toggleCheckboxFilterOption, waitForContentReady } from '../../test-utils/interactionHelpers';
import { waitForPageToLoad } from '../../test-utils/tableHelpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';

const ADUMBLE_GROUP_ADD = defaultAuditLogs[0];
const BBUNNY_ROLE_REMOVE = defaultAuditLogs[1];
const ADUMBLE_ROLE_CREATE = defaultAuditLogs[2];
const ADUMBLE_GROUP_DELETE = defaultAuditLogs[3];
const PAGINATION_PAGE_1_ENTRY = auditLogsForPagination[10];
const PAGINATION_PAGE_2_ENTRY = auditLogsForPagination[20];

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Access Management/Audit Log',
  tags: ['access-management', 'audit-log'],
  decorators: [
    (Story: React.ComponentType, context: { args: Record<string, unknown>; parameters: Record<string, unknown> }) => {
      const dynamicEnv = createDynamicEnvironment(context.args);
      context.parameters = { ...context.parameters, ...dynamicEnv };
      const argsKey = JSON.stringify(context.args);
      return <Story key={argsKey} />;
    },
  ],
  args: {
    initialRoute: '/iam/access-management/audit-log',
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
    orgAdmin: true,
    'platform.rbac.common-auth-model': true,
    'platform.rbac.workspaces': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.workspaces': true,
    }),
    msw: {
      handlers: v2DefaultHandlers,
    },
    docs: {
      description: {
        component: `
# Audit Log Journey

Tests the Audit Log page which displays a read-only table of RBAC audit actions.

## Features
| Feature | Status | API |
|---------|--------|-----|
| Audit log table | ✅ Implemented | V1 |
| Date, Requester, Description, Resource, Action columns | ✅ Implemented | V1 |
| Filtering | ✅ Implemented | V1 |
| Pagination | ✅ Implemented | V1 |
| Page header with title and subtitle | ✅ Implemented | — |
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * Default audit log table view
 *
 * Tests:
 * - Page header renders with correct title
 * - Table loads audit log entries from API
 * - All expected columns are present
 * - Entry data displays correctly
 */
export const TableView: Story = {
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        story: `
Tests the default Audit Log table view.

**Columns verified:**
- Date
- Requester
- Description
- Resource
- Action
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify page header', async () => {
      const heading = await canvas.findByRole('heading', { name: /audit log/i });
      await expect(heading).toBeInTheDocument();
      await expect(canvas.findByText(/audit log tracks admin actions/i)).resolves.toBeInTheDocument();
    });

    await step('Verify audit log entries displayed', async () => {
      const adumbleEntries = await canvas.findAllByText(ADUMBLE_GROUP_ADD.principal_username!);
      expect(adumbleEntries.length).toBeGreaterThan(0);
      const bbunnyEntries = await canvas.findAllByText(BBUNNY_ROLE_REMOVE.principal_username!);
      expect(bbunnyEntries.length).toBeGreaterThan(0);
    });

    await step('Verify descriptions render', async () => {
      await expect(canvas.findByText(ADUMBLE_GROUP_ADD.description!)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(ADUMBLE_ROLE_CREATE.description!)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(ADUMBLE_GROUP_DELETE.description!)).resolves.toBeInTheDocument();
    });

    await step('Verify resource types render', async () => {
      const groupCells = await canvas.findAllByText('Group');
      expect(groupCells.length).toBeGreaterThan(0);
      const roleCells = await canvas.findAllByText('Role');
      expect(roleCells.length).toBeGreaterThan(0);
    });
  },
};

/**
 * Navigate to Audit Log via sidebar
 *
 * Tests:
 * - Start on the Users and Groups page
 * - Click "Audit Log" in the sidebar navigation
 * - Audit log page loads with entries
 */
export const NavigateFromSidebar: Story = {
  name: 'Navigate from Sidebar',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests navigating to the Audit Log page from the sidebar.

**Expected behavior:**
1. Start on the Users and Groups page
2. Click "Audit Log" in the sidebar
3. Audit log table loads with entries
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Wait for Users and Groups page', async () => {
      await waitForPageToLoad(canvas, ADUMBLE_GROUP_ADD.principal_username!);
    });

    await step('Navigate to Audit Log via sidebar', async () => {
      await navigateToPage(user, canvas, 'Audit Log');
    });

    await step('Verify audit log page loaded', async () => {
      const heading = await canvas.findByRole('heading', { name: /audit log/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await expect(heading).toBeInTheDocument();
      const adumbleEntries = await canvas.findAllByText(ADUMBLE_GROUP_ADD.principal_username!, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      expect(adumbleEntries.length).toBeGreaterThan(0);
      await expect(canvas.findByText(ADUMBLE_GROUP_ADD.description!)).resolves.toBeInTheDocument();
    });
  },
};

/**
 * Pagination
 *
 * Tests pagination controls on the audit log page: next page updates visible rows.
 */
export const Pagination: Story = {
  parameters: {
    msw: {
      handlers: [...auditHandlers(auditLogsForPagination), ...v2DefaultHandlers],
    },
    docs: {
      description: {
        story: `
Tests pagination controls on the Audit Log page.

**Expected behavior:**
1. Verify audit log page loaded (25 entries, 20 per page)
2. Verify first page shows "Audit entry 11:" (row on page 1)
3. Click next page
4. Verify second page shows "Audit entry 21:" and page-1 content is no longer visible
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify audit log page loaded', async () => {
      await expect(canvas.findByRole('heading', { name: /audit log/i })).resolves.toBeInTheDocument();
      const table = await canvas.findByRole('grid');
      expect(table).toBeInTheDocument();
    });

    await step('Verify pagination: first page then next page', async () => {
      await waitFor(() => {
        expect(canvas.queryByText(PAGINATION_PAGE_1_ENTRY.description!)).toBeInTheDocument();
      });

      const nextButtons = canvas.getAllByRole('button', { name: /next/i });
      expect(nextButtons.length).toBeGreaterThan(0);
      await userEvent.click(nextButtons[0]);

      await waitFor(() => {
        expect(canvas.queryByText(PAGINATION_PAGE_2_ENTRY.description!)).toBeInTheDocument();
      });
      expect(canvas.queryByText(PAGINATION_PAGE_1_ENTRY.description!)).not.toBeInTheDocument();
    });
  },
};

/**
 * Filtering
 *
 * Tests that the audit log table filters correctly by Requester (text),
 * Resource (checkbox), and Action (checkbox), and that Clear all filters restores data.
 */
export const FilterByRequesterResourceAndAction: Story = {
  name: 'Filtering',
  parameters: {
    docs: {
      description: {
        story: `
Tests filtering on the Audit Log page.

**Expected behavior:**
1. Filter by Requester "adumble" → only adumble rows (e.g. "Created role Custom Auditor"); bbunny row not visible
2. Add Resource "Group" → only Group rows (e.g. "Deleted group Legacy Access")
3. Add Action "Create" → no results (no entry is adumble + Group + Create); empty state with "Clear all filters"
4. Click "Clear all filters" → table shows data again
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState();
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify audit log page loaded', async () => {
      await expect(canvas.findByRole('heading', { name: /audit log/i })).resolves.toBeInTheDocument();
      await waitFor(
        () => {
          expect(canvas.queryByText(BBUNNY_ROLE_REMOVE.description!)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Filter by Requester "adumble"', async () => {
      await clearAndType(
        user,
        () => canvas.getByPlaceholderText(/filter by requester/i) as HTMLInputElement,
        ADUMBLE_ROLE_CREATE.principal_username!,
      );

      await waitFor(() => {
        expect(canvas.queryByText(ADUMBLE_ROLE_CREATE.description!)).toBeInTheDocument();
        expect(canvas.queryByText(BBUNNY_ROLE_REMOVE.description!)).not.toBeInTheDocument();
      });
    });

    await step('Add Resource filter "Group"', async () => {
      await switchFilterColumn(user, canvas, /^Requester$/i, /^Resource$/i);
      await toggleCheckboxFilterOption(user, canvas, /filter by resource/i, /^Group$/i);

      await waitFor(() => {
        expect(canvas.queryByText(ADUMBLE_GROUP_DELETE.description!)).toBeInTheDocument();
        expect(canvas.queryByText(ADUMBLE_GROUP_ADD.description!)).toBeInTheDocument();
        expect(canvas.queryByText(ADUMBLE_ROLE_CREATE.description!)).not.toBeInTheDocument();
      });
    });

    await step('Add Action filter "Create" → no results', async () => {
      await switchFilterColumn(user, canvas, /^Resource$/i, /^Action$/i);
      await toggleCheckboxFilterOption(user, canvas, /filter by action/i, /^Create$/i);

      await waitFor(() => {
        expect(canvas.queryByRole('button', { name: /clear all filters/i })).toBeInTheDocument();
        expect(canvas.queryByText(ADUMBLE_GROUP_DELETE.description!)).not.toBeInTheDocument();
        expect(canvas.queryByText(ADUMBLE_GROUP_ADD.description!)).not.toBeInTheDocument();
        expect(canvas.queryByText(/No audit log entries found/i)).toBeInTheDocument();
      });
    });

    await step('Clear all filters and verify data restored', async () => {
      await user.click(canvas.getByRole('button', { name: /clear all filters/i }));

      await waitFor(() => {
        expect(canvas.queryByText(ADUMBLE_ROLE_CREATE.description!)).toBeInTheDocument();
        expect(canvas.queryByText(BBUNNY_ROLE_REMOVE.description!)).toBeInTheDocument();
      });
    });
  },
};
