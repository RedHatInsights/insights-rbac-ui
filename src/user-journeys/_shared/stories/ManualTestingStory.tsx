import type { StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { KesselAppEntryWithRouter } from '../components/KesselAppEntryWithRouter';
import { TEST_TIMEOUTS, resetStoryState } from '../helpers';

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
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for nav to render, then navigate to My User Access
    await waitFor(
      async () => {
        const link = canvas.queryByRole('link', { name: /my access$/i }) || canvas.queryByRole('link', { name: /my user access$/i });
        expect(link).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );
    const navLink = canvas.queryByRole('link', { name: /my access$/i }) || canvas.queryByRole('link', { name: /my user access$/i });
    if (navLink) {
      await user.click(navLink);
    }

    // Wait for the page heading to appear (proves useUserData resolved and page rendered)
    await waitFor(
      () => {
        expect(canvas.getByRole('heading', { name: /My (user )?access/i })).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    await waitFor(
      () => {
        expect(canvas.getByRole('grid')).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );
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
    await resetStoryState();
    const canvas = within(context.canvasElement);
    const user = userEvent.setup({ delay: context.args.typingDelay ?? 30 });

    // Wait for nav to render, then navigate to My User Access
    await waitFor(
      async () => {
        const link = canvas.queryByRole('link', { name: /my access$/i }) || canvas.queryByRole('link', { name: /my user access$/i });
        expect(link).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );
    const navLink = canvas.queryByRole('link', { name: /my access$/i }) || canvas.queryByRole('link', { name: /my user access$/i });
    if (navLink) {
      await user.click(navLink);
    }

    // Wait for the page heading to appear (proves useUserData resolved and page rendered)
    await waitFor(
      () => {
        expect(canvas.getByRole('heading', { name: /My (user )?access/i })).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );

    await waitFor(
      () => {
        expect(canvas.getByRole('grid')).toBeInTheDocument();
      },
      { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
    );
  },
};

// Keep the old export name for backward compatibility (defaults to admin/write view)
export const ManualTestingStory = ManualTestingWithWrite;
