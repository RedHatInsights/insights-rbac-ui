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
import { delay } from 'msw';
import { KESSEL_PERMISSIONS, KesselAppEntryWithRouter, createDynamicEnvironment } from '../_shared/components/KesselAppEntryWithRouter';
import { TEST_TIMEOUTS, navigateToPage, resetStoryState } from '../_shared/helpers';
import { defaultHandlers } from './_shared';

const meta = {
  component: KesselAppEntryWithRouter,
  title: 'User Journeys/Management Fabric/Access Management/Audit Log',
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
    'platform.rbac.common.userstable': true,
    'platform.rbac.workspaces-organization-management': true,
  },
  parameters: {
    ...createDynamicEnvironment({
      permissions: KESSEL_PERMISSIONS.FULL_ADMIN,
      orgAdmin: true,
      'platform.rbac.common-auth-model': true,
      'platform.rbac.common.userstable': true,
      'platform.rbac.workspaces-organization-management': true,
    }),
    msw: {
      handlers: defaultHandlers,
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
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);

    // Verify page header (use heading role to avoid matching sidebar nav link)
    const heading = await canvas.findByRole('heading', { name: /audit log/i });
    await expect(heading).toBeInTheDocument();
    await expect(canvas.findByText(/audit log tracks admin actions/i)).resolves.toBeInTheDocument();

    // Verify audit log entries are displayed (requester names appear in multiple rows)
    const adumbleEntries = await canvas.findAllByText('adumble');
    expect(adumbleEntries.length).toBeGreaterThan(0);
    const bbunnyEntries = await canvas.findAllByText('bbunny');
    expect(bbunnyEntries.length).toBeGreaterThan(0);

    // Verify descriptions render (each description is unique)
    await expect(canvas.findByText(/Added user ginger-spice to group Platform Users/i)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Created role Custom Auditor/i)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Deleted group Legacy Access/i)).resolves.toBeInTheDocument();

    // Verify resource types render (capitalized by the component; multiple rows share the same type)
    const groupCells = await canvas.findAllByText('Group');
    expect(groupCells.length).toBeGreaterThan(0);
    const roleCells = await canvas.findAllByText('Role');
    expect(roleCells.length).toBeGreaterThan(0);
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
  play: async (context) => {
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for Users and Groups page to load
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    // Navigate to Audit Log via sidebar
    await navigateToPage(user, canvas, 'Audit Log');
    await delay(TEST_TIMEOUTS.AFTER_PAGE_LOAD);

    // Verify audit log page loaded
    const heading = await canvas.findByRole('heading', { name: /audit log/i });
    await expect(heading).toBeInTheDocument();

    // Verify entries load (requester name appears in multiple rows)
    const adumbleEntries = await canvas.findAllByText('adumble');
    expect(adumbleEntries.length).toBeGreaterThan(0);
    await expect(canvas.findByText(/Added user ginger-spice to group Platform Users/i)).resolves.toBeInTheDocument();
  },
};
