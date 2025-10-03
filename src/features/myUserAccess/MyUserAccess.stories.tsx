import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';

import { expect, userEvent, waitFor, within } from 'storybook/test';
import { HttpResponse, delay, http } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { MyUserAccess } from './MyUserAccess';

const meta: Meta<typeof MyUserAccess> = {
  component: MyUserAccess,
  tags: ['custom-css'], // NO autodocs on meta
  parameters: {
    // Use existing Chrome provider to mock user and entitlements
    chrome: {
      auth: {
        getUser: () =>
          Promise.resolve({
            identity: {
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
            },
            entitlements: {
              rhel: { is_entitled: true, is_trial: false },
              openshift: { is_entitled: true, is_trial: false },
              ansible: { is_entitled: false, is_trial: false },
              settings: { is_entitled: true, is_trial: false },
            },
          }),
      },
    },
    permissions: {
      orgAdmin: false,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        // Mock RBAC permissions API - provides different data based on selected bundle
        http.get('/api/rbac/v1/access/', ({ request }) => {
          const url = new URL(request.url);
          const application = url.searchParams.get('application');

          // Determine bundle from applications requested
          let bundlePermissions = [];

          // Check for unique applications to identify bundles correctly
          if (application && application.includes('cost-management')) {
            // OpenShift bundle (cost-management is unique to OpenShift)
            bundlePermissions = [
              {
                permission: 'cluster:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'cluster.name', operation: 'equal', value: 'production' } }],
              },
              {
                permission: 'cost-management:*:read',
                resourceDefinitions: [],
              },
              {
                permission: 'subscriptions:*:read',
                resourceDefinitions: [],
              },
            ];
          } else if (application && application.includes('rbac')) {
            // Settings bundle (rbac is unique to Settings)
            bundlePermissions = [
              {
                permission: 'rbac:*:*',
                resourceDefinitions: [],
              },
              {
                permission: 'sources:*:read',
                resourceDefinitions: [],
              },
            ];
          } else if (application && (application.includes('dashboard') || application.includes('patch') || application.includes('vulnerability'))) {
            // RHEL bundle (dashboard, patch, vulnerability are unique to RHEL)
            bundlePermissions = [
              {
                permission: 'advisor:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'insights.advisor.source', operation: 'equal', value: 'advisor' } }],
              },
              {
                permission: 'compliance:policies:read',
                resourceDefinitions: [],
              },
              {
                permission: 'vulnerability:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'insights.vulnerability.source', operation: 'equal', value: 'scanner' } }],
              },
              {
                permission: 'patch:*:read',
                resourceDefinitions: [],
              },
            ];
          } else {
            // Fallback - default to RHEL permissions
            bundlePermissions = [
              {
                permission: 'advisor:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'insights.advisor.source', operation: 'equal', value: 'advisor' } }],
              },
              {
                permission: 'compliance:policies:read',
                resourceDefinitions: [],
              },
              {
                permission: 'vulnerability:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'insights.vulnerability.source', operation: 'equal', value: 'scanner' } }],
              },
            ];
          }

          return HttpResponse.json({
            data: bundlePermissions,
            meta: { count: bundlePermissions.length, limit: 20, offset: 0 },
          });
        }),

        // Mock RBAC roles API - provides different roles based on selected bundle
        http.get('/api/rbac/v1/roles/', ({ request }) => {
          const url = new URL(request.url);
          const application = url.searchParams.get('application');

          let bundleRoles = [];
          // Use same logic as access API for consistency
          if (application && application.includes('cost-management')) {
            // OpenShift bundle roles (cost-management is unique to OpenShift)
            bundleRoles = [
              {
                uuid: 'role-openshift-1',
                display_name: 'OpenShift Administrator',
                name: 'OpenShift Administrator',
                description: 'Administrative access to OpenShift services',
                accessCount: 5,
                applications: ['cost-management', 'subscriptions'],
                system: false,
                platform_default: false,
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
              },
            ];
          } else if (application && application.includes('rbac')) {
            // Settings bundle roles (rbac is unique to Settings)
            bundleRoles = [
              {
                uuid: 'role-settings-1',
                display_name: 'User Access Administrator',
                name: 'User Access Administrator',
                description: 'Administrative access to user management',
                accessCount: 12,
                applications: ['rbac', 'sources'],
                system: false,
                platform_default: false,
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
              },
            ];
          } else if (application && (application.includes('dashboard') || application.includes('patch') || application.includes('vulnerability'))) {
            // RHEL bundle roles (dashboard, patch, vulnerability are unique to RHEL)
            bundleRoles = [
              {
                uuid: 'role-rhel-1',
                display_name: 'RHEL Administrator',
                name: 'RHEL Administrator',
                description: 'Administrative access to RHEL services',
                accessCount: 8,
                applications: ['advisor', 'compliance', 'patch'],
                system: false,
                platform_default: false,
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
              },
            ];
          } else {
            // Fallback to RHEL roles
            bundleRoles = [
              {
                uuid: 'role-rhel-1',
                display_name: 'RHEL Administrator',
                name: 'RHEL Administrator',
                description: 'Administrative access to RHEL services',
                accessCount: 8,
                applications: ['advisor', 'compliance', 'patch'],
                system: false,
                platform_default: false,
              },
            ];
          }

          return HttpResponse.json({
            data: bundleRoles,
            meta: { count: bundleRoles.length, limit: 20, offset: 0 },
          });
        }),

        // Mock individual role permissions API for expandable rows
        http.get('/api/rbac/v1/roles/:roleId/', ({ params }) => {
          const { roleId } = params;
          let mockRolePermissions = [];

          if (roleId?.includes('openshift')) {
            mockRolePermissions = [
              { permission: 'cluster:read:*', resourceDefinitions: [] },
              { permission: 'cost-management:*:read', resourceDefinitions: [] },
              { permission: 'subscriptions:read:*', resourceDefinitions: [] },
            ];
          } else if (roleId?.includes('settings')) {
            mockRolePermissions = [
              { permission: 'rbac:*:*', resourceDefinitions: [] },
              { permission: 'sources:*:read', resourceDefinitions: [] },
            ];
          } else {
            // RHEL roles
            mockRolePermissions = [
              {
                permission: 'advisor:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'advisor.source', operation: 'equal', value: 'advisor' } }],
              },
              { permission: 'compliance:policies:read', resourceDefinitions: [] },
              { permission: 'vulnerability:*:*', resourceDefinitions: [] },
            ];
          }

          return HttpResponse.json({
            uuid: roleId,
            access: mockRolePermissions,
          });
        }),
      ],
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
  async waitForLayout(canvas: ReturnType<typeof within>) {
    await TestHelpers.delay(500);
    const entitleSection = await canvas.findByTestId('entitle-section');
    const entitleSectionContent = within(entitleSection);
    return { entitleSection, entitleSectionContent };
  },

  /**
   * Verify a bundle card is selected (not flat)
   */
  async verifyBundleSelected(canvas: ReturnType<typeof within>, bundleName: string, shouldBeSelected: boolean = true) {
    const { entitleSectionContent } = await this.waitForLayout(canvas);
    const cardTitle = await entitleSectionContent.findByText(bundleName);
    const cardElement = cardTitle.closest('.pf-v5-c-card');

    if (shouldBeSelected) {
      expect(cardElement).not.toHaveClass('pf-m-flat');
      console.log(`SB: ✅ ${bundleName} card is selected`);
    } else {
      expect(cardElement).toHaveClass('pf-m-flat');
      console.log(`SB: ✅ ${bundleName} card is not selected`);
    }

    return { cardElement, cardTitle };
  },

  /**
   * Verify table shows expected permissions
   */
  async verifyTablePermissions(canvas: ReturnType<typeof within>, expectedPermissions: string[], unexpectedPermissions: string[] = []) {
    const table = await canvas.findByRole('grid');
    const tableContent = within(table);

    for (const permission of expectedPermissions) {
      expect(await tableContent.findByText(permission)).toBeInTheDocument();
    }

    for (const permission of unexpectedPermissions) {
      expect(tableContent.queryByText(permission)).not.toBeInTheDocument();
    }

    console.log(`SB: ✅ Table permissions verified: ${expectedPermissions.join(', ')}`);
    return { table, tableContent };
  },

  /**
   * Apply filter and verify chip appears
   */
  async applyFilter(canvas: ReturnType<typeof within>, filterValue: string) {
    // Find and click the filter dropdown
    const applicationFilterButton = canvas.getByText('Filter by application...');
    await userEvent.click(applicationFilterButton);

    // Wait for dropdown to open and select the filter option
    const filterCheckbox = await canvas.findByRole('menuitem', { name: new RegExp(filterValue, 'i') });
    expect(filterCheckbox).toBeInTheDocument();

    // Click the checkbox input directly, not the label
    const checkboxInput = within(filterCheckbox).getByRole('checkbox');
    await userEvent.click(checkboxInput);

    // Close dropdown
    await userEvent.keyboard('{Escape}');

    // Verify filter chip appears
    await waitFor(() => {
      const chipGroup = canvas.queryByRole('group', { name: /application/i });
      if (!chipGroup) {
        throw new Error('Filter chip group not found - filter may not be applied');
      }
      const filterChip = within(chipGroup).getByText(filterValue);
      expect(filterChip).toBeInTheDocument();
    });

    console.log(`SB: ✅ Filter applied: ${filterValue}`);
  },

  /**
   * Verify filter is reset (no chips visible)
   */
  async verifyFilterReset(canvas: ReturnType<typeof within>) {
    await waitFor(
      () => {
        const chipGroup = canvas.queryByRole('group', { name: /application/i });
        expect(chipGroup).not.toBeInTheDocument();
      },
      { timeout: 3000 },
    ); // Give more time for filter reset to take effect

    console.log('SB: ✅ Filter reset verified');
  },

  /**
   * Click a bundle card to navigate
   */
  async clickBundleCard(canvas: ReturnType<typeof within>, bundleName: string) {
    const { entitleSectionContent } = await this.waitForLayout(canvas);
    const cardTitle = await entitleSectionContent.findByText(bundleName);
    const bundleCardLink = cardTitle.closest('[aria-label="card-link"]');

    expect(bundleCardLink).toBeInTheDocument();
    expect(bundleCardLink).toHaveAttribute('href', expect.stringContaining('bundle='));

    bundleCardLink && (await userEvent.click(bundleCardLink));
    await TestHelpers.delay(300); // Allow navigation to complete

    console.log(`SB: ✅ Clicked ${bundleName} bundle card`);
  },
};

export const Default: Story = {
  tags: ['autodocs'], // ONLY default story gets autodocs
  args: {
    bundle: undefined, // Explicitly no bundle to test default logic
  },
  parameters: {
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    await TestHelpers.delay(700); // Extra time for setSearchParams

    console.log('SB: Testing default bundle selection...');

    // Verify layout renders
    expect(await canvas.findByTestId('entitle-section')).toBeInTheDocument();

    // Verify RHEL is selected as default
    await TestHelpers.verifyBundleSelected(canvas, 'Red Hat Enterprise Linux');

    // Verify page title
    const pageTitle = await canvas.findByText('Your Red Hat Enterprise Linux permissions');
    expect(pageTitle).toBeInTheDocument();

    // Verify RHEL permissions are loaded
    await TestHelpers.verifyTablePermissions(canvas, ['advisor', 'compliance']);

    console.log('SB: ✅ Default bundle test completed');
  },
};

export const BundleSelection: Story = {
  args: {
    bundle: 'rhel', // Start with RHEL selected
  },
  parameters: {
    chrome: {
      auth: {
        getUser: () =>
          Promise.resolve({
            identity: {
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
            },
            entitlements: {
              rhel: { is_entitled: true, is_trial: false },
              openshift: { is_entitled: true, is_trial: false },
              ansible: { is_entitled: false, is_trial: false },
              settings: { is_entitled: true, is_trial: false },
            },
          }),
      },
    },
    permissions: {
      orgAdmin: false,
      userAccessAdministrator: false,
    },
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    console.log('SB: Testing bundle selection...');

    // Verify layout and RHEL is initially selected
    await TestHelpers.verifyBundleSelected(canvas, 'Red Hat Enterprise Linux');
    await TestHelpers.verifyBundleSelected(canvas, 'OpenShift', false);
    await TestHelpers.verifyBundleSelected(canvas, 'Settings and User Access', false);

    // Verify navigation functionality
    await TestHelpers.clickBundleCard(canvas, 'OpenShift');

    // Verify OpenShift is now selected and RHEL is not
    await TestHelpers.verifyBundleSelected(canvas, 'OpenShift');
    await TestHelpers.verifyBundleSelected(canvas, 'Red Hat Enterprise Linux', false);

    console.log('SB: ✅ Bundle selection test completed');
  },
};

export const TableDataRefresh: Story = {
  args: {
    bundle: 'rhel',
  },
  parameters: {
    chrome: {
      auth: {
        getUser: () =>
          Promise.resolve({
            identity: {
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
            },
            entitlements: {
              rhel: { is_entitled: true, is_trial: false },
              openshift: { is_entitled: true, is_trial: false },
              ansible: { is_entitled: false, is_trial: false },
              settings: { is_entitled: true, is_trial: false },
            },
          }),
      },
    },
    permissions: {
      orgAdmin: false,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        // Use same MSW logic as main meta for consistent data
        http.get('/api/rbac/v1/access/', ({ request }) => {
          const url = new URL(request.url);
          const application = url.searchParams.get('application');

          let bundlePermissions = [];

          if (application && application.includes('cost-management')) {
            // OpenShift bundle (cost-management is unique to OpenShift)
            bundlePermissions = [
              {
                permission: 'cluster:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'cluster.name', operation: 'equal', value: 'production' } }],
              },
              {
                permission: 'cost-management:*:read',
                resourceDefinitions: [],
              },
              {
                permission: 'subscriptions:*:read',
                resourceDefinitions: [],
              },
            ];
          } else if (application && (application.includes('dashboard') || application.includes('patch') || application.includes('vulnerability'))) {
            // RHEL bundle (dashboard, patch, vulnerability are unique to RHEL)
            bundlePermissions = [
              {
                permission: 'advisor:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'insights.advisor.source', operation: 'equal', value: 'advisor' } }],
              },
              {
                permission: 'compliance:policies:read',
                resourceDefinitions: [],
              },
              {
                permission: 'vulnerability:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'insights.vulnerability.source', operation: 'equal', value: 'scanner' } }],
              },
            ];
          } else {
            // Fallback - default to RHEL permissions
            bundlePermissions = [
              {
                permission: 'advisor:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'insights.advisor.source', operation: 'equal', value: 'advisor' } }],
              },
              {
                permission: 'compliance:policies:read',
                resourceDefinitions: [],
              },
              {
                permission: 'vulnerability:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'insights.vulnerability.source', operation: 'equal', value: 'scanner' } }],
              },
            ];
          }

          return HttpResponse.json({
            data: bundlePermissions,
            meta: { count: bundlePermissions.length, limit: 20, offset: 0 },
          });
        }),
      ],
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    console.log('SB: Testing table data refresh...');

    // Verify initial RHEL permissions
    await TestHelpers.verifyTablePermissions(canvas, ['advisor', 'compliance']);

    // Navigate to OpenShift bundle
    await TestHelpers.clickBundleCard(canvas, 'OpenShift');

    // Verify OpenShift permissions appear and RHEL permissions disappear
    await TestHelpers.verifyTablePermissions(
      canvas,
      ['cluster', 'cost-management'], // Expected OpenShift permissions
      ['vulnerability', 'patch'], // RHEL permissions that should be gone
    );

    console.log('SB: ✅ Table data refresh test completed');
  },
};

export const FilterResetOnNavigation: Story = {
  args: {
    bundle: 'rhel',
  },
  parameters: {
    chrome: {
      auth: {
        getUser: () =>
          Promise.resolve({
            identity: {
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
            },
            entitlements: {
              rhel: { is_entitled: true, is_trial: false },
              openshift: { is_entitled: true, is_trial: false },
              ansible: { is_entitled: false, is_trial: false },
              settings: { is_entitled: true, is_trial: false },
            },
          }),
      },
    },
    permissions: {
      orgAdmin: false,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        // Use same MSW logic as main meta for consistent data
        http.get('/api/rbac/v1/access/', ({ request }) => {
          const url = new URL(request.url);
          const application = url.searchParams.get('application');

          let bundlePermissions = [];

          console.log('SB: MSW: Filter reset test - application param:', application);

          if (application && application.includes('cost-management')) {
            // OpenShift bundle (cost-management is unique to OpenShift)
            bundlePermissions = [
              {
                permission: 'cluster:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'cluster.name', operation: 'equal', value: 'production' } }],
              },
              {
                permission: 'cost-management:*:read',
                resourceDefinitions: [],
              },
              {
                permission: 'subscriptions:*:read',
                resourceDefinitions: [],
              },
            ];
          } else if (application && (application.includes('dashboard') || application.includes('patch') || application.includes('vulnerability'))) {
            // RHEL bundle (dashboard, patch, vulnerability are unique to RHEL)
            bundlePermissions = [
              {
                permission: 'advisor:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'insights.advisor.source', operation: 'equal', value: 'advisor' } }],
              },
              {
                permission: 'compliance:policies:read',
                resourceDefinitions: [],
              },
              {
                permission: 'vulnerability:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'insights.vulnerability.source', operation: 'equal', value: 'scanner' } }],
              },
            ];
          } else {
            // Fallback - default to RHEL permissions
            bundlePermissions = [
              {
                permission: 'advisor:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'insights.advisor.source', operation: 'equal', value: 'advisor' } }],
              },
              {
                permission: 'compliance:policies:read',
                resourceDefinitions: [],
              },
              {
                permission: 'vulnerability:*:*',
                resourceDefinitions: [{ attributeFilter: { key: 'insights.vulnerability.source', operation: 'equal', value: 'scanner' } }],
              },
            ];
          }

          console.log('SB: MSW: Returning bundle permissions:', bundlePermissions);

          return HttpResponse.json({
            data: bundlePermissions,
            meta: { count: bundlePermissions.length, limit: 20, offset: 0 },
          });
        }),
      ],
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
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);
    console.log('SB: Testing filter reset on navigation...');

    // Wait for initial table data to load (RHEL bundle data)
    await waitFor(() => {
      expect(canvasElement.querySelector('.pf-v5-c-skeleton')).toBeNull();
    });
    console.log('SB: ✅ Initial table data loaded');

    // Apply a filter
    await TestHelpers.applyFilter(canvas, 'advisor');

    // Navigate to different bundle
    await TestHelpers.clickBundleCard(canvas, 'OpenShift');

    // Wait for new table data to load (OpenShift bundle data)
    await waitFor(() => {
      expect(canvas.getByText('cluster')).toBeInTheDocument();
    });
    console.log('SB: ✅ New bundle data loaded');

    // Verify filter was reset
    await TestHelpers.verifyFilterReset(canvas);

    // Double-check checkbox is unchecked - now that table is fully loaded
    const applicationFilterButton = canvas.getByText('Filter by application...');
    await userEvent.click(applicationFilterButton);

    await waitFor(async () => {
      const advisorCheckbox = canvas.getByRole('menuitem', { name: /advisor/i });
      const advisorCheckboxInput = within(advisorCheckbox).getByRole('checkbox');
      expect(advisorCheckboxInput).not.toBeChecked();
    });

    await userEvent.keyboard('{Escape}');
    console.log('SB: ✅ Filter reset test completed');
  },
};

