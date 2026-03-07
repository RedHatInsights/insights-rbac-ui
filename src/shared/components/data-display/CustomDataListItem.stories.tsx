import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import CloudIcon from '@patternfly/react-icons/dist/js/icons/cloud-icon';
import DatabaseIcon from '@patternfly/react-icons/dist/js/icons/database-icon';
import ServerIcon from '@patternfly/react-icons/dist/js/icons/server-icon';
import CustomDataListItem from './CustomDataListItem';

const meta: Meta<typeof CustomDataListItem> = {
  component: CustomDataListItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
CustomDataListItem component that provides an expandable data list item with icon, heading, and optional link.
- Uses PatternFly DataList components for consistent styling
- Supports expandable content with toggle functionality
- Includes optional link action in the header
- Flexible icon and content rendering
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '800px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof CustomDataListItem>;

export const Default: Story = {
  args: {
    icon: <CloudIcon />,
    heading: 'Cloud Infrastructure',
    expandableContent: (
      <div>
        <p>This is the expandable content for the cloud infrastructure item.</p>
        <p>It can contain any React components and will be shown when the item is expanded.</p>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check that the heading is displayed
    const heading = canvas.getByText('Cloud Infrastructure');
    expect(heading).toBeInTheDocument();

    // Check that the toggle button is present (DataListToggle)
    const toggle = canvas.getByRole('button', { name: /details/i });
    expect(toggle).toBeInTheDocument();

    // Initially should be collapsed
    const content = canvas.queryByText('This is the expandable content');
    expect(content).not.toBeInTheDocument();
  },
};

export const WithLink: Story = {
  args: {
    icon: <DatabaseIcon />,
    heading: 'Database Management',
    linkTitle: 'View Details',
    linkTarget: 'https://example.com/database',
    expandableContent: (
      <div>
        <p>Database management system details and configuration options.</p>
        <ul>
          <li>Connection pooling</li>
          <li>Backup strategies</li>
          <li>Performance monitoring</li>
        </ul>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check that the link is displayed
    const link = canvas.getByRole('link', { name: /view details/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', 'https://example.com/database');
  },
};

export const InitiallyExpanded: Story = {
  args: {
    icon: <ServerIcon />,
    heading: 'Server Configuration',
    isExpanded: true,
    expandableContent: (
      <div>
        <p>Server configuration details and settings.</p>
        <div style={{ backgroundColor: '#f0f0f0', padding: '10px', borderRadius: '4px' }}>
          <strong>Configuration:</strong>
          <ul>
            <li>CPU: 8 cores</li>
            <li>Memory: 32GB RAM</li>
            <li>Storage: 1TB SSD</li>
          </ul>
        </div>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check that the content is initially visible
    const content = canvas.getByText('Server configuration details and settings.');
    expect(content).toBeInTheDocument();

    // Check that the configuration details are visible
    const cpuInfo = canvas.getByText('CPU: 8 cores');
    expect(cpuInfo).toBeInTheDocument();
  },
};

export const ComplexContent: Story = {
  args: {
    icon: <CloudIcon />,
    heading: 'Multi-Service Architecture',
    expandableContent: (
      <div>
        <h4>Service Overview</h4>
        <p>This demonstrates how the component handles complex content with multiple elements.</p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginTop: '15px' }}>
          <div>
            <h5>Frontend Services</h5>
            <ul>
              <li>React Application</li>
              <li>API Gateway</li>
              <li>Load Balancer</li>
            </ul>
          </div>
          <div>
            <h5>Backend Services</h5>
            <ul>
              <li>Authentication Service</li>
              <li>Data Processing</li>
              <li>File Storage</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '15px', padding: '10px', backgroundColor: '#e7f3ff', borderRadius: '4px' }}>
          <strong>Note:</strong> This component can handle any level of complexity in the expandable content.
        </div>
      </div>
    ),
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check that the main heading is displayed
    const heading = canvas.getByText('Multi-Service Architecture');
    expect(heading).toBeInTheDocument();

    // Check that the toggle button is present and indicates collapsed state
    const toggle = canvas.getByRole('button', { name: /details/i });
    expect(toggle).toBeInTheDocument();
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    // The expandable content area exists but is hidden via CSS
    const expandableContent = canvas.getByLabelText('Multi-Service Architecture - Detailed Explanation');
    expect(expandableContent).toBeInTheDocument();
  },
};

export const MultipleItems: Story = {
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates how multiple CustomDataListItem components work together in a list.
The components can be used to create expandable lists with consistent styling and behavior.
        `,
      },
    },
  },
  render: () => (
    <div>
      <h3>Service Infrastructure Overview</h3>
      <p>Below is an example of multiple CustomDataListItem components working together:</p>

      <div style={{ marginTop: '20px' }}>
        <CustomDataListItem
          icon={<CloudIcon />}
          heading="Cloud Services"
          linkTitle="Manage Cloud"
          linkTarget="#cloud"
          expandableContent={
            <div>
              <p>Cloud infrastructure and services management.</p>
              <ul>
                <li>Virtual Machines</li>
                <li>Container Orchestration</li>
                <li>Auto-scaling</li>
              </ul>
            </div>
          }
        />

        <CustomDataListItem
          icon={<DatabaseIcon />}
          heading="Data Management"
          expandableContent={
            <div>
              <p>Database and data storage solutions.</p>
              <ul>
                <li>Primary Database</li>
                <li>Backup Systems</li>
                <li>Data Analytics</li>
              </ul>
            </div>
          }
        />

        <CustomDataListItem
          icon={<ServerIcon />}
          heading="Network Infrastructure"
          linkTitle="Configure Network"
          linkTarget="#network"
          expandableContent={
            <div>
              <p>Network configuration and security.</p>
              <ul>
                <li>Load Balancing</li>
                <li>Firewall Rules</li>
                <li>VPN Access</li>
              </ul>
            </div>
          }
        />
      </div>
    </div>
  ),
};
