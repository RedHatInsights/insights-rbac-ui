import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter, Route, Routes, useNavigate } from 'react-router-dom';
import { HttpResponse, http } from 'msw';
import { expect, fn, userEvent, waitFor, within } from 'storybook/test';
import { AddGroupWizard } from './AddGroupWizard';

// REUSABLE HELPER: Fill Add Group Wizard Form
interface GroupFormData {
  name: string;
  description?: string;
  selectRoles?: boolean;
  selectUsers?: boolean;
  selectServiceAccounts?: boolean;
}

// API Spy Types - Define what each spy should receive as parameters

interface APISpies {
  groupCreationSpy?: ReturnType<typeof fn>;
  roleAssignmentSpy?: ReturnType<typeof fn>;
  principalAssignmentSpy?: ReturnType<typeof fn>;
}

/**
 * Helper function to fill out the Add Group Wizard form
 * Shared with AppEntry E2E tests to avoid duplication
 */
async function fillAddGroupWizardForm(data: GroupFormData, spies?: APISpies): Promise<void> {
  const body = within(document.body);

  // STEP 1: Fill name and description
  const nameInput = document.getElementById('group-name') as HTMLInputElement;
  expect(nameInput).toBeInTheDocument();

  await userEvent.clear(nameInput);
  await userEvent.type(nameInput, data.name);

  if (data.description) {
    const descriptionInput = document.getElementById('group-description');
    if (descriptionInput) {
      await userEvent.clear(descriptionInput);
      await userEvent.type(descriptionInput, data.description);
    }
  }

  // Wait for form validation to complete
  await waitFor(() => {
    expect(nameInput.value).toBe(data.name);
  });

  // Helper to get wizard next button (extracted from FullWizardFlow)
  const getWizardNextButton = () => {
    const allNextButtons = body.queryAllByRole('button', { name: /next/i });
    return allNextButtons.find((btn) => {
      const isNotPagination = !btn.closest('.pf-v5-c-pagination');
      const isEnabled = !btn.hasAttribute('disabled') && btn.getAttribute('aria-disabled') !== 'true';
      return isNotPagination && isEnabled;
    });
  };

  // Navigate to next step - wait for button to be enabled
  const nextButton1 = await waitFor(
    () => {
      const button = getWizardNextButton();
      expect(button).toBeInTheDocument();
      expect(button).toBeEnabled();
      return button!;
    },
    { timeout: 15000 },
  ); // Extended timeout for async validation

  await userEvent.click(nextButton1);

  // STEP 2: Handle Roles step (if not in workspaces mode)
  let currentStepHasRoles = false;
  try {
    await waitFor(
      () => {
        const rolesContent = body.queryAllByText(/add roles|select roles/i)[0] || body.queryByText(/role/i);
        if (rolesContent) {
          currentStepHasRoles = true;
          expect(rolesContent).toBeInTheDocument();
        }
      },
      { timeout: 3000 },
    );
  } catch {
    // No roles step - probably workspaces mode
  }

  if (currentStepHasRoles && data.selectRoles) {
    // Wait for roles to load
    await waitFor(
      () => {
        const roleCheckboxes = body.queryAllByRole('checkbox');
        expect(roleCheckboxes.length).toBeGreaterThan(1);
      },
      { timeout: 8000 },
    );

    const roleCheckboxes = body.queryAllByRole('checkbox');
    if (roleCheckboxes.length >= 2) {
      await userEvent.click(roleCheckboxes[1]); // Select first role
      // Wait for checkbox to actually be checked
      await waitFor(
        () => {
          expect(roleCheckboxes[1]).toBeChecked();
        },
        { timeout: 2000 },
      );
    }

    // Navigate to next step
    const nextButton2 = await waitFor(
      () => {
        const button = getWizardNextButton();
        expect(button).toBeInTheDocument();
        return button!;
      },
      { timeout: 5000 },
    );

    await userEvent.click(nextButton2);
  } else if (currentStepHasRoles) {
    // Skip roles selection but still navigate
    const nextButton2 = await waitFor(
      () => {
        const button = getWizardNextButton();
        expect(button).toBeInTheDocument();
        return button!;
      },
      { timeout: 5000 },
    );

    await userEvent.click(nextButton2);
  }

  // STEP 3: Handle Members/Users step
  await waitFor(
    () => {
      const membersContent = body.queryAllByText(/add members|add users|select users/i)[0] || body.queryByText(/member|user/i);
      expect(membersContent).toBeTruthy();
    },
    { timeout: 5000 },
  );

  if (data.selectUsers) {
    await waitFor(
      () => {
        const userCheckboxes = body.queryAllByRole('checkbox');
        expect(userCheckboxes.length).toBeGreaterThan(1);
      },
      { timeout: 8000 },
    );

    const userCheckboxes = body.queryAllByRole('checkbox');
    if (userCheckboxes.length >= 2) {
      await userEvent.click(userCheckboxes[1]); // Select first user
    }
  }

  // Try to navigate to next step (could be service accounts or review)
  const nextButton3 = await waitFor(
    () => {
      const button = getWizardNextButton();
      expect(button).toBeInTheDocument();
      return button!;
    },
    { timeout: 5000 },
  );

  await userEvent.click(nextButton3);

  // STEP 4: Handle Service Accounts step (optional)
  let hasServiceAccountsStep = false;
  try {
    await waitFor(
      () => {
        const serviceAccountsContent = body.queryAllByText(/service account/i)[0];
        if (serviceAccountsContent) {
          hasServiceAccountsStep = true;
          expect(serviceAccountsContent).toBeInTheDocument();
        }
      },
      { timeout: 3000 },
    );
  } catch {
    // No service accounts step - go to review
    // console.log('🎯 WIZARD HELPER: No service accounts step - going to review');
  }

  if (hasServiceAccountsStep) {
    // console.log('🎯 WIZARD HELPER: Step 4 - Service accounts step found');

    if (data.selectServiceAccounts) {
      const saCheckboxes = body.queryAllByRole('checkbox');
      if (saCheckboxes.length >= 2) {
        await userEvent.click(saCheckboxes[1]); // Select first service account
        await waitFor(
          () => {
            expect(saCheckboxes[1]).toBeChecked();
          },
          { timeout: 2000 },
        );
      }
    }

    // Navigate to review step
    const nextButton4 = await waitFor(
      () => {
        const button = getWizardNextButton();
        expect(button).toBeInTheDocument();
        return button!;
      },
      { timeout: 5000 },
    );

    await userEvent.click(nextButton4);
  }

  // FINAL STEP: Verify we reached Review step and submit
  await waitFor(
    () => {
      const reviewContent = body.queryAllByText(/review|summary/i)[0];
      const groupNameText = body.queryByText(new RegExp(data.name.toLowerCase(), 'i'));
      const createButton = body.queryAllByRole('button').find((btn) => /create|submit|finish|add.*group/i.test(btn.textContent || ''));
      const finalStep = reviewContent || groupNameText || createButton;
      expect(finalStep).toBeTruthy();
    },
    { timeout: 8000 },
  );

  // console.log('🎯 WIZARD HELPER: Final step - Review step reached');

  // Click the Create/Submit button
  const createButton = await waitFor(
    () => {
      const buttons = body.queryAllByRole('button');
      const submitBtn = buttons.find(
        (btn) =>
          /create|submit|finish|add.*group/i.test(btn.textContent || '') &&
          !btn.hasAttribute('disabled') &&
          btn.getAttribute('aria-disabled') !== 'true',
      );
      expect(submitBtn).toBeTruthy();
      return submitBtn!;
    },
    { timeout: 5000 },
  );

  // console.log('🎯 WIZARD HELPER: Submitting form...');
  await userEvent.click(createButton);

  // VALIDATION: Use spies if provided, otherwise use UI indicators
  if (spies) {
    // console.log('🎯 WIZARD HELPER: Using API spies for validation...');
    await waitFor(
      () => {
        // Verify that the group creation API was called with EXACT data from HAR file
        expect(spies.groupCreationSpy).toHaveBeenCalledWith({
          name: data.name,
          description: data.description,
          user_list: [{ username: 'alice.johnson' }],
          roles_list: ['role-1'],
        });

        // If roles were selected, verify role assignment API was called with EXACT data from HAR file
        if (data.selectRoles && spies.roleAssignmentSpy) {
          expect(spies.roleAssignmentSpy).toHaveBeenCalledWith('new-group-uuid', {
            roles: ['role-1'],
          });
        }

        // If users were selected, verify principal assignment API was called with correct format
        if (data.selectUsers && spies.principalAssignmentSpy) {
          expect(spies.principalAssignmentSpy).toHaveBeenCalledWith('new-group-uuid', {
            principals: [{ username: 'alice.johnson' }], // No clientId or type for users
          });
        }

        return true;
      },
      { timeout: 10000 },
    );

    // console.log('✅ WIZARD HELPER: Form submitted with validated API spies');
  } else {
    // Fallback to UI success indicators when no spies provided
    await waitFor(
      () => {
        const successNotification =
          document.querySelector('.pf-v5-c-alert--success') ||
          document.querySelector('.notifications-portal') ||
          body.queryByText(/success/i) ||
          body.queryByText(/created successfully/i) ||
          body.queryByText(/group.*created/i);

        const backToGroupsList = body.queryByText('Groups') && !document.querySelector('[data-ouia-component-id="add-group-wizard"]');

        const wizardClosed = !document.querySelector('[data-ouia-component-id="add-group-wizard"]');

        const hasSuccessIndicator = successNotification || backToGroupsList || wizardClosed;

        if (hasSuccessIndicator) {
          // console.log('🎉 WIZARD HELPER: Success indicator found - form submission validated');
          expect(hasSuccessIndicator).toBeTruthy();
          return true;
        }

        throw new Error('Waiting for form submission to complete...');
      },
      { timeout: 10000 },
    );

    // console.log('✅ WIZARD HELPER: Form submitted successfully');
  }
}

