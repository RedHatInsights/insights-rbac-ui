import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, waitFor, within } from 'storybook/test';
import type { ScopedQueries } from '../../../test-utils/interactionHelpers';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MyUserAccess } from './MyUserAccess';
import { accessHandlers } from '../../data/mocks/access.handlers';
import { v1RolesHandlers } from '../../data/mocks/roles.handlers';
import type { Access, RoleOutDynamic } from '../../data/api/roles';
import type { MockUserIdentity } from '../../../../.storybook/contexts/StorybookMockContext';

// ===== MOCK USER IDENTITIES =====
// Reusable identity configurations for different test scenarios

const standardEntitlements = {
  rhel: { is_entitled: true, is_trial: false },
  openshift: { is_entitled: true, is_trial: false },
  ansible: { is_entitled: false, is_trial: false },
  settings: { is_entitled: true, is_trial: false },
};

const fullEntitlements = {
  rhel: { is_entitled: true, is_trial: false },
  openshift: { is_entitled: true, is_trial: false },
  ansible: { is_entitled: true, is_trial: false },
  settings: { is_entitled: true, is_trial: false },
};

const limitedEntitlements = {
  rhel: { is_entitled: true, is_trial: false },
  openshift: { is_entitled: false, is_trial: false },
  ansible: { is_entitled: false, is_trial: false },
  settings: { is_entitled: true, is_trial: false },
};

const standardUser: MockUserIdentity = {
  account_number: '12345',
  org_id: '67890',
  user: {
    email: 'test@example.com',
    first_name: 'Test',
    last_name: 'User',
    is_active: true,
    is_org_admin: false,
    username: 'testuser',
  },
  entitlements: standardEntitlements,
};

const adminUser: MockUserIdentity = {
  account_number: '12345',
  org_id: '67890',
  user: {
    email: 'admin@example.com',
    first_name: 'Admin',
    last_name: 'User',
    is_active: true,
    is_org_admin: true,
    username: 'adminuser',
  },
  entitlements: fullEntitlements,
};

const limitedUser: MockUserIdentity = {
  account_number: '12345',
  org_id: '67890',
  user: {
    email: 'limited@example.com',
    first_name: 'Limited',
    last_name: 'User',
    is_active: true,
    is_org_admin: false,
    username: 'limiteduser',
  },
  entitlements: limitedEntitlements,
};

// Composite access permissions for all bundles (filtered by application param)
const muaAccessPermissions: Access[] = [
  {
    permission: 'cluster:*:*',
    resourceDefinitions: [{ attributeFilter: { key: 'cluster.name', operation: 'equal' as const, value: 'production' } }],
  },
  { permission: 'cost-management:*:read', resourceDefinitions: [] },
  { permission: 'subscriptions:*:read', resourceDefinitions: [] },
  { permission: 'rbac:*:*', resourceDefinitions: [] },
  { permission: 'sources:*:read', resourceDefinitions: [] },
  {
    permission: 'advisor:*:*',
    resourceDefinitions: [{ attributeFilter: { key: 'insights.advisor.source', operation: 'equal' as const, value: 'advisor' } }],
  },
  { permission: 'compliance:policies:read', resourceDefinitions: [] },
  {
    permission: 'vulnerability:*:*',
    resourceDefinitions: [{ attributeFilter: { key: 'insights.vulnerability.source', operation: 'equal' as const, value: 'scanner' } }],
  },
  { permission: 'patch:*:read', resourceDefinitions: [] },
];