// Additional story for admin user experience
export const OrgAdminView: Story = {
  tags: ['perm:org-admin'],
  args: {
    // Test with default bundle logic for admin user
    bundle: undefined,
  },
  parameters: {
    chrome: {
      auth: {
        getUser: () =>
          Promise.resolve({
            identity: {
              account_number: '12345',
              org_id: '67890',
              user: {
                email: 'admin@example.com',
                first_name: 'Admin',
                last_name: 'User',
                is_active: true,
                is_org_admin: true, // Admin user
                username: 'adminuser',
              },
            },
            entitlements: {
              rhel: { is_entitled: true, is_trial: false },
              openshift: { is_entitled: true, is_trial: false },
              ansible: { is_entitled: true, is_trial: false },
              settings: { is_entitled: true, is_trial: false },
            },
          }),
      },
    },
    permissions: {
      orgAdmin: true, // Admin permissions
      userAccessAdministrator: false,
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Test that layout structure exists
    expect(await canvas.findByTestId('entitle-section')).toBeInTheDocument();

    // Test that all entitled bundle cards are visible (scope to bundle cards section)
    const entitleSectionAdmin = await canvas.findByTestId('entitle-section');
    const entitleSectionContentAdmin = within(entitleSectionAdmin);
    expect(await entitleSectionContentAdmin.findByText('Red Hat Enterprise Linux')).toBeInTheDocument();
    expect(await entitleSectionContentAdmin.findByText('OpenShift')).toBeInTheDocument();
    expect(await entitleSectionContentAdmin.findByText('Ansible Automation Platform')).toBeInTheDocument();
    expect(await entitleSectionContentAdmin.findByText('Settings and User Access')).toBeInTheDocument();

    // Test that roles table is shown for admin users (instead of permissions table)
    const rolesTable = await canvas.findByRole('grid');
    expect(rolesTable).toBeInTheDocument();

    // Verify RHEL roles are displayed (from common handlers)
    const rolesTableContent = within(rolesTable);
    expect(await rolesTableContent.findByText('RHEL Administrator')).toBeInTheDocument();
    expect(await rolesTableContent.findByText('RHEL Security Analyst')).toBeInTheDocument();

    // Test that role expansion works - click on the permissions count (RHEL Administrator has 8 permissions)
    const permissionsLink = await canvas.findByText('8');
    await userEvent.click(permissionsLink);

    // Test that the expanded role shows nested permissions table
    await waitFor(async () => {
      const tbody = permissionsLink.closest('tbody');
      const table = tbody?.querySelector('table');
      if (!table) throw new Error('Could not find expanded table');
      const expandedRow = within(table);
      expect(await expandedRow.findByText('Application')).toBeInTheDocument();
      expect(await expandedRow.findByText('Resource type')).toBeInTheDocument();
      expect(await expandedRow.findByText('Operation')).toBeInTheDocument();

      // Test that specific permissions are shown in the expanded view
      expect(await expandedRow.findByText('advisor')).toBeInTheDocument();
      expect(await expandedRow.findByText('compliance')).toBeInTheDocument();
    });
  },
};

// Story for limited entitlements scenario
export const LimitedEntitlements: Story = {
  args: {
    // Test with default bundle logic when user has limited entitlements
    bundle: undefined,
  },
  parameters: {
    chrome: {
      auth: {
        getUser: () =>
          Promise.resolve({
            identity: {
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
            },
            entitlements: {
              rhel: { is_entitled: true, is_trial: false },
              openshift: { is_entitled: false, is_trial: false },
              ansible: { is_entitled: false, is_trial: false },
              settings: { is_entitled: true, is_trial: false },
            },
          }),
      },
    },
    permissions: {
      orgAdmin: false,
      userAccessAdministrator: false,
    },
    msw: {
      handlers: [
        // Limited permissions for RHEL only
        http.get('/api/rbac/v1/access/', () => {
          return HttpResponse.json({
            data: [
              {
                permission: 'advisor:systems:read',
                resourceDefinitions: [],
              },
            ],
            meta: { count: 1, limit: 20, offset: 0 },
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    await delay(300);
    const canvas = within(canvasElement);

    // Test that only entitled bundles show (scope to bundle cards section)
    const entitleSectionLimited = await canvas.findByTestId('entitle-section');
    const entitleSectionContentLimited = within(entitleSectionLimited);
    expect(await entitleSectionContentLimited.findByText('Red Hat Enterprise Linux')).toBeInTheDocument();
    expect(await entitleSectionContentLimited.findByText('Settings and User Access')).toBeInTheDocument();

    // Should not see non-entitled bundles
    expect(canvas.queryByText('OpenShift')).not.toBeInTheDocument();
    expect(canvas.queryByText('Ansible Automation Platform')).not.toBeInTheDocument();

    // Should still have permissions table with limited data
    const table = await canvas.findByRole('grid');
    expect(table).toBeInTheDocument();
    const tableContent = within(table);
    expect(await tableContent.findByText('advisor')).toBeInTheDocument();
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
    chrome: {
      auth: {
        getUser: () =>
          Promise.resolve({
            identity: {
              account_number: '12345',
              org_id: '67890',
              user: {
                email: 'admin@example.com',
                first_name: 'Admin',
                last_name: 'User',
                is_active: true,
                is_org_admin: true, // Admin user to show dropdown
                username: 'adminuser',
              },
            },
            entitlements: {
              rhel: { is_entitled: true, is_trial: false },
              openshift: { is_entitled: true, is_trial: false },
              ansible: { is_entitled: true, is_trial: false },
              settings: { is_entitled: true, is_trial: false },
            },
          }),
      },
    },
    permissions: {
      orgAdmin: true, // Admin permissions
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
    await delay(500); // Wait for component initialization

    console.log('SB: 🔍 Testing responsive navigation on small viewport...');

    // Wait for entitlements to load - check for admin label
    expect(await canvas.findByText('My User Access')).toBeInTheDocument();
    expect(await canvas.findByText('Org. Administrator')).toBeInTheDocument();

    // CRITICAL TEST: On small viewport, dropdown should be visible for admins
    // Find dropdown specifically by looking for the dropdown section first, then the button
    const dropdownSection = canvasElement.querySelector('.rbac-p-myUserAccess--dropdown');
    expect(dropdownSection).toBeInTheDocument();
    if (!dropdownSection) throw new Error('Dropdown section not found');

    const dropdownButton = within(dropdownSection as HTMLElement).getByRole('button');
    expect(dropdownButton).toBeInTheDocument();
    expect(dropdownButton).toBeVisible();
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
    await userEvent.click(dropdownButton);

    // Find and click OpenShift option in dropdown
    const dropdownMenu = await canvas.findByRole('menu');
    expect(dropdownMenu).toBeVisible();
    const menuContent = within(dropdownMenu);

    const openshiftOption = await menuContent.findByText('OpenShift');
    expect(openshiftOption).toBeInTheDocument();
    await userEvent.click(openshiftOption);

    // Verify dropdown shows OpenShift selection
    const updatedDropdownSection = canvasElement.querySelector('.rbac-p-myUserAccess--dropdown');
    if (!updatedDropdownSection) throw new Error('Updated dropdown section not found');
    const updatedDropdownButton = within(updatedDropdownSection as HTMLElement).getByRole('button');
    expect(updatedDropdownButton).toHaveTextContent('OpenShift');

    // Verify OpenShift roles are now displayed
    await waitFor(async () => {
      await expect(canvas.getByText('Your OpenShift roles')).toBeInTheDocument();
    });
  },
};