// Mock data for the wizard steps - Enhanced for better testing experience
const mockUsers = [
  { username: 'alice.johnson', email: 'alice.johnson@redhat.com', first_name: 'Alice', last_name: 'Johnson', is_active: true },
  { username: 'bob.chen', email: 'bob.chen@redhat.com', first_name: 'Bob', last_name: 'Chen', is_active: true },
  { username: 'carol.rodriguez', email: 'carol.rodriguez@redhat.com', first_name: 'Carol', last_name: 'Rodriguez', is_active: true },
  { username: 'david.kim', email: 'david.kim@redhat.com', first_name: 'David', last_name: 'Kim', is_active: true },
  { username: 'emma.wilson', email: 'emma.wilson@redhat.com', first_name: 'Emma', last_name: 'Wilson', is_active: true },
  { username: 'frank.garcia', email: 'frank.garcia@redhat.com', first_name: 'Frank', last_name: 'Garcia', is_active: true },
  { username: 'grace.liu', email: 'grace.liu@redhat.com', first_name: 'Grace', last_name: 'Liu', is_active: true },
  { username: 'henry.brown', email: 'henry.brown@redhat.com', first_name: 'Henry', last_name: 'Brown', is_active: true },
  { username: 'iris.patel', email: 'iris.patel@redhat.com', first_name: 'Iris', last_name: 'Patel', is_active: true },
  { username: 'jack.murphy', email: 'jack.murphy@redhat.com', first_name: 'Jack', last_name: 'Murphy', is_active: true },
  { username: 'karen.taylor', email: 'karen.taylor@redhat.com', first_name: 'Karen', last_name: 'Taylor', is_active: true },
  { username: 'luis.martinez', email: 'luis.martinez@redhat.com', first_name: 'Luis', last_name: 'Martinez', is_active: true },
];

