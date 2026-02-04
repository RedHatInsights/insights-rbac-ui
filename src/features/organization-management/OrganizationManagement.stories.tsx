import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { OrganizationManagement } from './OrganizationManagement';
import { ChromeUser } from '@redhat-cloud-services/types';

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
- Conditionally renders organization information when available
- Simple read-only view for organization-level access management

## Component Responsibilities
- Renders organization-wide access page title and description
- Displays real organization information from ChromeUser identity
- Conditionally shows/hides elements based on data availability
- Provides foundation for future organization access management features
`,
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof OrganizationManagement>;

// Mock Chrome user data for testing different scenarios
const mockChromeUserWithAllData: ChromeUser = {
  identity: {
    account_number: '123456789',
    org_id: 'org-987654321',
    type: 'User',
    organization: {
      name: 'Red Hat Test Organization',
    },
    user: {
      username: 'testuser',
      email: 'test@redhat.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
      is_internal: false,
      is_org_admin: true,
      locale: 'en_US',
    },
  },
  entitlements: {},
};

const mockChromeUserPartialData: ChromeUser = {
  identity: {
    org_id: 'org-987654321',
    type: 'User',
    user: {
      username: 'testuser',
      email: 'test@redhat.com',
      first_name: 'Test',
      last_name: 'User',
      is_active: true,
      is_internal: false,
      is_org_admin: true,
      locale: 'en_US',
    },
  },
  entitlements: {},
};

const mockChromeUserNoData: ChromeUser = {
  identity: {
    org_id: 'org-minimal',
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

export const Default: Story = {
  parameters: {
    mockData: [
      {
        url: 'http://localhost:8002/beta/chrome/user-identity',
        method: 'GET',
        status: 200,
        response: mockChromeUserNoData,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that the main page title is rendered
    await expect(canvas.findByRole('heading', { name: 'Organization-Wide Access' })).resolves.toBeInTheDocument();

    // Test that the subtitle text is present
    await expect(canvas.findByText('Grant organization-level access to users and groups.')).resolves.toBeInTheDocument();

    // When minimal organization data is available, some elements should be hidden
    // Wait a moment for useEffect to run
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test that unavailable data is not shown
    expect(canvas.queryByText('Organization name:')).not.toBeInTheDocument();
    expect(canvas.queryByText('Account number:')).not.toBeInTheDocument();

    // Test that available data is shown
    await expect(canvas.findByText('Organization ID:')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('org-minimal')).resolves.toBeInTheDocument();
  },
};

export const WithFullOrganizationData: Story = {
  parameters: {
    mockData: [
      {
        url: 'http://localhost:8002/beta/chrome/user-identity',
        method: 'GET',
        status: 200,
        response: mockChromeUserWithAllData,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that the main page title is rendered
    await expect(canvas.findByRole('heading', { name: 'Organization-Wide Access' })).resolves.toBeInTheDocument();

    // Wait a moment for useEffect to run and data to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test that all organization details are shown when data is available
    await expect(canvas.findByText('Organization name:')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Red Hat Test Organization')).resolves.toBeInTheDocument();

    await expect(canvas.findByText('Account number:')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('123456789')).resolves.toBeInTheDocument();

    await expect(canvas.findByText('Organization ID:')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('org-987654321')).resolves.toBeInTheDocument();
  },
};

export const WithPartialOrganizationData: Story = {
  parameters: {
    mockData: [
      {
        url: 'http://localhost:8002/beta/chrome/user-identity',
        method: 'GET',
        status: 200,
        response: mockChromeUserPartialData,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that the main page title is rendered
    await expect(canvas.findByRole('heading', { name: 'Organization-Wide Access' })).resolves.toBeInTheDocument();

    // Wait a moment for useEffect to run and data to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test that only available organization details are shown
    expect(canvas.queryByText('Organization name:')).not.toBeInTheDocument(); // No org name
    expect(canvas.queryByText('Account number:')).not.toBeInTheDocument(); // No account number

    await expect(canvas.findByText('Organization ID:')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('org-987654321')).resolves.toBeInTheDocument();
  },
};

export const AccessibilityCheck: Story = {
  parameters: {
    mockData: [
      {
        url: 'http://localhost:8002/beta/chrome/user-identity',
        method: 'GET',
        status: 200,
        response: mockChromeUserWithAllData,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test semantic structure
    await expect(canvas.findByRole('heading')).resolves.toBeInTheDocument();

    // Wait for data to load
    await new Promise((resolve) => setTimeout(resolve, 100));

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
    mockData: [
      {
        url: 'http://localhost:8002/beta/chrome/user-identity',
        method: 'GET',
        status: 200,
        response: mockChromeUserWithAllData,
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify main heading content
    const heading = await canvas.findByRole('heading', { name: 'Organization-Wide Access' });
    expect(heading).toBeInTheDocument();

    // Verify subtitle content
    const subtitle = await canvas.findByText('Grant organization-level access to users and groups.');
    expect(subtitle).toBeInTheDocument();

    // Wait for data to load
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify organization details structure when data is available
    const organizationSection = canvas.getByText('Organization name:').closest('div');
    expect(organizationSection).toBeInTheDocument();

    // Verify all organization data values are displayed
    await expect(canvas.findByText('Red Hat Test Organization')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('123456789')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('org-987654321')).resolves.toBeInTheDocument();

    // Each organization detail should have a label and actual value
    await expect(canvas.findByText('Organization name:')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Account number:')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Organization ID:')).resolves.toBeInTheDocument();
  },
};
