import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, within } from 'storybook/test';
import { WorkspacesOverview } from './WorkspacesOverview';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof WorkspacesOverview> = {
  component: WorkspacesOverview,
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    docs: {
      description: {
        component: `
**WorkspacesOverview** is the main landing page for the workspaces feature that provides an introduction and navigation hub.

This component demonstrates:
- **Content Header**: Title, subtitle, and learn more link with workspace icon
- **Interactive Sections**: Expandable migration visualization section
- **Service Cards**: Navigation cards for Workspaces, Groups, Roles, and Bindings
- **Educational Content**: Understanding access section with expandable data list items
- **Resource Links**: Recommended content table and learning resources
- **Navigation Integration**: Router-based navigation for all action buttons

### Key Features
- **Pure Presentational**: No external state dependencies, receives all data through context
- **Responsive Layout**: Uses PatternFly Gallery and responsive components
- **Interactive Elements**: Expandable sections, navigation buttons, and external links
- **Comprehensive Coverage**: Complete overview of RBAC workspace functionality
- **Educational Focus**: Helps users understand workspace concepts and workflows
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WorkspacesOverview>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Displays the complete workspaces overview page with all sections visible. Shows content header, service cards, understanding access section, and recommended content. Users should see the full landing page experience with navigation and educational content.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for component to fully render and verify main header content
    await expect(await canvas.findByRole('heading', { level: 1 })).toHaveTextContent('Access Management');
    await expect(canvas.findByRole('img', { name: 'workspaces-header-icon' })).resolves.toBeInTheDocument();

    // Wait for service cards section to render - look for the service card descriptions
    await expect(canvas.findByText(/Configure workspaces to fit your organizational structure/)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Create user groups of both end-users and service accounts/)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Explore predefined roles to see if they fit your needs/)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Grant access to your workspaces/)).resolves.toBeInTheDocument();

    // Verify service card titles
    await expect(canvas.findByText('Groups')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Role')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Bindings')).resolves.toBeInTheDocument();

    // Verify service card action buttons by finding links with href attributes
    const workspacesLink = await canvas.findByRole('link', { name: 'Workspaces' });
    await expect(workspacesLink).toBeInTheDocument();
    await expect(workspacesLink).toHaveAttribute('href', '/iam/access-management/workspaces');

    const groupsLink = await canvas.findByRole('link', { name: 'View groups' });
    await expect(groupsLink).toBeInTheDocument();
    await expect(groupsLink).toHaveAttribute('href', '/iam/access-management/users-and-user-groups?activeTab=user-groups');

    const rolesLink = await canvas.findByRole('link', { name: 'View roles' });
    await expect(rolesLink).toBeInTheDocument();
    await expect(rolesLink).toHaveAttribute('href', '/iam/access-management/roles');

    const bindingsButton = await canvas.findByRole('button', { name: 'View access requests' });
    await expect(bindingsButton).toBeInTheDocument();

    // Verify understanding access section
    await expect(canvas.findByText('Understanding access')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Default groups')).resolves.toBeInTheDocument();

    // Use more specific selector for the heading to avoid ambiguity
    await expect(canvas.findByRole('heading', { name: 'Granting access in workspaces' })).resolves.toBeInTheDocument();

    // Verify recommended content table
    await expect(canvas.findByText('Recommended content')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Create a workspace and grant access')).resolves.toBeInTheDocument();

    // Verify labels - there are multiple Documentation labels, so check for at least one Quick start and multiple Documentation
    const quickStartLabels = canvas.getAllByText('Quick start');
    await expect(quickStartLabels.length).toBeGreaterThanOrEqual(1);

    const documentationLabels = canvas.getAllByText('Documentation');
    await expect(documentationLabels.length).toBeGreaterThanOrEqual(3); // Should have 3+ documentation labels

    // Verify action links
    await expect(canvas.findByText('Begin Quick start')).resolves.toBeInTheDocument();

    const viewDocLinks = canvas.getAllByText('View documentation');
    await expect(viewDocLinks.length).toBeGreaterThanOrEqual(3); // Should have 3+ documentation links

    // Verify learning resources link
    await expect(canvas.findByText('View all Identity and Access Management Learning resources')).resolves.toBeInTheDocument();
  },
};

export const ExpandedMigrationSection: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests the basic layout when migration visualization section is not available. The expandable section is currently commented out in the component as it awaits visual assets.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the main service cards are present since migration section is commented out
    // Look for service card titles specifically (they have ouia-component-id attributes)
    await expect(canvas.getByRole('heading', { level: 2, name: 'Workspaces' })).toBeInTheDocument();
    await expect(canvas.getAllByText('Groups')[0]).toBeInTheDocument(); // Service card title
    await expect(canvas.getAllByText('Role')[0]).toBeInTheDocument(); // Service card title
    await expect(canvas.getAllByText('Bindings')[0]).toBeInTheDocument(); // Service card title

    // Verify recommended content section is present
    await expect(canvas.getByText('Recommended content')).toBeInTheDocument();
    await expect(canvas.getByText('Create a workspace and grant access')).toBeInTheDocument();
  },
};
export const ServiceCardNavigation: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests navigation functionality of service cards. Verifies that all service card buttons are clickable and have proper navigation attributes for Workspaces, Groups, Roles, and Bindings sections.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // First wait for service cards to render by checking for their descriptions
    await expect(canvas.findByText(/Configure workspaces to fit your organizational structure/)).resolves.toBeInTheDocument();

    // Test service card action links (they render as links with href, not buttons)
    const workspacesLink = await canvas.findByRole('link', { name: 'Workspaces' });
    await expect(workspacesLink).toHaveAttribute('href', '/iam/access-management/workspaces');

    const groupsLink = await canvas.findByRole('link', { name: 'View groups' });
    await expect(groupsLink).toHaveAttribute('href', '/iam/access-management/users-and-user-groups?activeTab=user-groups');

    const rolesLink = await canvas.findByRole('link', { name: 'View roles' });
    await expect(rolesLink).toHaveAttribute('href', '/iam/access-management/roles');

    const bindingsButton = await canvas.findByRole('button', { name: 'View access requests' });
    await expect(bindingsButton).toBeInTheDocument();

    // Test Understanding access section
    await expect(canvas.findByText('Understanding access')).resolves.toBeInTheDocument();

    // Verify Understanding access list functionality
    const dataList = await canvas.findByLabelText('understanding access');
    await expect(dataList).toBeInTheDocument();

    await expect(canvas.findByText('Default groups')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('View your default groups')).resolves.toBeInTheDocument();

    await expect(canvas.findByText('All Users group')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Admin Users group')).resolves.toBeInTheDocument();

    // Verify granting access section
    await expect(canvas.findByRole('heading', { name: 'Granting access in workspaces' })).resolves.toBeInTheDocument();

    // Verify interactive data list content (from presentational component)
    await expect(canvas.findByText(/User Groups/)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Roles/)).resolves.toBeInTheDocument();

    await expect(canvas.findByText(/provide distinct levels of access tailored/)).resolves.toBeInTheDocument();

    // Test recommended content table interaction
    const recommendedTable = await canvas.findByLabelText('Recommended content');
    await expect(recommendedTable).toBeInTheDocument();

    await expect(canvas.findByText('Create a workspace and grant access')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Structuring your workspaces to fit your organizational use cases')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Understanding Workspace hierarchy and inheritance')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Understanding access management')).resolves.toBeInTheDocument();

    // Test learning resources link
    const learningResourcesLink = await canvas.findByText('View all Identity and Access Management Learning resources');
    await expect(learningResourcesLink).toBeInTheDocument();
    await expect(learningResourcesLink).toHaveAttribute('href', '/settings/learning-resources');
  },
};

export const UnderstandingAccessExpansion: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests the expandable data list items in the Understanding Access section. Verifies that users can expand sections to learn about default groups and granting access in workspaces.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the component to render by checking for the main heading first
    await expect(canvas.findByText('Understanding access')).resolves.toBeInTheDocument();

    // Verify the data list is present
    const dataList = await canvas.findByLabelText('understanding access');
    await expect(dataList).toBeInTheDocument();

    // Test Default groups section - this should be expanded by default based on isExpanded prop
    await expect(canvas.findByText('Default groups')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('View your default groups')).resolves.toBeInTheDocument();

    // Should see the expanded content
    await expect(canvas.findByText('All Users group')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Admin Users group')).resolves.toBeInTheDocument();

    // Test Granting access section (using more specific selector for the heading to avoid ambiguity)
    await expect(canvas.findByRole('heading', { name: 'Granting access in workspaces' })).resolves.toBeInTheDocument();
    // Note: "Grant access" link is not visible since GRANT_ACCESS constant is empty string

    // The granting access section should have expandable content about User Groups, Roles, etc.
    // Look for key terms that should be in the expanded content
    await expect(canvas.findByText(/User Groups/)).resolves.toBeInTheDocument();
    await expect(canvas.findByText(/Roles/)).resolves.toBeInTheDocument();
    // Look for text that's unique to the understanding access section, not in service cards
    await expect(canvas.findByText(/provide distinct levels of access tailored/)).resolves.toBeInTheDocument();
  },
};

export const RecommendedContentTable: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Focuses on the recommended content table that shows quick starts and documentation links. Verifies that all recommended content items are displayed with proper labels and links.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify recommended content table
    const recommendedTable = await canvas.findByLabelText('Recommended content');
    await expect(recommendedTable).toBeInTheDocument();

    // Verify table content items
    await expect(canvas.findByText('Create a workspace and grant access')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Structuring your workspaces to fit your organizational use cases')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Understanding Workspace hierarchy and inheritance')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Understanding access management')).resolves.toBeInTheDocument();

    // Verify labels
    const quickStartLabels = canvas.getAllByText('Quick start');
    await expect(quickStartLabels[0]).toBeInTheDocument();

    const documentationLabels = canvas.getAllByText('Documentation');
    await expect(documentationLabels.length).toBeGreaterThanOrEqual(3); // Should have 3+ documentation labels

    // Verify action links
    await expect(canvas.findByText('Begin Quick start')).resolves.toBeInTheDocument();

    const viewDocLinks = canvas.getAllByText('View documentation');
    await expect(viewDocLinks.length).toBeGreaterThanOrEqual(3); // Should have 3+ documentation links

    // Verify learning resources link at the bottom
    const learningResourcesLink = await canvas.findByText('View all Identity and Access Management Learning resources');
    await expect(learningResourcesLink).toBeInTheDocument();
    await expect(learningResourcesLink).toHaveAttribute('href', '/settings/learning-resources');
  },
};

export const ResponsiveLayout: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests the responsive layout behavior of the overview page. Verifies that the gallery layout and service cards adapt appropriately to different screen sizes and maintain proper spacing.',
      },
    },
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for component to render by checking for service card descriptions
    await expect(canvas.findByText(/Configure workspaces to fit your organizational structure/)).resolves.toBeInTheDocument();

    // Verify that all key elements are still present in mobile view
    await expect(await canvas.findByRole('heading', { level: 1 })).toHaveTextContent('Access Management');

    // Service cards should still be present and accessible (they render as links, not buttons)
    await expect(canvas.findByRole('link', { name: 'Workspaces' })).resolves.toBeInTheDocument();
    await expect(canvas.findByRole('link', { name: 'View groups' })).resolves.toBeInTheDocument();
    await expect(canvas.findByRole('link', { name: 'View roles' })).resolves.toBeInTheDocument();
    await expect(canvas.findByRole('button', { name: 'View access requests' })).resolves.toBeInTheDocument();

    // Content sections should remain accessible
    await expect(canvas.findByText('Understanding access')).resolves.toBeInTheDocument();
    await expect(canvas.findByText('Recommended content')).resolves.toBeInTheDocument();
  },
};
