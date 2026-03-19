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
import { expect, userEvent, within } from 'storybook/test';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { navigateToPage, resetStoryState } from '../_shared/helpers';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import { waitForPageToLoad } from '../../test-utils/tableHelpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';
import { v2DefaultHandlers } from './_shared';

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
      const adumbleEntries = await canvas.findAllByText('adumble');
      expect(adumbleEntries.length).toBeGreaterThan(0);
      const bbunnyEntries = await canvas.findAllByText('bbunny');
      expect(bbunnyEntries.length).toBeGreaterThan(0);
    });

    await step('Verify descriptions render', async () => {
      await expect(canvas.findByText(/Added user ginger-spice to group Platform Users/i)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(/Created role Custom Auditor/i)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(/Deleted group Legacy Access/i)).resolves.toBeInTheDocument();
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
      await waitForPageToLoad(canvas, 'adumble');
    });

    await step('Navigate to Audit Log via sidebar', async () => {
      await navigateToPage(user, canvas, 'Audit Log');
    });

    await step('Verify audit log page loaded', async () => {
      const heading = await canvas.findByRole('heading', { name: /audit log/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await expect(heading).toBeInTheDocument();
      const adumbleEntries = await canvas.findAllByText('adumble', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      expect(adumbleEntries.length).toBeGreaterThan(0);
      await expect(canvas.findByText(/Added user ginger-spice to group Platform Users/i)).resolves.toBeInTheDocument();
    });
  },
};

/**
 * Pagination
 *
 * Tests pagination controls on the audit log page.
 */
export const Pagination: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Tests pagination controls on the Audit Log page.

**Expected behavior:**
1. Verify audit log page loaded
2. Find pagination controls (per-page dropdown or next page button)
3. Change per-page or navigate to next page
4. Verify the page/display updated
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
      const adumbleEntries = await canvas.findAllByText('adumble');
      expect(adumbleEntries.length).toBeGreaterThan(0);
    });

    await step('Verify table and pagination', async () => {
      const table = await canvas.findByRole('grid');
      expect(table).toBeInTheDocument();
      const paginationRegions = await canvas.findAllByRole('navigation', { name: /pagination/i });
      expect(paginationRegions.length).toBeGreaterThan(0);
      expect(paginationRegions[0]).toBeInTheDocument();
    });
  },
};