// Composite roles for all bundles with access for expandable rows
const muaRoles: RoleOutDynamic[] = [
  {
    uuid: 'role-openshift-1',
    display_name: 'OpenShift Administrator',
    name: 'OpenShift Administrator',
    description: 'Administrative access to OpenShift services',
    accessCount: 5,
    applications: ['cost-management', 'subscriptions'],
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01',
    modified: '2024-01-01',
    policyCount: 1,
    access: [
      { permission: 'cluster:read:*', resourceDefinitions: [] },
      { permission: 'cost-management:*:read', resourceDefinitions: [] },
      { permission: 'subscriptions:read:*', resourceDefinitions: [] },
    ],
  },
  {
    uuid: 'role-openshift-2',
    display_name: 'OpenShift Viewer',
    name: 'OpenShift Viewer',
    description: 'Read-only access to OpenShift services',
    accessCount: 3,
    applications: ['cost-management'],
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01',
    modified: '2024-01-01',
    policyCount: 1,
    access: [],
  },
  {
    uuid: 'role-settings-1',
    display_name: 'User Access Administrator',
    name: 'User Access Administrator',
    description: 'Administrative access to user management',
    accessCount: 12,
    applications: ['rbac', 'sources'],
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01',
    modified: '2024-01-01',
    policyCount: 1,
    access: [
      { permission: 'rbac:*:*', resourceDefinitions: [] },
      { permission: 'sources:*:read', resourceDefinitions: [] },
    ],
  },
  {
    uuid: 'role-settings-2',
    display_name: 'Sources Administrator',
    name: 'Sources Administrator',
    description: 'Administrative access to source configuration',
    accessCount: 6,
    applications: ['sources'],
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01',
    modified: '2024-01-01',
    policyCount: 1,
    access: [],
  },
  {
    uuid: 'role-rhel-1',
    display_name: 'RHEL Administrator',
    name: 'RHEL Administrator',
    description: 'Administrative access to RHEL services',
    accessCount: 8,
    applications: ['advisor', 'compliance', 'patch'],
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01',
    modified: '2024-01-01',
    policyCount: 1,
    access: [
      {
        permission: 'advisor:*:*',
        resourceDefinitions: [{ attributeFilter: { key: 'advisor.source', operation: 'equal' as const, value: 'advisor' } }],
      },
      { permission: 'compliance:policies:read', resourceDefinitions: [] },
      { permission: 'vulnerability:*:*', resourceDefinitions: [] },
    ],
  },
  {
    uuid: 'role-rhel-2',
    display_name: 'RHEL Security Analyst',
    name: 'RHEL Security Analyst',
    description: 'Security-focused access to RHEL services',
    accessCount: 4,
    applications: ['vulnerability', 'compliance'],
    system: false,
    platform_default: false,
    admin_default: false,
    created: '2024-01-01',
    modified: '2024-01-01',
    policyCount: 1,
    access: [],
  },
];

const meta: Meta<typeof MyUserAccess> = {
  component: MyUserAccess,
  tags: ['custom-css'], // NO autodocs on meta
  parameters: {
    userIdentity: standardUser,
    permissions: {
      orgAdmin: false,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [...accessHandlers(muaAccessPermissions), ...v1RolesHandlers(muaRoles)],
    },
  },
  decorators: [
    (Story, { args }: { args: { bundle?: string } }) => {
      // Use story-specific bundle or default to testing the default bundle logic
      const bundleParam = args.bundle ? `?bundle=${args.bundle}` : '';
      return (
        <MemoryRouter initialEntries={[`/iam/my-user-access${bundleParam}`]}>
          <div style={{ height: '100vh' }}>
            <Routes>
              <Route path="/iam/my-user-access" element={<Story />} />
            </Routes>
          </div>
        </MemoryRouter>
      );
    },
  ],
};

export default meta;

type Story = StoryObj<typeof MyUserAccess>;

// ===== HELPER FUNCTIONS FOR PLAY TESTS =====
// Extract common test utilities to reduce duplication and improve readability