const mockRoles = [
  {
    uuid: 'role-1',
    name: 'Console Administrator',
    description: 'Full administrative access to all resources and settings',
    system: false,
    platform_default: false,
  },
  {
    uuid: 'role-2',
    name: 'Organization Administrator',
    description: 'Manage organization settings, users, and subscriptions',
    system: false,
    platform_default: false,
  },
  {
    uuid: 'role-3',
    name: 'Insights Viewer',
    description: 'View insights, recommendations, and system health data',
    system: false,
    platform_default: false,
  },
  {
    uuid: 'role-4',
    name: 'Insights Administrator',
    description: 'Full access to insights data and configuration',
    system: false,
    platform_default: false,
  },
  { uuid: 'role-5', name: 'Inventory Viewer', description: 'View system inventory and host information', system: false, platform_default: false },
  {
    uuid: 'role-6',
    name: 'Inventory Administrator',
    description: 'Manage system inventory, groups, and tags',
    system: false,
    platform_default: false,
  },
  {
    uuid: 'role-7',
    name: 'Vulnerability Viewer',
    description: 'View vulnerability reports and recommendations',
    system: false,
    platform_default: false,
  },
  { uuid: 'role-8', name: 'Compliance Viewer', description: 'View compliance policies and scan results', system: false, platform_default: false },
  {
    uuid: 'role-9',
    name: 'Automation Hub Viewer',
    description: 'View Ansible collections and execution environments',
    system: false,
    platform_default: false,
  },
  {
    uuid: 'role-10',
    name: 'Cost Management Viewer',
    description: 'View cost analysis and optimization data',
    system: false,
    platform_default: false,
  },
  {
    uuid: 'role-11',
    name: 'RBAC Administrator',
    description: 'Manage roles, policies, and user access permissions',
    system: false,
    platform_default: false,
  },
  { uuid: 'role-12', name: 'Developer', description: 'Access to development tools and application services', system: false, platform_default: false },
];

