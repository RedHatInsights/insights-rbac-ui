import { expect, userEvent, within } from 'storybook/test';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import { tenantOptInHandlers } from '../../v1/data/mocks/tenant.handlers';
import { Story, TEST_TIMEOUTS, WS_ROOT, db, meta, mswHandlers, navigateToPage, resetStoryState } from './_v2OrgAdminSetup';

export default { ...meta, title: 'User Journeys/Production/V2 (Management Fabric)/Org Admin/Navigation', tags: ['prod-v2-org-admin'] };

export const SidebarValidation: Story = {
  name: 'All V2 admin items visible',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Validates that V2 Org Admin sees all sidebar items.

V2 navigation (when \`platform.rbac.workspaces\` is enabled):
- **My Access** — top-level link
- **Access Management** — expandable section containing:
  - Users and Groups
  - Roles
  - Workspaces
- **Organization Management** — expandable section (org admin only)

**Checks:**
- ✅ "My Access" link IS present (V2 label)
- ✅ "Access Management" expandable section IS present
- ✅ "Users and Groups" link IS present (inside Access Management)
- ✅ "Roles" link IS present (inside Access Management)
- ✅ "Workspaces" link IS present (inside Access Management)
- ✅ "Organization Management" expandable IS present (org admin only)
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify sidebar items visible', async () => {
      const myAccess = await canvas.findByRole('link', { name: /my access/i });
      expect(myAccess).toBeInTheDocument();

      const accessMgmtSection = await canvas.findByRole('button', { name: /access management/i });
      expect(accessMgmtSection).toBeInTheDocument();

      const usersLink = await canvas.findByRole('link', { name: /users and groups/i });
      expect(usersLink).toBeInTheDocument();

      const rolesLink = await canvas.findByRole('link', { name: /^roles$/i });
      expect(rolesLink).toBeInTheDocument();

      const workspacesLink = await canvas.findByRole('link', { name: /^workspaces$/i });
      expect(workspacesLink).toBeInTheDocument();

      const orgMgmtSection = await canvas.findByRole('button', { name: /organization management/i });
      expect(orgMgmtSection).toBeInTheDocument();
    });
  },
};

/**
 * Navigate the V2 sidebar
 */
export const NavigateV2Sidebar: Story = {
  name: 'Navigate V2 Sidebar',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests navigation through all V2 sidebar items visible to an Org Admin.

**Access Management section:**
- Users and Groups → /iam/access-management/users-and-user-groups
- Roles → /iam/access-management/roles
- Workspaces → /iam/access-management/workspaces
- Audit Log → /iam/access-management/audit-log

**Organization Management section** (Org Admin only):
- Organization-Wide Access → /iam/organization-management/organization-wide-access
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to Users and Groups', async () => {
      await navigateToPage(user, canvas, 'Users and Groups');
      await canvas.findByRole('heading', { name: /users and (user )?groups/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });

    await step('Navigate to Roles', async () => {
      await navigateToPage(user, canvas, 'Roles');
      await canvas.findByRole('heading', { name: /^roles$/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });

    await step('Navigate to Workspaces', async () => {
      await navigateToPage(user, canvas, 'Workspaces');
      await canvas.findByText(WS_ROOT.name, {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });

    await step('Navigate to Audit Log', async () => {
      await navigateToPage(user, canvas, 'Audit Log');
      await canvas.findByRole('heading', { name: /audit log/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });

    await step('Navigate to Organization-Wide Access', async () => {
      await navigateToPage(user, canvas, 'Organization-Wide Access');
      await canvas.findByRole('heading', { name: /organization-wide access/i }, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });
  },
};

/**
 * Conversion and the feature flag are independent: conversion is per-tenant and irreversible,
 * the flag is rolled out per environment. frontend.yaml gates the sidebar on
 * `isKesselOrgOnboarded`, which is the OR of the two, so a converted tenant has to get V2
 * navigation with `platform.rbac.workspaces` off.
 */
export const ConvertedTenantSeesV2Nav: Story = {
  name: 'Converted tenant sees V2 nav with the flag off',
  args: {
    initialRoute: '/iam/access-management/users-and-user-groups',
    'platform.rbac.workspaces': false,
    tenantOptedIn: true,
  },
  parameters: {
    // The sidebar reads `tenantOptedIn`; the app shell reads this endpoint. Both have to say
    // "converted" or the story renders V2 pages under V1 navigation.
    msw: { handlers: [...tenantOptInHandlers({ optedIn: true }), ...mswHandlers] },
    docs: {
      description: {
        story: `
Validates the opt-in half of \`isKesselOrgOnboarded\`, which the feature flag alone cannot cover.

**Setup:** \`platform.rbac.workspaces\` is **off**, and \`GET /api/rbac/v1/tenant/opt-in/\`
reports the tenant as converted.

**Checks:**
- ✅ V2 items ("Access Management", "Users and Groups", "Workspaces") ARE present
- ✅ No V1 \`/iam/user-access/*\` link is rendered
- ✅ "Roles" resolves to exactly one link, and it points at the V2 path
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Reset state', async () => {
      await resetStoryState(db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Converted tenant gets the V2 sidebar', async () => {
      expect(await canvas.findByRole('button', { name: /access management/i })).toBeInTheDocument();
      expect(await canvas.findByRole('link', { name: /users and groups/i })).toBeInTheDocument();
      expect(await canvas.findByRole('link', { name: /^workspaces$/i })).toBeInTheDocument();
    });

    await step('No V1 navigation is left alongside it', async () => {
      // Gating that fails open renders both variants of every entry, which shows up first as
      // duplicate links rather than as a missing one.
      const v1Links = canvas.queryAllByRole('link').filter((link) => link.getAttribute('href')?.startsWith('/iam/user-access'));
      expect(v1Links).toHaveLength(0);

      const rolesLinks = canvas.getAllByRole('link', { name: /^roles$/i });
      expect(rolesLinks).toHaveLength(1);
      expect(rolesLinks[0]).toHaveAttribute('href', '/iam/access-management/roles');
    });
  },
};