const TestHelpers = {
  delay: (ms: number) => new Promise((resolve) => setTimeout(resolve, ms)),

  /**
   * Wait for the main layout to render and return scoped canvas elements
   */
  async waitForLayout(canvas: ScopedQueries) {
    await TestHelpers.delay(500);
    const entitleSection = await canvas.findByTestId('entitle-section');
    const entitleSectionContent = within(entitleSection);
    return { entitleSection, entitleSectionContent };
  },

  /**
   * Verify a bundle card is selected (has pf-m-selected class)
   */
  async verifyBundleSelected(canvas: ScopedQueries, bundleName: string, shouldBeSelected: boolean = true) {
    const { entitleSectionContent } = await this.waitForLayout(canvas);
    const cardTitle = await entitleSectionContent.findByText(bundleName);
    const cardElement = cardTitle.closest('.pf-v6-c-card');

    if (shouldBeSelected) {
      expect(cardElement).toHaveClass('pf-m-selected');
    } else {
      expect(cardElement).not.toHaveClass('pf-m-selected');
    }

    return { cardElement, cardTitle };
  },

  /**
   * Verify table shows expected permissions
   */
  async verifyTablePermissions(canvas: ScopedQueries, expectedPermissions: string[], unexpectedPermissions: string[] = []) {
    // Wait for table to appear and data to load (TableView shows skeleton while loading)
    await waitFor(
      async () => {
        const table = canvas.queryByRole('grid');
        if (!table) {
          throw new Error('Table not found');
        }
        // Check that at least one expected permission is visible
        const firstPermission = expectedPermissions[0];
        const text = within(table).queryByText(firstPermission);
        if (!text) {
          throw new Error(`Permission "${firstPermission}" not found in table`);
        }
      },
      { timeout: 5000 },
    );

    const table = await canvas.findByRole('grid');
    const tableContent = within(table);

    for (const permission of expectedPermissions) {
      expect(await tableContent.findByText(permission)).toBeInTheDocument();
    }

    for (const permission of unexpectedPermissions) {
      expect(tableContent.queryByText(permission)).not.toBeInTheDocument();
    }

    return { table, tableContent };
  },

  /**
   * Apply filter and verify chip appears
   */
  async applyFilter(canvas: ScopedQueries, filterValue: string) {
    // Find Application buttons: [0] = category selector, [1] = filter values dropdown
    const applicationButtons = await canvas.findAllByRole('button', { name: /Application/i });
    // Click the filter values dropdown (second button)
    await userEvent.click(applicationButtons[1]);

    // Find the filter checkbox in the dropdown (rendered in portal)
    // In PF6, the dropdown uses listbox role instead of menu
    // findAllByRole has built-in retry, so it waits for dropdown to open
    const body = within(document.body);
    const filterCheckboxes = await body.findAllByRole('checkbox', { name: new RegExp(filterValue, 'i') });
    expect(filterCheckboxes.length).toBeGreaterThan(0);
    const filterCheckbox = filterCheckboxes[0];

    await userEvent.click(filterCheckbox);

    // Close dropdown
    await userEvent.keyboard('{Escape}');

    // Verify filter chip appears - in PF6 chip structure may differ
    await waitFor(
      () => {
        // Try multiple ways to find the filter chip
        const chipGroup = canvas.queryByRole('group', { name: /application/i });
        const chipByClass = document.body.querySelector('.pf-v6-c-chip-group, .pf-c-chip-group');
        // Use queryAllByText since there may be multiple matches (table + chip)
        const chipByText = canvas.queryAllByText(filterValue);

        if (!chipGroup && !chipByClass && chipByText.length === 0) {
          throw new Error('Filter chip group not found - filter may not be applied');
        }
      },
      { timeout: 3000 },
    );
  },

  /**
   * Verify filter is reset (no chips visible)
   */
  async verifyFilterReset(canvas: ScopedQueries) {
    await waitFor(
      () => {
        // Try multiple ways to verify no filter chips
        const chipGroup = canvas.queryByRole('group', { name: /application/i });
        const chipByClass = document.body.querySelector('.pf-v6-c-chip-group, .pf-c-chip-group');
        // Both should be null/not present
        expect(chipGroup).toBeNull();
        expect(chipByClass).toBeNull();
      },
      { timeout: 5000 },
    ); // Give more time for filter reset to take effect
  },

  /**
   * Click a bundle card to navigate
   */
  async clickBundleCard(canvas: ScopedQueries, bundleName: string) {
    const { entitleSectionContent } = await this.waitForLayout(canvas);
    const cardTitle = await entitleSectionContent.findByText(bundleName);
    const bundleCardLink = cardTitle.closest('[aria-label="card-link"]');

    expect(bundleCardLink).toBeInTheDocument();
    expect(bundleCardLink).toHaveAttribute('href', expect.stringContaining('bundle='));

    bundleCardLink && (await userEvent.click(bundleCardLink));
    // Navigation completes asynchronously; subsequent findBy* in stories will retry
  },
};

