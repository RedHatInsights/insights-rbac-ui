import { expect, userEvent, waitFor, within } from 'storybook/test';
import { waitForContentReady } from '../../test-utils/interactionHelpers';
import { TEST_TIMEOUTS } from '../../test-utils/testUtils';
import { Story, V1_ROLE_ADMIN, meta, navigateToPage, resetStoryState, v1Db } from './_v1OrgAdminSetup';

export default {
  ...meta,
  title: 'User Journeys/Production/V1 (Current)/Org Admin/My User Access',
  tags: ['prod-org-admin'],
};

/**
 * Navigate to My User Access and verify the RHEL bundle is auto-selected.
 * Org admin sees roles table (not permissions table).
 */
export const ViewMyUserAccessDefaultBundleJourney: Story = {
  name: 'View My User Access with default RHEL bundle',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Navigates to My User Access via sidebar and verifies the default bundle experience for an Org Admin.

**Checks:**
- \\u2705 My User Access page renders with entitle section
- \\u2705 RHEL bundle is selected by default
- \\u2705 Org Admin sees roles table (not permissions table)
- \\u2705 Roles with RHEL applications are displayed
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to My User Access', async () => {
      await navigateToPage(user, canvas, 'My User Access');
    });

    await step('Verify entitle section renders', async () => {
      const entitleSection = await canvas.findByTestId('entitle-section', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      expect(entitleSection).toBeInTheDocument();
    });

    await step('Verify RHEL bundle card is selected by default', async () => {
      const entitleSection = await canvas.findByTestId('entitle-section');
      const sectionContent = within(entitleSection);
      const rhelCard = await sectionContent.findByText('Red Hat Enterprise Linux');
      const cardElement = rhelCard.closest('.pf-v6-c-card');
      expect(cardElement).toHaveClass('pf-m-selected');
    });

    await step('Verify roles table loads for org admin', async () => {
      const rolesTable = await canvas.findByRole('grid', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      expect(rolesTable).toBeInTheDocument();

      // Org admin sees roles — verify seed roles with RHEL-related applications appear
      await waitFor(
        () => {
          expect(canvas.queryByText(V1_ROLE_ADMIN.name)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });
  },
};

/**
 * Switch between bundles and verify the roles table content updates.
 */
export const SwitchBundlesJourney: Story = {
  name: 'Switch bundles and verify roles change',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests bundle switching on My User Access — clicking a different bundle card refreshes the roles table.

**Checks:**
- \\u2705 RHEL roles visible initially
- \\u2705 Clicking Settings bundle card navigates and updates selection
- \\u2705 Settings-related roles appear after switching
- \\u2705 RHEL bundle card is no longer selected
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });
    let beforeSwitchSnapshot = '';

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to My User Access', async () => {
      await navigateToPage(user, canvas, 'My User Access');
    });

    await step('Verify RHEL roles are displayed initially', async () => {
      await canvas.findByTestId('entitle-section', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      const rolesTable = await canvas.findByRole('grid', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      expect(rolesTable).toBeInTheDocument();
      beforeSwitchSnapshot = rolesTable.textContent ?? '';

      await waitFor(
        () => {
          expect(canvas.queryByText(V1_ROLE_ADMIN.name)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Click Settings bundle card', async () => {
      const entitleSection = await canvas.findByTestId('entitle-section');
      const sectionContent = within(entitleSection);
      const settingsCard = await sectionContent.findByText('Settings and User Access');
      const bundleCardLink = settingsCard.closest('[aria-label="card-link"]');
      expect(bundleCardLink).toBeInTheDocument();
      bundleCardLink && (await user.click(bundleCardLink));
    });

    await step('Verify Settings bundle is now selected', async () => {
      await waitFor(
        () => {
          const entitleSection = canvas.queryByTestId('entitle-section');
          if (!entitleSection) throw new Error('entitle-section not found');
          const settingsCard = within(entitleSection).queryByText('Settings and User Access');
          if (!settingsCard) throw new Error('Settings card not found');
          const cardElement = settingsCard.closest('.pf-v6-c-card');
          expect(cardElement).toHaveClass('pf-m-selected');
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Verify RHEL card is no longer selected', async () => {
      const entitleSection = await canvas.findByTestId('entitle-section');
      const sectionContent = within(entitleSection);
      const rhelCard = await sectionContent.findByText('Red Hat Enterprise Linux');
      const cardElement = rhelCard.closest('.pf-v6-c-card');
      expect(cardElement).not.toHaveClass('pf-m-selected');
    });

    await step('Verify Settings roles appear', async () => {
      // Settings bundle filters roles to rbac/sources applications — table content must differ
      const updatedRolesTable = await canvas.findByRole('grid', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await waitFor(
        () => {
          expect(updatedRolesTable.textContent ?? '').not.toEqual(beforeSwitchSnapshot);
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });
  },
};

/**
 * Navigate away from My User Access to Groups, then navigate back.
 */
export const NavigateAwayAndBackJourney: Story = {
  name: 'Navigate to Groups and back to My User Access',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests navigation flow: My User Access -> Groups -> My User Access.
Verifies content re-renders correctly after navigating away and returning.

**Checks:**
- \\u2705 My User Access loads initially
- \\u2705 Navigate to Groups — groups table visible
- \\u2705 Navigate back to My User Access — entitle section and roles re-render
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Verify My User Access is the initial page', async () => {
      await canvas.findByTestId('entitle-section', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });

    await step('Navigate to Groups', async () => {
      await navigateToPage(user, canvas, 'Groups');
      // Verify we left My User Access — entitle-section must be gone before asserting the grid
      await waitFor(
        () => {
          expect(canvas.queryByTestId('entitle-section')).not.toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
      // Now the grid belongs to the Groups page — no ambiguity
      await canvas.findByRole('grid', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
    });

    await step('Navigate back to My User Access', async () => {
      await navigateToPage(user, canvas, 'My User Access');
    });

    await step('Verify My User Access re-renders correctly', async () => {
      const entitleSection = await canvas.findByTestId('entitle-section', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      expect(entitleSection).toBeInTheDocument();

      // Verify roles table loads again
      const rolesTable = await canvas.findByRole('grid', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      expect(rolesTable).toBeInTheDocument();

      await waitFor(
        () => {
          expect(canvas.queryByText(V1_ROLE_ADMIN.name)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });
  },
};

/**
 * Expand a role row to view its permissions in the nested table.
 */
export const ExpandRolePermissionsJourney: Story = {
  name: 'Expand role to view permissions',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Tests the role expansion interaction on My User Access — clicking a role's permission count
expands the row to show a nested permissions table.

**Checks:**
- \\u2705 Roles table renders with permission counts
- \\u2705 Clicking permission count expands the row
- \\u2705 Nested table shows Application, Resource type, Operation columns
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to My User Access', async () => {
      await navigateToPage(user, canvas, 'My User Access');
    });

    await step('Wait for roles table to load', async () => {
      await canvas.findByRole('grid', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      await waitFor(
        () => {
          expect(canvas.queryByText(V1_ROLE_ADMIN.name)).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });

    await step('Click permission count to expand role row', async () => {
      // Administrator role has accessCount of 50 — find that link/button
      const permissionsLink = await canvas.findByText(String(V1_ROLE_ADMIN.accessCount));
      await user.click(permissionsLink);
    });

    await step('Verify expanded row shows permissions table', async () => {
      await waitFor(
        () => {
          // The expanded row contains a nested table with permission detail columns
          const appHeader = canvas.queryByText('Application');
          const resourceHeader = canvas.queryByText('Resource type');
          const operationHeader = canvas.queryByText('Operation');
          expect(appHeader).toBeInTheDocument();
          expect(resourceHeader).toBeInTheDocument();
          expect(operationHeader).toBeInTheDocument();
        },
        { timeout: TEST_TIMEOUTS.ELEMENT_WAIT },
      );
    });
  },
};

/**
 * Verify all entitled bundle cards are visible for org admin.
 */
export const VerifyAllBundleCardsJourney: Story = {
  name: 'Verify all entitled bundle cards visible',
  args: {
    initialRoute: '/iam/my-user-access',
  },
  parameters: {
    docs: {
      description: {
        story: `
Verifies that an Org Admin with full entitlements sees all bundle cards on My User Access.

**Checks:**
- \\u2705 Red Hat Enterprise Linux card visible
- \\u2705 OpenShift card visible
- \\u2705 Ansible Automation Platform card visible
- \\u2705 Settings and User Access card visible
        `,
      },
    },
  },
  play: async ({ canvasElement, step, args }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup({ delay: args.typingDelay ?? 30 });

    await step('Reset state', async () => {
      await resetStoryState(v1Db);
    });

    await step('Wait for content to load', async () => {
      await waitForContentReady(canvasElement);
    });

    await step('Navigate to My User Access', async () => {
      await navigateToPage(user, canvas, 'My User Access');
    });

    await step('Verify all bundle cards are visible', async () => {
      const entitleSection = await canvas.findByTestId('entitle-section', {}, { timeout: TEST_TIMEOUTS.ELEMENT_WAIT });
      const sectionContent = within(entitleSection);

      expect(await sectionContent.findByText('Red Hat Enterprise Linux')).toBeInTheDocument();
      expect(await sectionContent.findByText('OpenShift')).toBeInTheDocument();
      expect(await sectionContent.findByText('Ansible Automation Platform')).toBeInTheDocument();
      expect(await sectionContent.findByText('Settings and User Access')).toBeInTheDocument();
    });
  },
};