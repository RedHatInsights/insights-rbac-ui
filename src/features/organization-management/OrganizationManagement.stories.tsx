import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { OrganizationManagement } from './OrganizationManagement';

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
- Shows organization details (name, account number, organization ID)
- Displays RoleAssignmentsTable for organization-level role bindings
- Fetches organization data from Chrome auth service
- Supports pagination, sorting, and filtering of role assignments

## Component Responsibilities
- Renders organization-wide access page title and description
- Fetches and displays organization information (name, account number, organization ID)
- Manages table state (pagination, sorting, filtering) for role assignments
- Fetches organization-level role bindings data
- Provides comprehensive role assignment management interface
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

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that the main page title is rendered
    await expect(canvas.findByRole('heading', { name: 'Organization-Wide Access' })).resolves.toBeInTheDocument();

    // Test that the subtitle text is present
    await expect(canvas.findByText('Grant organization-level access to users and groups.')).resolves.toBeInTheDocument();

    // Test that organization details section is rendered
    await expect(canvas.findByText('Organization name:')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Account number:')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Organization ID:')).resolves.toBeInTheDocument();

    // Test that the RoleAssignmentsTable is rendered
    await expect(canvas.findByRole('table')).resolves.toBeInTheDocument();

    // Test that organization data is shown (placeholder or real data)
    await expect(canvas.findByText('Red Hat Organization')).resolves.toBeInTheDocument();
  },
};

export const AccessibilityCheck: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test semantic structure
    await expect(canvas.findByRole('heading')).resolves.toBeInTheDocument();

    // Test that content is properly structured with paragraphs
    const organizationDetails = canvas.getAllByText(/Organization name:|Account number:|Organization ID:/);
    expect(organizationDetails).toHaveLength(3);

    // Verify proper text content structure
    await expect(canvas.findByText(/Organization name:/)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Account number:/)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Organization ID:/)).resolves.toBeInTheDocument();
  },
};

export const ContentValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify main heading content
    const heading = await canvas.findByRole('heading', { name: 'Organization-Wide Access' });
    expect(heading).toBeInTheDocument();

    // Verify subtitle content
    const subtitle = await canvas.findByText('Grant organization-level access to users and groups.');
    expect(subtitle).toBeInTheDocument();

    // Verify organization details structure
    const organizationSection = canvas.getByText('Organization name:').closest('div');
    expect(organizationSection).toBeInTheDocument();

    // Verify table is present for role assignments
    const table = await canvas.findByRole('table');
    expect(table).toBeInTheDocument();

    // Verify organization name is displayed (placeholder data)
    const organizationName = await canvas.findByText('Red Hat Organization');
    expect(organizationName).toBeInTheDocument();
  },
};