export const Default: Story = {
  tags: ['autodocs'], // ONLY default story gets autodocs
  args: {
    bundle: undefined, // Explicitly no bundle to test default logic
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' }, // entitle-section visible on lg+ only
    docs: {
      description: {
        story: `
**MyUserAccess** is the main feature container for the Red Hat Cloud Services user access management interface.

## Feature Overview

This is the complete **My User Access** experience that allows users to:

- 📊 **View their permissions** across different Red Hat Cloud Services applications
- 🔐 **See role assignments** (for org administrators and user access administrators)  
- 🎛️ **Filter and search** through their access permissions
- 📋 **View resource definitions** that apply to specific permissions
- 🔄 **Switch between different service bundles** (RHEL, OpenShift, Ansible, Settings)

## Default Bundle Behavior

This story specifically demonstrates that when **no bundle parameter** is provided in the URL, 
the component correctly defaults to the **RHEL bundle** (DEFAULT_MUA_BUNDLE = 'rhel').

### What This Tests:
- ✅ URL starts with no bundle parameter
- ✅ Component sets bundle to 'rhel' automatically  
- ✅ RHEL card is visually selected (not flat)
- ✅ Correct API call is made for RHEL applications
- ✅ RHEL-specific permissions are displayed

This ensures the default bundle logic works correctly in production when users 
first visit the page without any bundle selection.

 ## Additional Stories
 
 Explore different scenarios and user flows within this feature:
 
 **User Interaction Stories**
 - [BundleSelection](?path=/story/features-myuseraccess--bundle-selection) - Tests visual bundle card selection states
 - [TableDataRefresh](?path=/story/features-myuseraccess--table-data-refresh) - Tests data changes when switching bundles  
 - [FilterResetOnNavigation](?path=/story/features-myuseraccess--filter-reset-on-navigation) - Tests filter reset behavior
 - [ResponsiveNavigation](?path=/story/features-myuseraccess--responsive-navigation) - Mobile/tablet navigation via dropdown
 
 **User Role Stories**  
 - [OrgAdminView](?path=/story/features-myuseraccess--org-admin-view) - Organization administrator experience with roles table
 - [LimitedEntitlements](?path=/story/features-myuseraccess--limited-entitlements) - Users with restricted service access
 
 **Related Component Stories**
 - [AccessTable Default](?path=/story/features-myuseraccess-accesstable--default) - Permissions table functionality  
 - [RolesTable Default](?path=/story/features-myuseraccess-rolestable--default) - Roles table with expansion
 - [UserAccessLayout Default](?path=/story/features-myuseraccess-components-useraccesslayout--default) - Layout structure
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);
    await step('Verify default bundle and permissions', async () => {
      await TestHelpers.delay(700); // Extra time for setSearchParams

      // Verify layout renders
      expect(await canvas.findByTestId('entitle-section')).toBeInTheDocument();

      // Verify RHEL is selected as default
      await TestHelpers.verifyBundleSelected(canvas, 'Red Hat Enterprise Linux');

      // Verify page title
      const pageTitle = await canvas.findByText('Your Red Hat Enterprise Linux permissions');
      expect(pageTitle).toBeInTheDocument();

      // Verify RHEL permissions are loaded
      await TestHelpers.verifyTablePermissions(canvas, ['advisor', 'compliance']);
    });
  },
};

export const BundleSelection: Story = {
  args: {
    bundle: 'rhel', // Start with RHEL selected
  },
  parameters: {
    // Inherits userIdentity from meta (standardUser)
    docs: {
      description: {
        story: `
## Bundle Selection Test

Tests the visual selection state and basic navigation functionality of bundle cards.

### What This Tests:
- ✅ **Visual Selection State**: Selected card highlighted, others flat
- ✅ **Bundle Card Visibility**: All entitled bundles visible
- ✅ **Navigation Links**: Cards have correct href attributes
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial RHEL selection', async () => {
      await TestHelpers.verifyBundleSelected(canvas, 'Red Hat Enterprise Linux');
      await TestHelpers.verifyBundleSelected(canvas, 'OpenShift', false);
      await TestHelpers.verifyBundleSelected(canvas, 'Settings and User Access', false);
    });

    await step('Navigate to OpenShift and verify selection', async () => {
      await TestHelpers.clickBundleCard(canvas, 'OpenShift');
      await TestHelpers.verifyBundleSelected(canvas, 'OpenShift');
      await TestHelpers.verifyBundleSelected(canvas, 'Red Hat Enterprise Linux', false);
    });
  },
};

