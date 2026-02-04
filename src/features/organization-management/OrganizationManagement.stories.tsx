import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, waitFor, within } from 'storybook/test';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { OrganizationManagement } from './OrganizationManagement';
import { ChromeUser } from '@redhat-cloud-services/types';
import { ChromeProvider } from '../../../.storybook/context-providers';

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

  // Check organization name
  if (exp.name) {
    await expect(canvas.findByText('Organization name:')).resolves.toBeInTheDocument();
    await expect(canvas.findByText(exp.name)).resolves.toBeInTheDocument();
  } else {
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
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that the subtitle text is present
    await expect(canvas.findByText('Grant organization-level access to users and groups.')).resolves.toBeInTheDocument();

    // Test minimal organization data scenario
    await expectOrgDetails(canvas, {
      orgId: 'org-minimal',
      name: null,
      account: null,
    });
  },
};

export const WithFullOrganizationData: Story = {
  parameters: {
    chromeConfig: createChromeConfig(mockChromeUserWithAllData),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test full organization data scenario
    await expectOrgDetails(canvas, {
      name: 'Red Hat Test Organization',
      account: '123456789',
      orgId: 'org-987654321',
    });
  },
};

export const WithPartialOrganizationData: Story = {
  parameters: {
    chromeConfig: createChromeConfig(mockChromeUserPartialData),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

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
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test semantic structure
    await expect(canvas.findByRole('heading')).resolves.toBeInTheDocument();

    // Wait for organization data to load and then test accessibility
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
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify subtitle content
    const subtitle = await canvas.findByText('Grant organization-level access to users and groups.');
    expect(subtitle).toBeInTheDocument();

    // Use shared helper to validate all organization content
    await expectOrgDetails(canvas, {
      name: 'Red Hat Test Organization',
      account: '123456789',
      orgId: 'org-987654321',
    });

    // Verify organization details structure when data is available
    const organizationSection = canvas.getByText('Organization name:').closest('div');
    expect(organizationSection).toBeInTheDocument();
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