const mockServiceAccounts = [
  {
    uuid: 'service-account-1',
    name: 'ci-pipeline-prod',
    clientId: 'service-ci-prod-001',
    description: 'Production CI/CD pipeline service account for automated deployments',
    createdBy: 'devops-team',
    createdAt: 1642636800000,
    assignedToSelectedGroup: false,
  },
  {
    uuid: 'service-account-2',
    name: 'monitoring-grafana',
    clientId: 'service-monitoring-002',
    description: 'Grafana monitoring service account for metrics collection',
    createdBy: 'sre-team',
    createdAt: 1642550400000,
    assignedToSelectedGroup: false,
  },
  {
    uuid: 'service-account-3',
    name: 'backup-automation',
    clientId: 'service-backup-003',
    description: 'Automated backup service account for data protection',
    createdBy: 'infrastructure-team',
    createdAt: 1642464000000,
    assignedToSelectedGroup: false,
  },
  {
    uuid: 'service-account-4',
    name: 'api-gateway',
    clientId: 'service-gateway-004',
    description: 'API Gateway service account for external integrations',
    createdBy: 'api-team',
    createdAt: 1642377600000,
    assignedToSelectedGroup: false,
  },
  {
    uuid: 'service-account-5',
    name: 'log-aggregator',
    clientId: 'service-logs-005',
    description: 'Log aggregation service account for centralized logging',
    createdBy: 'platform-team',
    createdAt: 1642291200000,
    assignedToSelectedGroup: false,
  },
  {
    uuid: 'service-account-6',
    name: 'security-scanner',
    clientId: 'service-security-006',
    description: 'Security scanning service account for vulnerability assessment',
    createdBy: 'security-team',
    createdAt: 1642204800000,
    assignedToSelectedGroup: false,
  },
];

// Inner component that uses navigate hook
const GroupsPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div style={{ padding: '20px' }}>
      <h1>Groups Management</h1>
      <p>Click the button below to open the Add Group wizard modal:</p>
      <button
        style={{
          padding: '10px 20px',
          backgroundColor: '#0066cc',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        }}
        onClick={() => navigate('/groups/add-group')}
      >
        Add Group
      </button>
    </div>
  );
};

// Wrapper that renders the actual AddGroupWizard component
const AddGroupWizardWithRouter: React.FC = () => {
  return (
    <MemoryRouter initialEntries={['/groups']}>
      <Routes>
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/add-group" element={<AddGroupWizard />} />
      </Routes>
    </MemoryRouter>
  );
};

