import type { StoryObj } from '@storybook/react-vite';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import { createV1MockDb } from '../../v1/data/mocks/db';
import { createV1Handlers } from '../../v1/data/mocks/handlers';
import { defaultV1Seed } from '../../v1/data/mocks/seed';
import { tenantOptInHandlers } from '../../v1/data/mocks/tenant.handlers';
import { auditHandlers } from '../../shared/data/mocks/audit.handlers';
import { auditLogsForPagination, defaultAuditLogs } from '../../shared/data/mocks/audit.fixtures';
import { clearAndType, switchFilterColumn, toggleCheckboxFilterOption, waitForContentReady } from '../../test-utils/interactionHelpers';
import { waitForPageToLoad } from '../../test-utils/tableHelpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';
import { AppEntryWithRouter } from '../_shared/components/AppEntryWithRouter';
import { navigateToPage, resetStoryState } from '../_shared/helpers';
import { ENVIRONMENTS } from '../_shared/environments';

const v1Db = createV1MockDb(defaultV1Seed());
const v1DefaultHandlers = createV1Handlers(v1Db);

const FIRST_AUDIT_ENTRY = defaultAuditLogs[0];
const SECOND_AUDIT_ENTRY = defaultAuditLogs[1];
const FILTERED_AUDIT_ENTRY = defaultAuditLogs[2];
const PAGINATION_PAGE_1_ENTRY = auditLogsForPagination[10];
const PAGINATION_PAGE_2_ENTRY = auditLogsForPagination[20];

const meta = {
  component: AppEntryWithRouter,
  title: 'User Journeys/Production/V1 (Current)/Org Admin/User Access/Audit Log',
  tags: ['prod-org-admin', 'audit-log'],
  args: {
    initialRoute: '/iam/user-access/audit-log',
    typingDelay: typeof process !== 'undefined' && process.env?.CI ? 0 : 30,
    permissions: ['rbac:*:*', 'inventory:groups:read', 'inventory:groups:write'],
    orgAdmin: true,
    userAccessAdministrator: false,
    'platform.rbac.workspaces': false,
  },
  parameters: {
    ...ENVIRONMENTS.PROD_ORG_ADMIN,
    featureFlags: {
      ...ENVIRONMENTS.PROD_ORG_ADMIN.featureFlags,
      'platform.rbac.workspaces': false,
    },
    msw: {
      handlers: [...tenantOptInHandlers({ optedIn: false }), ...auditHandlers(), ...v1DefaultHandlers],
    },
    docs: {
      description: {
        component: 'Verifies the org-admin-only Audit Log page in the V1 User Access experience while the workspaces flag is off.',
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof meta>;

export const TableView: Story = {
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset V1 mock state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for the audit log table to load', async () => {
      await waitForContentReady(canvasElement);
      await expect(canvas.findByRole('heading', { name: /audit log/i })).resolves.toBeInTheDocument();
      await waitForPageToLoad(canvas, FIRST_AUDIT_ENTRY.description!);
    });

    await step('Verify audit log entries', async () => {
      await expect(canvas.findByText(FIRST_AUDIT_ENTRY.description!)).resolves.toBeInTheDocument();
      await expect(canvas.findByText(SECOND_AUDIT_ENTRY.description!)).resolves.toBeInTheDocument();
      await expect(canvas.findByRole('grid')).resolves.toBeInTheDocument();
    });
  },
};

export const NavigateFromSidebar: Story = {
  name: 'Navigate from Sidebar',
  args: {
    initialRoute: '/iam/user-access/groups',
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset V1 mock state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for User Access navigation', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Open Audit Log from the sidebar', async () => {
      await navigateToPage(user, canvas, 'Audit Log');
      await expect(canvas.findByRole('heading', { name: /audit log/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).resolves.toBeInTheDocument();
      await expect(canvas.findByText(FIRST_AUDIT_ENTRY.description!, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT })).resolves.toBeInTheDocument();
    });
  },
};

export const Pagination: Story = {
  parameters: {
    msw: {
      handlers: [...tenantOptInHandlers({ optedIn: false }), ...auditHandlers(auditLogsForPagination), ...v1DefaultHandlers],
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    await step('Reset V1 mock state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Verify first page', async () => {
      await waitForContentReady(canvasElement);
      await expect(canvas.findByText(PAGINATION_PAGE_1_ENTRY.description!)).resolves.toBeInTheDocument();
    });

    await step('Move to the next page', async () => {
      const nextButtons = await canvas.findAllByRole('button', { name: /next/i });
      await user.click(nextButtons[0]);
      await waitFor(() => {
        expect(canvas.queryByText(PAGINATION_PAGE_2_ENTRY.description!)).toBeInTheDocument();
      });
      expect(canvas.queryByText(PAGINATION_PAGE_1_ENTRY.description!)).not.toBeInTheDocument();
    });
  },
};

export const Filtering: Story = {
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset V1 mock state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for audit log entries', async () => {
      await waitForContentReady(canvasElement);
      await expect(canvas.findByText(SECOND_AUDIT_ENTRY.description!)).resolves.toBeInTheDocument();
    });

    await step('Filter by requester', async () => {
      await clearAndType(
        user,
        () => canvas.getByPlaceholderText(/filter by requester/i) as HTMLInputElement,
        FILTERED_AUDIT_ENTRY.principal_username!,
      );
      await waitFor(() => {
        expect(canvas.queryByText(FILTERED_AUDIT_ENTRY.description!)).toBeInTheDocument();
        expect(canvas.queryByText(SECOND_AUDIT_ENTRY.description!)).not.toBeInTheDocument();
      });
    });

    await step('Filter by resource and action', async () => {
      await switchFilterColumn(user, canvas, /^Requester$/i, /^Resource$/i);
      await toggleCheckboxFilterOption(user, canvas, /filter by resource/i, /^Role$/i);
      await switchFilterColumn(user, canvas, /^Resource$/i, /^Action$/i);
      await toggleCheckboxFilterOption(user, canvas, /filter by action/i, /^Create$/i);
      await waitFor(() => {
        expect(canvas.queryByText(FILTERED_AUDIT_ENTRY.description!)).toBeInTheDocument();
        expect(canvas.queryByText(SECOND_AUDIT_ENTRY.description!)).not.toBeInTheDocument();
      });
    });
  },
};
