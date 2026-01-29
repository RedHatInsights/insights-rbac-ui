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
- Simple read-only view for organization-level access management

## Component Responsibilities
- Renders organization-wide access page title and description
- Displays placeholder organization information
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

    // Test that placeholder values are shown
    const naElements = canvas.getAllByText('N/A');
    expect(naElements).toHaveLength(3); // Three N/A placeholders
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

    // Verify all placeholder values
    const naValues = canvas.getAllByText('N/A');
    expect(naValues).toHaveLength(3);

    // Each organization detail should have a label and N/A value
    naValues.forEach((naElement) => {
      expect(naElement).toBeInTheDocument();
    });
  },
};