// Create spy-enabled MSW handlers for API validation
const createMockHandlersWithSpies = (spies: APISpies = {}) => [
  // Users API for step 3
  http.get('/api/rbac/v1/principals/', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    return HttpResponse.json({
      data: mockUsers.slice(offset, offset + limit),
      meta: { count: mockUsers.length, limit, offset },
    });
  }),

  // Roles API for step 2
  http.get('/api/rbac/v1/roles/', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    return HttpResponse.json({
      data: mockRoles.slice(offset, offset + limit),
      meta: { count: mockRoles.length, limit, offset },
    });
  }),

  // Service accounts API for step 4 (when enabled)
  http.get('/api/rbac/v1/service-accounts/', ({ request }) => {
    const url = new URL(request.url);
    const limit = parseInt(url.searchParams.get('limit') || '20');
    const offset = parseInt(url.searchParams.get('offset') || '0');

    return HttpResponse.json({
      data: mockServiceAccounts.slice(offset, offset + limit),
      meta: { count: mockServiceAccounts.length, limit, offset },
    });
  }),

  // Group validation API - for checking if group name exists
  http.get('/api/rbac/v1/groups/', ({ request }) => {
    const url = new URL(request.url);
    const name = url.searchParams.get('name');
    const nameMatch = url.searchParams.get('name_match');

    if (nameMatch === 'exact' && name) {
      return HttpResponse.json({
        data: [], // Empty array means name is available
        meta: { count: 0, limit: 10, offset: 0 },
      });
    }
    return HttpResponse.json({
      data: [],
      meta: { count: 0, limit: 20, offset: 0 },
    });
  }),

  // Group creation API
  http.post('/api/rbac/v1/groups/', async ({ request }) => {
    const body = (await request.json()) as any;

    // Call spy function if provided
    if (spies?.groupCreationSpy) {
      spies.groupCreationSpy(body);
    }

    // Validate required fields
    if (!body.name) {
      return new HttpResponse(JSON.stringify({ error: 'Group name is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return HttpResponse.json({
      uuid: 'new-group-uuid',
      name: body.name,
      description: body.description || '',
      platform_default: false,
      admin_default: false,
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      principalCount: body.user_list?.length || 0,
      roleCount: body.roles_list?.length || 0,
    });
  }),

  // Role assignment API - assign roles to group
  http.post('/api/rbac/v1/groups/:groupId/roles/', async ({ request, params }) => {
    const body = (await request.json()) as any;
    // Role Assignment API Called

    // Call spy function if provided
    if (spies?.roleAssignmentSpy) {
      spies.roleAssignmentSpy(params.groupId, body);
    }

    return HttpResponse.json({ message: 'Roles assigned successfully' });
  }),

  // Principal assignment API - assign users to group
  http.post('/api/rbac/v1/groups/:groupId/principals/', async ({ request, params }) => {
    const body = (await request.json()) as any;
    // Principal Assignment API Called

    // Call spy function if provided
    if (spies?.principalAssignmentSpy) {
      spies.principalAssignmentSpy(params.groupId, body);
    }

    return HttpResponse.json({ message: 'Principals assigned successfully' });
  }),

  // Service account assignment API
  http.post('/api/rbac/v1/groups/:groupId/service-accounts/', () => {
    return HttpResponse.json({ message: 'Service accounts assigned successfully' });
  }),

  // External service accounts API (SSO endpoint)
  http.get('https://sso.redhat.com/realms/redhat-external/apis/service_accounts/v1', ({ request }) => {
    const url = new URL(request.url);
    const first = parseInt(url.searchParams.get('first') || '0');
    const max = parseInt(url.searchParams.get('max') || '10');

    const slicedAccounts = mockServiceAccounts.slice(first, first + max);
    return HttpResponse.json(slicedAccounts); // Direct array response
  }),
];

// Default handlers without spies for backward compatibility
const mockHandlers = createMockHandlersWithSpies();

const meta: Meta<typeof AddGroupWizardWithRouter> = {
  component: AddGroupWizardWithRouter,
  tags: [
    'ff:platform.rbac.itless',
    'ff:platform.rbac.workspaces',
    'ff:platform.rbac.group-service-accounts',
    'ff:platform.rbac.group-service-accounts.stable',
    'perm:org-admin',
    'perm:user-access-admin',
  ],
  parameters: {
    msw: {
      handlers: mockHandlers,
    },
    // Ensure consistent feature flags for data loading
    featureFlags: {
      'platform.rbac.itless': true, // Use simpler data loading path
    },
    // Ensure proper permissions for data loading
    permissions: {
      orgAdmin: true,
      userAccessAdministrator: true,
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  tags: ['autodocs'],
  parameters: {
    msw: { handlers: mockHandlers },
    docs: {
      description: {
        story: `
**AddGroupWizard** is the multi-step modal wizard for creating new RBAC groups with role and member assignments.

## Feature Overview

The wizard provides a complete group creation experience with:

- 📝 **Group Details** - Name and description with validation
- 🎭 **Role Assignment** - Select roles to assign to the group
- 👥 **Member Management** - Add users as group members
- 🔍 **Review & Confirm** - Summary before creation
- ✅ **Success Feedback** - Confirmation and navigation

## Wizard Flow (Default Configuration)
1. **Name & Description** - Group name and optional description
2. **Add Roles** - Select roles to assign to the group  
3. **Add Members** - Select users to add as group members
4. **Review** - Review all selections before creating
5. **Success** - Confirmation screen after group creation

## Feature Flag Variations

The wizard adapts based on feature flags:

- **Workspaces Enabled**: Skips roles step entirely - goes from Name → Members → Review
- **Service Accounts Enabled**: Adds service accounts step after members: Name → Roles → Members → Service Accounts → Review

## Additional Test Stories

- **[ServiceAccountsEnabled](?path=/story/features-groups-addgroup-addgroupwizard--service-accounts-enabled)**: 5-step wizard with service accounts feature flag
- **[WorkspacesEnabled](?path=/story/features-groups-addgroup-addgroupwizard--workspaces-enabled)**: 3-step wizard with roles step skipped (workspaces mode)  
- **[FormValidation](?path=/story/features-groups-addgroup-addgroupwizard--form-validation)**: Name validation and error handling
- **[CancelWarning](?path=/story/features-groups-addgroup-addgroupwizard--cancel-warning)**: Cancel functionality testing
- **[FullWizardFlow](?path=/story/features-groups-addgroup-addgroupwizard--full-wizard-flow)**: Complete wizard navigation simulation
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test basic page structure and button presence
    expect(await canvas.findByRole('heading', { name: 'Groups Management' })).toBeInTheDocument();
    expect(await canvas.findByRole('button', { name: 'Add Group' })).toBeInTheDocument();

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Verify the wizard has rendered using specific selector (same approach as other tests)
    await waitFor(
      async () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );
  },
};

export const ServiceAccountsEnabled: Story = {
  parameters: {
    msw: { handlers: mockHandlers },
    featureFlags: {
      'platform.rbac.workspaces': false,
      'platform.rbac.group-service-accounts': true,
      'platform.rbac.group-service-accounts.stable': true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Wait for wizard to load
    await waitFor(
      async () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // KEY TEST: Verify "Add service accounts" step appears in wizard navigation
    // (No need to navigate through the whole wizard - FullWizardFlow covers that)
    await waitFor(
      () => {
        // Check wizard navigation for service accounts step
        const navItems = Array.from(document.querySelectorAll('.pf-v5-c-wizard__nav-link, .pf-v5-c-wizard__toggle-list-item'));
        const hasServiceAccountsStep = navItems.some((item) => item.textContent?.toLowerCase().includes('service account'));

        expect(hasServiceAccountsStep).toBeTruthy();
      },
      { timeout: 5000 },
    );

    // console.log('✅ SERVICE ACCOUNTS ENABLED: Wizard navigation includes service accounts step!');
  },
};

export const WorkspacesEnabled: Story = {
  parameters: {
    msw: { handlers: mockHandlers },
    featureFlags: {
      'platform.rbac.workspaces': true, // Enable workspaces mode
      'platform.rbac.group-service-accounts': false,
      'platform.rbac.group-service-accounts.stable': false,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Wait for wizard to load and verify it opens properly
    const body = within(document.body);
    await waitFor(
      async () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // console.log('✅ WORKSPACES MODE: Wizard opened successfully');

    // Fill name to enable next button
    const nameInput = document.getElementById('group-name') as HTMLInputElement;
    await userEvent.type(nameInput, 'Workspaces Test Group');

    await waitFor(() => {
      expect(nameInput.value).toBe('Workspaces Test Group');
    });

    // Navigate to Step 2 - in workspaces mode this should skip roles step
    const nextButton = await waitFor(
      () => {
        const allNextButtons = body.queryAllByRole('button', { name: /next/i });
        const wizardNextButton = allNextButtons.find((btn) => {
          const isNotPagination = !btn.closest('.pf-v5-c-pagination');
          const isEnabled = !btn.hasAttribute('disabled') && btn.getAttribute('aria-disabled') !== 'true';
          return isNotPagination && isEnabled;
        });
        expect(wizardNextButton).toBeTruthy();
        return wizardNextButton!;
      },
      { timeout: 5000 },
    );

    await userEvent.click(nextButton);

    // Verify we progressed to Members step (should skip roles in workspaces mode)
    await waitFor(
      () => {
        // Look specifically for the step title using document.querySelector
        const stepTitle = document.querySelector('h1[class*="pf-v5-c-title"]');
        expect(stepTitle).toBeTruthy();
        expect(stepTitle?.textContent?.toLowerCase()).toContain('member');
      },
      { timeout: 5000 },
    );

    // console.log('✅ WORKSPACES MODE: Successfully tested step progression (roles step skipped)');
  },
};

export const FormValidation: Story = {
  parameters: {
    msw: { handlers: mockHandlers },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Wait for wizard to fully load
    const body = within(document.body);
    await waitFor(
      async () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    const nameInput = document.getElementById('group-name') as HTMLInputElement;
    const nextButton = await body.findByRole('button', { name: /next/i });

    // Test 1: Try to proceed without name (should be disabled or show validation)
    expect(nameInput.value).toBe('');

    // Next button should be disabled when name is empty (required field)
    const isDisabled =
      nextButton.hasAttribute('disabled') || nextButton.getAttribute('aria-disabled') === 'true' || nextButton.classList.contains('pf-m-disabled');

    if (!isDisabled) {
      // If not disabled, clicking should not navigate (validation prevents it)
      await userEvent.click(nextButton);
      // Should still be on name step
      await waitFor(() => {
        expect(nameInput).toBeInTheDocument();
        expect(body.queryByText(/add roles|add members/i)).not.toBeInTheDocument();
      });
    }

    // Test 2: Enter valid name
    await userEvent.type(nameInput, 'Valid Group Name');

    await waitFor(() => {
      expect(nameInput.value).toBe('Valid Group Name');
    });

    // Test 3: Now navigation should work
    await waitFor(
      () => {
        expect(nextButton).not.toBeDisabled();
      },
      { timeout: 5000 },
    );

    await userEvent.click(nextButton);

    // Should progress to next step in wizard
    await waitFor(
      () => {
        // Check for progress - any step-related content
        const progressElements = body.queryAllByText(/role/i).concat(body.queryAllByText(/member/i));
        expect(progressElements.length).toBeGreaterThan(0);
      },
      { timeout: 8000 },
    );

    // Test 4: Description field validation (max 150 characters)
    const descriptionInput = document.getElementById('group-description');
    if (descriptionInput) {
      const longText = 'A'.repeat(151); // 151 characters (over limit)
      await userEvent.type(descriptionInput, longText);

      // Should show validation error or truncate
      await waitFor(() => {
        const currentValue = (descriptionInput as HTMLTextAreaElement).value;
        expect(currentValue.length).toBeLessThanOrEqual(150);
      });
    }

    // console.log('✅ Form validation tests completed!');
  },
};

export const CancelWarning: Story = {
  parameters: {
    msw: { handlers: mockHandlers },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Wait for wizard to load
    const body = within(document.body);
    await waitFor(
      async () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // console.log('✅ CANCEL WARNING: Wizard opened successfully');

    // Fill in some form data to make cancellation meaningful
    const nameInput = document.getElementById('group-name') as HTMLInputElement;
    await userEvent.type(nameInput, 'Cancel Test Group');

    await waitFor(() => {
      expect(nameInput.value).toBe('Cancel Test Group');
    });

    // Find and test that Cancel button exists and is functional
    const cancelButton = await waitFor(
      () => {
        const allCancelButtons = body.queryAllByRole('button', { name: /cancel/i });
        const wizardCancelButton = allCancelButtons.find((btn) => !btn.hasAttribute('disabled'));
        expect(wizardCancelButton).toBeTruthy();
        return wizardCancelButton!;
      },
      { timeout: 5000 },
    );

    // Click the cancel button
    await userEvent.click(cancelButton);

    // Verify the warning dialog appears with the correct content
    await waitFor(
      () => {
        const warningDialog = body.queryByText(/exit group creation/i);
        const warningMessage = body.queryByText(/all unsaved changes will be lost/i);
        const confirmMessage = body.queryByText(/are you sure you want to exit/i);

        expect(warningDialog).toBeTruthy();
        expect(warningMessage).toBeTruthy();
        expect(confirmMessage).toBeTruthy();
      },
      { timeout: 5000 },
    );

    // console.log('✅ CANCEL WARNING: Warning dialog appeared with correct content');

    // Find and click the "Exit" button in the warning dialog
    const exitButton = await waitFor(
      () => {
        const exitBtn =
          body.queryByRole('button', { name: /exit/i }) ||
          body.queryByRole('button', { name: /confirm/i }) ||
          body
            .queryAllByRole('button')
            .find((btn) => btn.textContent?.toLowerCase().includes('exit') || btn.textContent?.toLowerCase().includes('yes'));
        expect(exitBtn).toBeTruthy();
        return exitBtn!;
      },
      { timeout: 3000 },
    );

    // Click the exit button to confirm cancellation
    await userEvent.click(exitButton);

    // Verify the wizard closes (the key behavior we're testing)
    await waitFor(
      () => {
        const wizardClosed = !document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        expect(wizardClosed).toBeTruthy();
      },
      { timeout: 5000 },
    );

    // Additional verification: wizard is gone from DOM
    const wizardStillExists = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
    expect(wizardStillExists).toBeNull();

    // console.log('✅ CANCEL WARNING: Wizard closed successfully after confirming exit');

    // console.log('✅ CANCEL WARNING: Successfully tested cancel functionality');
  },
};

// Create story-specific spies that can be accessed in both parameters and play function
const createFullWizardFlowSpies = (): APISpies => ({
  groupCreationSpy: fn(),
  roleAssignmentSpy: fn(),
  principalAssignmentSpy: fn(),
});

const fullWizardFlowSpies = createFullWizardFlowSpies();

export const FullWizardFlow: Story = {
  parameters: {
    msw: {
      handlers: createMockHandlersWithSpies(fullWizardFlowSpies),
    },
    featureFlags: {
      'platform.rbac.workspaces': false,
      'platform.rbac.group-service-accounts': true,
      'platform.rbac.group-service-accounts.stable': true,
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Navigate to wizard
    const addButton = await canvas.findByRole('button', { name: 'Add Group' });
    await userEvent.click(addButton);

    // Wait for wizard to load
    await waitFor(
      async () => {
        const wizardElement = document.querySelector('[data-ouia-component-id="add-group-wizard"]');
        const nameInput = document.getElementById('group-name');
        expect(wizardElement).toBeInTheDocument();
        expect(nameInput).toBeInTheDocument();
      },
      { timeout: 5000 },
    );

    // Use the reusable helper with API spies for comprehensive validation
    await fillAddGroupWizardForm(
      {
        name: 'Complete Test Group',
        description: 'Testing full wizard flow',
        selectRoles: true,
        selectUsers: true,
        selectServiceAccounts: true, // Test service accounts since they're enabled
      },
      fullWizardFlowSpies,
    );

    console.log('✅ Full wizard flow completed with all API validations!');
  },
};
