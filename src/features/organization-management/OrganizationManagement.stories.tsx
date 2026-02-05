import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, waitFor, within } from 'storybook/test';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { OrganizationManagement } from './OrganizationManagement';
import { ChromeUser } from '@redhat-cloud-services/types';
import { ChromeProvider } from '../../../.storybook/context-providers';
import { HttpResponse, http } from 'msw';

// Chrome context mock factory for DRY setup
const createChromeConfig = (userData: ChromeUser) => ({
  environment: 'prod' as const,
  auth: {
    getUser: () => Promise.resolve(userData),
    getToken: () => Promise.resolve('mock-jwt-token-12345'),
  },
});

// Base ChromeUser template for DRY mock data
const baseChromeUser: ChromeUser = {
  identity: {
    org_id: 'org-base',
    type: 'User',
    user: {
      username: 'testuser',
      email: 'test@redhat.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
      is_internal: false,
      is_org_admin: false,
      locale: 'en_US',
    },
  },
  entitlements: {},
};

// Helper to create ChromeUser variations
const withIdentity = (overrides: Partial<ChromeUser['identity']>): ChromeUser => ({
  ...baseChromeUser,
  identity: { ...baseChromeUser.identity, ...overrides },
});

// Mock Chrome user data for testing different scenarios
const mockChromeUserWithAllData = withIdentity({
  account_number: '123456789',
  org_id: 'org-987654321',
  organization: { name: 'Red Hat Test Organization' },
  user: { ...baseChromeUser.identity.user!, is_org_admin: true },
});

const mockChromeUserPartialData = withIdentity({
  org_id: 'org-987654321',
  user: { ...baseChromeUser.identity.user!, is_org_admin: true },
});

const mockChromeUserMinimal = withIdentity({
  org_id: 'org-minimal',
});

// Mock role bindings API response data matching OpenAPI spec
const mockRoleBindingsResponse = {
  meta: {
    limit: 20, // Only limit is available in cursor-based pagination
  },
  links: {
    next: null,
    previous: null,
  },
  data: [
    {
      last_modified: '2024-08-04T12:00:00Z',
      subject: {
        id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
        type: 'group',
        group: {
          name: 'Engineering Team',
          description: 'Development and engineering team with full access',
          user_count: 25,
        },
      },
      roles: [
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          name: 'Organization Admin',
          description: 'Full administrative access to organization resources',
          permissions_count: 12,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440003',
          name: 'Workspace Creator',
          description: 'Can create and manage workspaces',
          permissions_count: 6,
        },
      ],
      resource: {
        id: 'org-987654321',
        name: 'Red Hat Test Organization',
        type: 'organization',
      },
    },
    {
      last_modified: '2024-08-03T10:30:00Z',
      subject: {
        id: '7b2c8d5e-4a1b-4c6d-9e8f-3a2b1c0d9e8f',
        type: 'group',
        group: {
          name: 'Quality Assurance',
          description: 'QA team responsible for testing and validation',
          user_count: 12,
        },
      },
      roles: [
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          name: 'Organization Viewer',
          description: 'Read-only access to organization resources',
          permissions_count: 3,
        },
      ],
      resource: {
        id: 'org-987654321',
        name: 'Red Hat Test Organization',
        type: 'organization',
      },
    },
    {
      last_modified: '2024-08-02T14:15:00Z',
      subject: {
        id: '9f1e2d3c-5b4a-6978-8c7d-1e2f3a4b5c6d',
        type: 'group',
        group: {
          name: 'Product Management',
          description: 'Product strategy and roadmap management',
          user_count: 8,
        },
      },
      roles: [
        {
          id: '550e8400-e29b-41d4-a716-446655440005',
          name: 'Resource Manager',
          description: 'Can manage specific organizational resources',
          permissions_count: 9,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          name: 'Organization Viewer',
          description: 'Read-only access to organization resources',
          permissions_count: 3,
        },
      ],
      resource: {
        id: 'org-987654321',
        name: 'Red Hat Test Organization',
        type: 'organization',
      },
    },
    {
      last_modified: '2024-08-01T16:45:00Z',
      subject: {
        id: '4e5f6a7b-8c9d-4e3f-a2b1-9c8d7e6f5a4b',
        type: 'group',
        group: {
          name: 'Security Team',
          description: 'Information security and compliance team',
          user_count: 6,
        },
      },
      roles: [
        {
          id: '550e8400-e29b-41d4-a716-446655440006',
          name: 'Security Auditor',
          description: 'Can audit and review security configurations',
          permissions_count: 7,
        },
      ],
      resource: {
        id: 'org-987654321',
        name: 'Red Hat Test Organization',
        type: 'organization',
      },
    },
    {
      last_modified: '2024-07-30T09:20:00Z',
      subject: {
        id: '1a2b3c4d-5e6f-4789-a123-b456c789d012',
        type: 'group',
        group: {
          name: 'Customer Support',
          description: 'Customer support and technical assistance team',
          user_count: 18,
        },
      },
      roles: [
        {
          id: '550e8400-e29b-41d4-a716-446655440007',
          name: 'Support Agent',
          description: 'Can access customer data for support purposes',
          permissions_count: 5,
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440004',
          name: 'Organization Viewer',
          description: 'Read-only access to organization resources',
          permissions_count: 3,
        },
      ],
      resource: {
        id: 'org-987654321',
        name: 'Red Hat Test Organization',
        type: 'organization',
      },
    },
  ],
};

