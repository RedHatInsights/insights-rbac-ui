import type { StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import { navigateToPage } from '../helpers/navigationHelpers';
import type { KesselAppEntryWithRouter } from '../components/KesselAppEntryWithRouter';

/**
 * Shared Manual Testing Stories
 *
 * These stories are imported and re-exported by milestone stories to provide
 * consistent manual testing entry points with automated verification.
 *
 * Two variants:
 * - WithWrite: For admin/write permission scenarios (checks roles data)
 * - ReadOnly: For read-only permission scenarios (checks permissions data)
 */

const sharedDocumentation = `
## Manual Testing Entry Point

This story provides an entry point for manual testing and exploration of the RBAC UI.

### Environment Configuration

This environment is pre-configured with:
- Feature flags appropriate for this milestone
- Chrome API mock with correct permissions  
- MSW handlers for API mocking
- Mock data for workspaces, groups, roles, and users

### What to Test

**My User Access Page:**
- Navigate to "My User Access" using the left navigation
- Switch between different bundle cards (RHEL, Ansible, OpenShift)
- Verify roles/permissions are displayed for each bundle
- Check that data is accurate and loads correctly

**Workspaces Management:**
- Navigate to "Workspaces" using the left navigation (if available in this milestone)
- Expand/collapse workspace tree nodes
- Test workspace actions (Create, Edit, Move, Delete) based on permissions
- Verify workspace detail pages and tabs

**Interactive Features:**
- Use the **Controls panel** at the bottom to toggle feature flags and permissions
- The story will automatically remount with new settings when controls change
- Test different configurations dynamically

### Tips

- Open browser DevTools to see network requests and MSW handler logs
- Use the Controls panel to experiment with different permissions
- Check console for any errors or warnings
`;

// Admin/Write Permission story - checks for roles data
export const ManualTestingWithWrite: StoryObj<typeof KesselAppEntryWithRouter> = {
  name: 'Manual Testing - With Write Permission',
  tags: ['autodocs'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story:
          sharedDocumentation +
          `
### Automated Checks (With Write Permission)

This story includes automated verification for admin users:
- ✅ My User Access page loads successfully
- ✅ Roles table is displayed with data
- ✅ Specific roles like "Workspace Administrator" are present
- ✅ Navigation works correctly
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Verify we're on My User Access page
    await navigateToPage(user, canvas, 'My User Access');

    // Scope queries to main content area (not navigation)
    const mainElement = document.querySelector('main') || context.canvasElement;
    const mainContent = within(mainElement as HTMLElement);

    // Verify the page loaded - look for the unique subtitle text
    const subtitle = await mainContent.findByText(/select applications to view your personal/i);
    expect(subtitle).toBeInTheDocument();

    // Verify the table is present with actual data
    const table = await mainContent.findByRole('grid');
    expect(table).toBeInTheDocument();

    // Verify table has roles data (admin view)
    const tableContent = within(table);

    // Check for "Workspace Administrator" role (specific to admin view)
    const workspaceAdminRole = await tableContent.findByText(/workspace administrator/i);
    expect(workspaceAdminRole).toBeInTheDocument();

    // Verify at least one role row exists
    const tbody = tableContent.getAllByRole('rowgroup').find((rg) => rg.tagName === 'TBODY');
    expect(tbody).toBeInTheDocument();
    const dataRows = within(tbody!).getAllByRole('row');
    expect(dataRows.length).toBeGreaterThan(0);
  },
};

// Read-Only story - checks for permissions data
export const ManualTestingReadOnly: StoryObj<typeof KesselAppEntryWithRouter> = {
  name: 'Manual Testing - Read Only',
  tags: ['autodocs'],
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story:
          sharedDocumentation +
          `
### Automated Checks (Read Only)

This story includes automated verification for read-only users:
- ✅ My User Access page loads successfully
- ✅ Permissions table is displayed with data
- ✅ Specific permissions like "rbac:group:read" are present
- ✅ Navigation works correctly
        `,
      },
    },
  },
  play: async (context) => {
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Verify we're on My User Access page
    await navigateToPage(user, canvas, 'My User Access');

    // Scope queries to main content area (not navigation)
    const mainElement = document.querySelector('main') || context.canvasElement;
    const mainContent = within(mainElement as HTMLElement);

    // Verify the page loaded - look for the unique subtitle text
    const subtitle = await mainContent.findByText(/select applications to view your personal/i);
    expect(subtitle).toBeInTheDocument();

    // Verify the table is present with actual data
    const table = await mainContent.findByRole('grid');
    expect(table).toBeInTheDocument();

    // Verify table has permissions data (read-only view)
    const tableContent = within(table);

    // Check for specific permission entries (read-only view shows app:resource:operation)
    const rbacCells = tableContent.getAllByText('rbac');
    expect(rbacCells.length).toBeGreaterThanOrEqual(1);

    const groupCell = tableContent.getByText('group');
    expect(groupCell).toBeInTheDocument();

    const roleCell = tableContent.getByText('role');
    expect(roleCell).toBeInTheDocument();

    // Verify at least one permission row exists
    const tbody = tableContent.getAllByRole('rowgroup').find((rg) => rg.tagName === 'TBODY');
    expect(tbody).toBeInTheDocument();
    const dataRows = within(tbody!).getAllByRole('row');
    expect(dataRows.length).toBeGreaterThan(0);
  },
};

// Keep the old export name for backward compatibility (defaults to admin/write view)
export const ManualTestingStory = ManualTestingWithWrite;
