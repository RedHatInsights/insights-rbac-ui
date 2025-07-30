import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { GroupSummary } from './GroupSummary';

const meta: Meta<typeof GroupSummary> = {
  component: GroupSummary,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
A summary display component for group creation wizards and review screens. Features:
- Displays group name and description in a formatted grid layout
- Shows selected roles, members, and service accounts when provided
- Handles internationalization internally using react-intl
- Conditionally shows service accounts section based on feature flags
- Uses PatternFly Grid and Text components for consistent styling
        `,
      },
    },
  },
  args: {
    name: 'Engineering Team',
    description: 'Development team for platform services',
    selectedUsers: [{ label: 'john.doe@company.com' }, { label: 'jane.smith@company.com' }],
  },
};

export default meta;
type Story = StoryObj<typeof GroupSummary>;

export const BasicGroup: Story = {
  args: {
    name: 'Marketing Team',
    description: 'Responsible for marketing campaigns and content strategy',
    selectedUsers: [{ label: 'marketing.lead@company.com' }, { label: 'content.writer@company.com' }],
  },
};

export const WithRoles: Story = {
  args: {
    name: 'DevOps Team',
    description: 'Infrastructure and deployment management',
    selectedRoles: [{ label: 'System Administrator' }, { label: 'Infrastructure Manager' }, { label: 'Cloud Architect' }],
    selectedUsers: [{ label: 'devops.lead@company.com' }, { label: 'cloud.engineer@company.com' }],
  },
};

export const WithServiceAccounts: Story = {
  args: {
    name: 'Automation Services',
    description: 'Automated processes and service integrations',
    selectedRoles: [{ label: 'Service Account Manager' }],
    selectedUsers: [{ label: 'automation.lead@company.com' }],
    selectedServiceAccounts: [{ name: 'ci-cd-pipeline' }, { name: 'monitoring-service' }, { name: 'backup-automation' }],
    showServiceAccounts: true,
  },
};

export const CompleteExample: Story = {
  args: {
    name: 'Security Operations Center',
    description: 'Cybersecurity monitoring and incident response team',
    selectedRoles: [{ label: 'Security Administrator' }, { label: 'Incident Response Manager' }, { label: 'Security Analyst' }],
    selectedUsers: [
      { label: 'security.lead@company.com' },
      { label: 'analyst1@company.com' },
      { label: 'analyst2@company.com' },
      { label: 'incident.manager@company.com' },
    ],
    selectedServiceAccounts: [{ name: 'security-scanner' }, { name: 'log-aggregator' }, { name: 'threat-detector' }],
    showServiceAccounts: true,
  },
};

export const MinimalExample: Story = {
  args: {
    name: 'Temporary Project Group',
    selectedUsers: [{ label: 'project.manager@company.com' }],
  },
};

export const EmptyCollections: Story = {
  args: {
    name: 'New Team',
    description: 'Recently created team with no assignments yet',
    selectedRoles: [],
    selectedUsers: [],
    selectedServiceAccounts: [],
    showServiceAccounts: false,
  },
};

export const InteractiveTest: Story = {
  args: {
    name: 'Test Group',
    description: 'Group for testing component behavior',
    selectedRoles: [{ label: 'Test Role 1' }, { label: 'Test Role 2' }],
    selectedUsers: [{ label: 'test.user1@company.com' }, { label: 'test.user2@company.com' }],
    selectedServiceAccounts: [{ name: 'test-service-1' }, { name: 'test-service-2' }],
    showServiceAccounts: true,
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify group name and description
    await expect(canvas.findByText('Test Group')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Group for testing component behavior')).resolves.toBeInTheDocument();

    // Verify roles section
    await expect(canvas.findByText('Test Role 1')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Test Role 2')).resolves.toBeInTheDocument();

    // Verify users/members section
    await expect(canvas.findByText('test.user1@company.com')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('test.user2@company.com')).resolves.toBeInTheDocument();

    // Verify service accounts section when enabled
    await expect(canvas.findByText('test-service-1')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('test-service-2')).resolves.toBeInTheDocument();

    // Verify section headers are present
    await expect(canvas.findByText('Group name')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Group description')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Roles')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Members')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Service accounts')).resolves.toBeInTheDocument();
  },
};