// API handler factory for DRY mock setup
const createRoleBindingsMockHandler = (responseData: typeof mockRoleBindingsResponse) =>
  http.get('*/api/rbac/v2/role-bindings/by-subject/', () => HttpResponse.json(responseData));

const meta: Meta<typeof OrganizationManagement> = {
  component: OrganizationManagement,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The OrganizationManagement component provides the organization-wide access page.

## Features
- Displays PageHeader with title and subtitle
- Shows organization details (name, account number, organization ID) from ChromeUser data
- Displays RoleAssignmentsTable for organization-level role bindings
- Fetches organization data from Chrome auth service
- Supports pagination, sorting, and filtering of role assignments
- Conditionally renders organization information when available

## Component Responsibilities
- Renders organization-wide access page title and description
- Fetches and displays organization information (name, account number, organization ID)
- Manages table state (pagination, sorting, filtering) for role assignments
- Fetches organization-level role bindings data
- Provides comprehensive role assignment management interface
- Conditionally shows/hides elements based on data availability
`,
      },
    },
    msw: {
      handlers: [createRoleBindingsMockHandler(mockRoleBindingsResponse)],
    },
  },
  decorators: [
    (Story, context) => {
      const chromeConfig = context.parameters?.chromeConfig || createChromeConfig(mockChromeUserMinimal);
      return (
        <MemoryRouter>
          <ChromeProvider value={chromeConfig}>
            <Story />
          </ChromeProvider>
        </MemoryRouter>
      );
    },
  ],
};

export default meta;
type Story = StoryObj<typeof OrganizationManagement>;

// Helper functions for story parameters
const withRoleBindings = (response: typeof mockRoleBindingsResponse) => ({
  msw: { handlers: [createRoleBindingsMockHandler(response)] },
});

const withStoryDescription = (story: string) => ({
  docs: { description: { story } },
});

// Shared expectation helper
type OrgExpectations = {
  name?: string | null;
  account?: string | null;
  orgId: string;
};

const expectOrgDetails = async (canvas: ReturnType<typeof within>, exp: OrgExpectations) => {
  // Always expect the main heading
  await expect(canvas.findByRole('heading', { name: 'Organization-Wide Access' })).resolves.toBeInTheDocument();

  // Wait for org ID to appear (this indicates useEffect has run)
  await expect(canvas.findByText(exp.orgId)).resolves.toBeInTheDocument();

  // Organization name is only shown when available from ChromeUser
  if (exp.name) {
    await expect(canvas.findByText('Organization name:')).resolves.toBeInTheDocument();
    await expect(canvas.findByText(exp.name)).resolves.toBeInTheDocument();
  } else {
    // If no organization name, the section should not be rendered at all
    await waitFor(() => {
      expect(canvas.queryByText('Organization name:')).not.toBeInTheDocument();
    });
  }

  // Check account number
  if (exp.account) {
    await expect(canvas.findByText('Account number:')).resolves.toBeInTheDocument();
    await expect(canvas.findByText(exp.account)).resolves.toBeInTheDocument();
  } else {
    await waitFor(() => {
      expect(canvas.queryByText('Account number:')).not.toBeInTheDocument();
    });
  }

  // Always check that org ID is present
  await expect(canvas.findByText('Organization ID:')).resolves.toBeInTheDocument();
};

export const Default: Story = {
  parameters: {
    chromeConfig: createChromeConfig(mockChromeUserMinimal),
    docs: {
      description: {
        story: 'Default state with minimal organization data and empty role bindings table.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test main page structure
    await expect(canvas.findByRole('heading', { name: 'Organization-Wide Access' })).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Grant organization-level access to users and groups.')).resolves.toBeInTheDocument();

    // Test minimal organization data scenario
    await expectOrgDetails(canvas, {
      orgId: 'org-minimal',
      name: null,
      account: null,
    });

    // Wait for table to render (should be empty in default state) - PatternFly uses 'grid' role
    await waitFor(() => {
      const table = canvas.getByRole('grid');
      expect(table).toBeInTheDocument();
    });
  },
};

export const WithFullOrganizationData: Story = {
  parameters: {
    chromeConfig: createChromeConfig(mockChromeUserWithAllData),
    msw: {
      handlers: [createRoleBindingsMockHandler(mockRoleBindingsResponse)],
    },
    docs: {
      description: {
        story: 'Organization page with complete organization information and populated role bindings table.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test page structure
    await expect(canvas.findByRole('heading', { name: 'Organization-Wide Access' })).resolves.toBeInTheDocument();

    // Test full organization data scenario
    await expectOrgDetails(canvas, {
      name: 'Red Hat Test Organization', // From mockChromeUserWithAllData
      account: '123456789',
      orgId: 'org-987654321',
    });

    // Wait for role bindings table to load - PatternFly uses 'grid' role for interactive tables
    await waitFor(() => {
      const table = canvas.getByRole('grid');
      expect(table).toBeInTheDocument();
    });

    // Test that role bindings data is displayed
    await waitFor(() => {
      // Check that table rows are present (header + 5 data rows)
      const rows = canvas.getAllByRole('row');
      expect(rows).toHaveLength(6); // 1 header + 5 data rows
    });

    // Test specific group data from our mock
    await expect(canvas.findByText('Engineering Team')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Quality Assurance')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Product Management')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Security Team')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Customer Support')).resolves.toBeInTheDocument();

    // Test member counts are displayed correctly
    await expect(canvas.findByText('25')).resolves.toBeInTheDocument(); // Engineering Team members
    await expect(canvas.findByText('12')).resolves.toBeInTheDocument(); // QA team members
  },
};

export const WithPartialOrganizationData: Story = {
  parameters: {
    chromeConfig: createChromeConfig(mockChromeUserPartialData),
    docs: {
      description: {
        story: 'Organization page with partial organization information (missing name and account).',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test page structure
    await expect(canvas.findByRole('heading', { name: 'Organization-Wide Access' })).resolves.toBeInTheDocument();

    // Test partial organization data scenario
    await expectOrgDetails(canvas, {
      orgId: 'org-987654321',
      name: null,
      account: null,
    });
  },
};

export const AccessibilityCheck: Story = {
  parameters: {
    chromeConfig: createChromeConfig(mockChromeUserWithAllData),
    docs: {
      description: {
        story: 'Accessibility verification for the organization management page.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test semantic structure
    await expect(canvas.findByRole('heading')).resolves.toBeInTheDocument();

    // Wait for organization data to load - component shows actual organization name from ChromeUser
    await expect(canvas.findByText('Red Hat Test Organization')).resolves.toBeInTheDocument();

    // Test that content is properly structured when data is available
    const organizationDetails = canvas.getAllByText(/Organization name:|Account number:|Organization ID:/);
    expect(organizationDetails).toHaveLength(3);

    // Verify proper text content structure
    await expect(canvas.findByText(/Organization name:/)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Account number:/)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Organization ID:/)).resolves.toBeInTheDocument();
  },
};

export const ContentValidation: Story = {
  parameters: {
    chromeConfig: createChromeConfig(mockChromeUserWithAllData),
    docs: {
      description: {
        story: 'Content validation for the organization management page with full organization data.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify subtitle content
    const subtitle = await canvas.findByText('Grant organization-level access to users and groups.');
    expect(subtitle).toBeInTheDocument();

    // Use shared helper to validate all organization content
    await expectOrgDetails(canvas, {
      name: 'Red Hat Test Organization', // From mockChromeUserWithAllData
      account: '123456789',
      orgId: 'org-987654321',
    });

    // Verify organization details structure when data is available
    const organizationSection = canvas.getByText('Organization name:').closest('div');
    expect(organizationSection).toBeInTheDocument();
  },
};

export const WithRoleBindingsTableTest: Story = {
  name: 'Role Bindings Table Functionality',
  parameters: {
    chromeConfig: createChromeConfig(mockChromeUserWithAllData),
    ...withRoleBindings(mockRoleBindingsResponse),
    ...withStoryDescription('Tests the role bindings table functionality with comprehensive mock data.'),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the component to load
    await expect(canvas.findByRole('heading', { name: 'Organization-Wide Access' })).resolves.toBeInTheDocument();

    // Wait for organization data to be loaded first (API calls depend on organizationId)
    await waitFor(() => {
      expect(canvas.getByText('org-987654321')).toBeInTheDocument();
    });

    // Give the component time to fetch and process role bindings data
    await waitFor(
      () => {
        // Check if we have any table content - look for the table grid first
        const tables = canvas.queryAllByRole('grid');
        expect(tables.length).toBeGreaterThan(0);
      },
      { timeout: 15000 },
    );

    // Once we have the table, wait for data to populate
    await waitFor(
      () => {
        // Look for specific data from our mock response
        expect(canvas.getByText('Engineering Team')).toBeInTheDocument();
      },
      { timeout: 10000 },
    );

    // Test table headers are present
    await expect(canvas.findByText('User group')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Description')).resolves.toBeInTheDocument();

    // Now test table functionality - all group names should be visible
    await expect(canvas.findByText('Quality Assurance')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Product Management')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Security Team')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Customer Support')).resolves.toBeInTheDocument();

    // Test that group descriptions are displayed (truncated in table)
    await expect(canvas.findByText(/Development and engi.*/)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/QA team responsible.*/)).resolves.toBeInTheDocument();

    // Test member counts from our mock data
    await expect(canvas.findByText('25')).resolves.toBeInTheDocument(); // Engineering Team
    await expect(canvas.findByText('12')).resolves.toBeInTheDocument(); // Quality Assurance
    await expect(canvas.findByText('8')).resolves.toBeInTheDocument(); // Product Management
    await expect(canvas.findByText('6')).resolves.toBeInTheDocument(); // Security Team
    await expect(canvas.findByText('18')).resolves.toBeInTheDocument(); // Customer Support

    // Test role counts from our mock data - check that values appear in table
    const roleCountElements = canvas.getAllByText('2');
    expect(roleCountElements.length).toBeGreaterThanOrEqual(3); // Engineering Team, Product Management, Customer Support all have 2 roles

    const singleRoleElements = canvas.getAllByText('1');
    expect(singleRoleElements.length).toBeGreaterThanOrEqual(2); // Quality Assurance and Security Team have 1 role

    // Test table structure - check for rows
    const rows = canvas.getAllByRole('row');
    expect(rows.length).toBeGreaterThanOrEqual(6); // 1 header + 5 data rows (may have more due to pagination)

    // Test pagination is present by looking for pagination controls
    const paginationElements = canvas.getAllByText('of');
    expect(paginationElements.length).toBeGreaterThan(0); // Should have pagination "of" text somewhere
  },
};

export const EmptyRoleBindingsState: Story = {
  name: 'Empty Role Bindings Table',
  parameters: {
    chromeConfig: createChromeConfig(mockChromeUserWithAllData),
    msw: {
      handlers: [
        http.get('*/api/rbac/v2/role-bindings/by-subject/', () => {
          return HttpResponse.json({
            meta: { limit: 20 },
            links: { next: null, previous: null },
            data: [],
          });
        }),
      ],
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the component to load
    await expect(canvas.findByRole('heading', { name: 'Organization-Wide Access' })).resolves.toBeInTheDocument();

    // Wait for organization data to load first
    await waitFor(() => {
      expect(canvas.getByText('org-987654321')).toBeInTheDocument();
    });

    // Wait for empty state to appear
    await expect(canvas.findByText('No user group found')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('There is no data to display.')).resolves.toBeInTheDocument();

    // Verify empty state is shown instead of populated table
    expect(canvas.queryByText('Engineering Team')).not.toBeInTheDocument();
    expect(canvas.queryByText('Quality Assurance')).not.toBeInTheDocument();
  },
};

export const ErrorState: Story = {
  parameters: {
    chromeConfig: {
      environment: 'prod' as const,
      auth: {
        getUser: () => Promise.reject(new Error('Network error')),
        getToken: () => Promise.resolve('mock-jwt-token-12345'),
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that the main page title is rendered even with errors
    await expect(canvas.findByRole('heading', { name: 'Organization-Wide Access' })).resolves.toBeInTheDocument();

    // Test that the subtitle text is present
    await expect(canvas.findByText('Grant organization-level access to users and groups.')).resolves.toBeInTheDocument();

    // Test that error message is displayed
    await expect(canvas.findByText('Failed to load organization data')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Error:')).resolves.toBeInTheDocument();

    // Test that no organization details are shown when there's an error
    await waitFor(() => {
      expect(canvas.queryByText('Organization name:')).not.toBeInTheDocument();
      expect(canvas.queryByText('Account number:')).not.toBeInTheDocument();
      expect(canvas.queryByText('Organization ID:')).not.toBeInTheDocument();
    });
  },
};