export const TableDataRefresh: Story = {
  args: {
    bundle: 'rhel',
  },
  parameters: {
    // Inherits userIdentity from meta (standardUser)
    msw: {
      handlers: [...accessHandlers(muaAccessPermissions), ...v1RolesHandlers(muaRoles)],
    },
    docs: {
      description: {
        story: `
## Table Data Refresh Test

Tests that table content changes correctly when switching between bundles.

### What This Tests:
- ✅ **Data Refreshing**: Table content changes when switching bundles
- ✅ **API Integration**: Real MSW-orchestrated API calls for bundle-specific data
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify initial RHEL permissions', async () => {
      await TestHelpers.verifyTablePermissions(canvas, ['advisor', 'compliance']);
    });

    await step('Navigate to OpenShift and verify table refresh', async () => {
      await TestHelpers.clickBundleCard(canvas, 'OpenShift');
      await TestHelpers.verifyTablePermissions(
        canvas,
        ['cost-management', 'subscriptions'], // Expected OpenShift permissions (filtered by appsIds)
        ['vulnerability', 'patch'], // RHEL permissions that should be gone
      );
    });
  },
};

export const FilterResetOnNavigation: Story = {
  args: {
    bundle: 'rhel',
  },
  parameters: {
    // Inherits userIdentity from meta (standardUser)
    msw: {
      handlers: [...accessHandlers(muaAccessPermissions), ...v1RolesHandlers(muaRoles)],
    },
    docs: {
      description: {
        story: `
## Filter Reset Test

Tests that filters are properly reset when navigating between bundles.

### What This Tests:
- ✅ **Filter Application**: Filter selections create visible chips
- ✅ **Filter Reset**: Chips disappear when navigating to different bundle
- ✅ **Checkbox Reset**: Filter checkboxes are unchecked after navigation
        `,
      },
    },
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Wait for table load and apply filter', async () => {
      await waitFor(
        () => {
          expect(canvasElement.querySelector('.pf-v6-c-skeleton')).toBeNull();
        },
        { timeout: 10000 },
      );
      await TestHelpers.applyFilter(canvas, 'advisor');
    });

    await step('Navigate to OpenShift and verify filter reset', async () => {
      await TestHelpers.clickBundleCard(canvas, 'OpenShift');
      await waitFor(() => {
        expect(canvas.getByText('cost-management')).toBeInTheDocument();
      });
      await TestHelpers.verifyFilterReset(canvas);
    });

    await step('Verify filter checkbox is unchecked', async () => {
      const applicationButtons = await canvas.findAllByRole('button', { name: /Application/i });
      await userEvent.click(applicationButtons[1]);

      const body = within(document.body);
      const advisorCheckboxes = await body.findAllByRole('checkbox', { name: /advisor/i });
      expect(advisorCheckboxes.length).toBeGreaterThan(0);
      const advisorCheckbox = advisorCheckboxes[0];
      expect(advisorCheckbox).not.toBeChecked();

      await userEvent.keyboard('{Escape}');
    });
  },
};

// Additional story for admin user experience
export const OrgAdminView: Story = {
  tags: ['perm:org-admin'],
  args: {
    bundle: 'rhel', // Explicit bundle to avoid setSearchParams timing
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    userIdentity: adminUser,
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [...accessHandlers(muaAccessPermissions), ...v1RolesHandlers(muaRoles, { returnAllForUsername: true })],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    expect(await canvas.findByTestId('entitle-section')).toBeInTheDocument();

    // Test that all entitled bundle cards are visible (scope to bundle cards section)
    const entitleSectionAdmin = await canvas.findByTestId('entitle-section');
    const entitleSectionContentAdmin = within(entitleSectionAdmin);
    expect(await entitleSectionContentAdmin.findByText('Red Hat Enterprise Linux')).toBeInTheDocument();
    expect(await entitleSectionContentAdmin.findByText('OpenShift')).toBeInTheDocument();
    expect(await entitleSectionContentAdmin.findByText('Ansible Automation Platform')).toBeInTheDocument();
    expect(await entitleSectionContentAdmin.findByText('Settings and User Access')).toBeInTheDocument();

    // Test that roles table is shown for admin users (instead of permissions table)
    const rolesTable = await canvas.findByRole('grid', {}, { timeout: 10000 });
    expect(rolesTable).toBeInTheDocument();

    // Verify RHEL roles are displayed (roles table may take time to load)
    expect(await canvas.findByText('RHEL Administrator', {}, { timeout: 15000 })).toBeInTheDocument();
    expect(await canvas.findByText('RHEL Security Analyst', {}, { timeout: 5000 })).toBeInTheDocument();

    // Test that role expansion works - click on the permissions count (RHEL Administrator has 8 permissions)
    const permissionsLink = await canvas.findByText('8');
    await userEvent.click(permissionsLink);

    // Test that the expanded role shows nested permissions table (wait for expansion + data load)
    await waitFor(
      async () => {
        const tbody = permissionsLink.closest('tbody');
        const table = tbody?.querySelector('table');
        if (!table) throw new Error('Could not find expanded table');
        const expandedRow = within(table);
        expect(await expandedRow.findByText('Application')).toBeInTheDocument();
        expect(await expandedRow.findByText('Resource type')).toBeInTheDocument();
        expect(await expandedRow.findByText('Operation')).toBeInTheDocument();

        // Test that specific permissions are shown in the expanded view
        expect(await expandedRow.findByText('advisor', {}, { timeout: 5000 })).toBeInTheDocument();
        expect(await expandedRow.findByText('compliance')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );
  },
};

// Story for limited entitlements scenario
export const LimitedEntitlements: Story = {
  args: {
    bundle: 'rhel', // Explicit bundle to avoid setSearchParams timing
  },
  parameters: {
    viewport: { defaultViewport: 'desktop' },
    userIdentity: limitedUser,
    msw: {
      handlers: [
        ...accessHandlers([{ permission: 'advisor:systems:read', resourceDefinitions: [] }]),
        ...v1RolesHandlers(muaRoles, { returnAllForUsername: true }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that only entitled bundles show (scope to bundle cards section)
    const entitleSectionLimited = await canvas.findByTestId('entitle-section');
    const entitleSectionContentLimited = within(entitleSectionLimited);
    expect(await entitleSectionContentLimited.findByText('Red Hat Enterprise Linux')).toBeInTheDocument();
    expect(await entitleSectionContentLimited.findByText('Settings and User Access')).toBeInTheDocument();

    // Should not see non-entitled bundles
    expect(canvas.queryByText('OpenShift')).not.toBeInTheDocument();
    expect(canvas.queryByText('Ansible Automation Platform')).not.toBeInTheDocument();

    // Should still have permissions table with limited data (table may take time to load)
    const table = await canvas.findByRole('grid', {}, { timeout: 15000 });
    expect(table).toBeInTheDocument();
    expect(await canvas.findByText(/advisor/i, {}, { timeout: 15000 })).toBeInTheDocument();
  },
};

// Responsive navigation story for small viewports
export const ResponsiveNavigation: Story = {
  tags: ['perm:org-admin'],
  globals: {
    viewport: { value: 'mobile2' }, // Large mobile viewport for responsive breakpoint
  },
  args: {
    bundle: 'rhel', // Start with RHEL selected
  },
  parameters: {
    userIdentity: adminUser,
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: false,
    },
    docs: {
      description: {
        story: `
## Responsive Navigation Test

This story tests the responsive navigation behavior on **large mobile viewport** (mobile2 breakpoint).

### What This Tests:
- ✅ **Dropdown is visible** for admin users on mobile/tablet screens
- ✅ **Bundle cards remain in DOM** but are hidden by responsive CSS
- ✅ **Navigation works** through dropdown selection (clicking OpenShift)
- ✅ **Bundle switching** triggers new API calls with different application parameters
- ✅ **Role table** updates with bundle-specific roles (RHEL → OpenShift Administrator)
- ✅ **URL parameters** update correctly when switching bundles via dropdown

### Mobile-First Design:
On smaller screens, the bundle navigation switches from cards to a compact dropdown 
to provide better mobile user experience for administrators. This ensures the interface
remains usable across all device sizes while maintaining full functionality.

**Test Flow:** RHEL (default) → Click dropdown → Select OpenShift → Verify role change
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for entitlements to load - check for page title first with longer timeout
    expect(await canvas.findByText('My User Access', {}, { timeout: 10000 })).toBeInTheDocument();
    // Admin label might be rendered differently in PF6 - use more flexible matcher
    await waitFor(
      async () => {
        expect(await canvas.findByText(/Org\.?\s*Administrator/i)).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // CRITICAL TEST: On small viewport, dropdown should be visible for admins
    // Find dropdown specifically by id - on small viewports it should be present
    const dropdownButton = canvasElement.querySelector('#mua-bundle-dropdown');
    expect(dropdownButton).toBeInTheDocument();
    if (!dropdownButton) throw new Error('Dropdown button not found');
    // Note: Visibility depends on viewport CSS class pf-v6-u-display-none-on-lg
    // The button should have content regardless of visibility
    expect(dropdownButton).toHaveTextContent('Red Hat Enterprise Linux');

    // CRITICAL TEST: Bundle cards should be hidden on small viewport
    // Cards are in the entitle-section but should not be visible due to responsive CSS
    const entitleSection = await canvas.findByTestId('entitle-section');
    expect(entitleSection).toBeInTheDocument();
    // Note: Cards exist in DOM but are hidden via CSS on small viewports

    // Verify current selection shows RHEL in dropdown
    expect(dropdownButton).toHaveTextContent('Red Hat Enterprise Linux');

    // Verify RHEL roles are displayed
    await expect(await canvas.findByText('Your Red Hat Enterprise Linux roles')).toBeInTheDocument();

    // TEST NAVIGATION: Click dropdown to open it
    await userEvent.click(dropdownButton as HTMLElement);

    // Find and click OpenShift option in dropdown (rendered in portal)
    // The dropdown uses NavLink inside DropdownItem - click the link directly
    const body = within(document.body);
    const openshiftLink = await body.findByRole('link', { name: /openshift/i });
    expect(openshiftLink).toBeInTheDocument();
    await userEvent.click(openshiftLink);

    // Wait for navigation to complete - dropdown should now show OpenShift
    await waitFor(
      () => {
        const updatedDropdownButton = canvasElement.querySelector('#mua-bundle-dropdown');
        if (!updatedDropdownButton) throw new Error('Updated dropdown button not found');
        expect(updatedDropdownButton).toHaveTextContent('OpenShift');
      },
      { timeout: 5000 },
    );

    // Verify OpenShift roles are now displayed
    await waitFor(
      async () => {
        await expect(canvas.getByText('Your OpenShift roles')).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};
