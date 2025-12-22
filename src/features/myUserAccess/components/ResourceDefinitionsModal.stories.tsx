import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { expect, userEvent, within } from 'storybook/test';
import { screen } from 'storybook/test';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { ResourceDefinitionsModal } from './ResourceDefinitionsModal';
import type { ResourceDefinition } from '../types';

// Mock resource definitions data
const mockResourceDefinitions = [
  {
    attributeFilter: {
      value: 'insights.advisor.cluster_id:cluster-123',
    },
  },
  {
    attributeFilter: {
      value: 'insights.advisor.source:advisor',
    },
  },
  {
    attributeFilter: {
      value: 'insights.advisor.environment:production',
    },
  },
  {
    attributeFilter: {
      value: 'insights.compliance.policy_id:policy-456',
    },
  },
  {
    attributeFilter: {
      value: 'insights.compliance.profile:pci-dss',
    },
  },
  {
    attributeFilter: {
      value: 'insights.vulnerability.cve:CVE-2023-1234',
    },
  },
];

const emptyResourceDefinitions: ResourceDefinition[] = [];

// Modal Wrapper Component for Testing
const ModalWrapper = ({ permission, resourceDefinitions }: { permission: string; resourceDefinitions: any[] }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setIsOpen(true)}>Open Modal</Button>
      <ResourceDefinitionsModal
        isOpen={isOpen}
        handleClose={() => setIsOpen(false)}
        permission={permission}
        resourceDefinitions={resourceDefinitions}
      />
    </>
  );
};

ModalWrapper.propTypes = {
  permission: PropTypes.string.isRequired,
  resourceDefinitions: PropTypes.arrayOf(PropTypes.object).isRequired,
};

const meta: Meta<typeof ModalWrapper> = {
  component: ModalWrapper,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
**ResourceDefinitionsModal** displays resource definitions for a specific permission in a modal dialog. It provides a searchable table view of resource definition values with filtering and pagination capabilities.

## Features
- **Modal Dialog**: Uses PatternFly Modal with large variant for spacious display
- **Searchable Table**: TableView with built-in filtering capabilities
- **Permission Context**: Shows permission name in modal description with formatted message
- **Dynamic Content**: Handles empty states and variable numbers of resource definitions
- **Pagination**: Built-in pagination support for large resource definition lists

## Resource Definition Structure
Each resource definition has an \`attributeFilter\` with a \`value\` string that represents the actual resource constraint (e.g., \`insights.advisor.cluster_id:cluster-123\`).

## Modal Testing Pattern
This story uses a wrapper with a simple button to open the modal, following Storybook modal testing best practices. The modal renders to \`document.body\` and should be tested using \`screen.getByRole('dialog')\`.
        `,
      },
    },
  },
};

export default meta;

type Story = StoryObj<typeof ModalWrapper>;

export const Default: Story = {
  args: {
    permission: 'advisor:systems:read',
    resourceDefinitions: mockResourceDefinitions,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click the button to open modal
    const openButton = await canvas.findByRole('button', { name: /open modal/i });
    await userEvent.click(openButton);

    // Modal renders to document.body, so use screen
    const modal = await screen.findByRole('dialog');
    expect(modal).toBeInTheDocument();

    // Check modal content
    expect(await within(modal).findByText('Resource definitions')).toBeInTheDocument();

    // Check permission display
    expect(await within(modal).findByText(/advisor:systems:read/)).toBeInTheDocument();

    // Check resource definitions are shown
    expect(await within(modal).findByText('insights.advisor.cluster_id:cluster-123')).toBeInTheDocument();
    expect(await within(modal).findByText('insights.advisor.source:advisor')).toBeInTheDocument();

    // Close the modal using the primary close button (not the X button)
    // Find button by text content instead of aria-label
    const closeButton = await within(modal).findByText('Close');
    await userEvent.click(closeButton);
  },
};

export const DifferentPermission: Story = {
  args: {
    permission: 'compliance:policies:write',
    resourceDefinitions: [
      {
        attributeFilter: {
          value: 'insights.compliance.policy_id:policy-456',
        },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click the button to open modal
    const openButton = await canvas.findByRole('button', { name: /open modal/i });
    await userEvent.click(openButton);

    // Modal renders to document.body
    const modal = await screen.findByRole('dialog');

    // Check different permission is displayed
    expect(await within(modal).findByText(/compliance:policies:write/)).toBeInTheDocument();

    // Check specific resource definition
    expect(await within(modal).findByText('insights.compliance.policy_id:policy-456')).toBeInTheDocument();
  },
};

export const VulnerabilityPermission: Story = {
  args: {
    permission: 'vulnerability:reports:read',
    resourceDefinitions: [
      {
        attributeFilter: {
          value: 'insights.vulnerability.cve:CVE-2023-1234',
        },
      },
    ],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click the button to open modal
    const openButton = await canvas.findByRole('button', { name: /open modal/i });
    await userEvent.click(openButton);

    // Modal renders to document.body
    const modal = await screen.findByRole('dialog');

    // Check vulnerability permission is displayed
    expect(await within(modal).findByText(/vulnerability:reports:read/)).toBeInTheDocument();

    // Should show table or no data message
    expect(await within(modal).findByRole('grid')).toBeInTheDocument();
  },
};

export const WithFiltering: Story = {
  args: {
    permission: 'advisor:systems:read',
    resourceDefinitions: mockResourceDefinitions,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click the button to open modal
    const openButton = await canvas.findByRole('button', { name: /open modal/i });
    await userEvent.click(openButton);

    // Modal renders to document.body
    const modal = await screen.findByRole('dialog');

    // Should show the table
    expect(await within(modal).findByRole('grid')).toBeInTheDocument();

    // Check multiple resource definitions are shown initially
    expect(await within(modal).findByText('insights.advisor.cluster_id:cluster-123')).toBeInTheDocument();
  },
};

export const EmptyState: Story = {
  args: {
    permission: 'cost-management:aws:organization:account:cost-model:read',
    resourceDefinitions: emptyResourceDefinitions,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Click the button to open modal
    const openButton = await canvas.findByRole('button', { name: /open modal/i });
    await userEvent.click(openButton);

    // Modal renders to document.body
    const modal = await screen.findByRole('dialog');

    // Check permission display
    expect(await within(modal).findAllByText(/cost-management:aws:organization:account:cost-model:read/)).toHaveLength(2);

    // Check that it shows empty state - no resource definitions table
    expect(await within(modal).findByText('No resource definitions')).toBeInTheDocument();
  },
};
