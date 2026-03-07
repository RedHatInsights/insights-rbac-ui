import { expect, userEvent, within } from 'storybook/test';
import { delay } from 'msw';
import { Story, TEST_TIMEOUTS, WS_ROOT, db, meta, navigateToPage, resetStoryState } from './_v2OrgAdminSetup';

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

V2 navigation (when \`platform.rbac.workspaces-organization-management\` is enabled):
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
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // ✅ My Access should be visible (V2 uses "My Access" label)
    const myAccess = await canvas.findByRole('link', { name: /my access/i });
    expect(myAccess).toBeInTheDocument();

    // ✅ Access Management expandable should be visible (V2 navigation)
    const accessMgmtSection = await canvas.findByRole('button', { name: /access management/i });
    expect(accessMgmtSection).toBeInTheDocument();

    // ✅ Links inside Access Management expandable
    const usersLink = await canvas.findByRole('link', { name: /users and groups/i });
    expect(usersLink).toBeInTheDocument();

    const rolesLink = await canvas.findByRole('link', { name: /^roles$/i });
    expect(rolesLink).toBeInTheDocument();

    const workspacesLink = await canvas.findByRole('link', { name: /^workspaces$/i });
    expect(workspacesLink).toBeInTheDocument();

    // ✅ Organization Management expandable should be visible for org admins
    const orgMgmtSection = await canvas.findByRole('button', { name: /organization management/i });
    expect(orgMgmtSection).toBeInTheDocument();
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
  play: async (context) => {
    await resetStoryState(db);
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    await delay(TEST_TIMEOUTS.AFTER_EXPAND);

    // Access Management — Users and Groups
    await navigateToPage(user, canvas, 'Users and Groups');
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
    await canvas.findByRole('heading', { name: /users and (user )?groups/i });

    // Access Management — Roles
    await navigateToPage(user, canvas, 'Roles');
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
    await canvas.findByRole('heading', { name: /^roles$/i });

    // Access Management — Workspaces
    await navigateToPage(user, canvas, 'Workspaces');
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
    await canvas.findByText(WS_ROOT.name);

    // Access Management — Audit Log
    await navigateToPage(user, canvas, 'Audit Log');
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
    await canvas.findByRole('heading', { name: /audit log/i });

    // Organization Management — Organization-Wide Access
    await navigateToPage(user, canvas, 'Organization-Wide Access');
    await delay(TEST_TIMEOUTS.AFTER_EXPAND);
    await canvas.findByRole('heading', { name: /organization-wide access/i });
  },
};
