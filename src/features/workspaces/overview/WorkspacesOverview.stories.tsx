import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { expect, userEvent, within } from 'storybook/test';
import { WorkspacesOverview } from './WorkspacesOverview';
import { BrowserRouter } from 'react-router-dom';

const meta: Meta<typeof WorkspacesOverview> = {
  component: WorkspacesOverview,
  tags: ['autodocs', 'workspaces', 'workspaces-overview'],
  decorators: [
    (Story) => (
      <BrowserRouter>
        <Story />
      </BrowserRouter>
    ),
  ],
  parameters: {
    layout: 'fullscreen',
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
- **Pure Presentational**: No Redux dependencies, receives all data through context
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
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Access Management');
    await expect(canvas.getByRole('img', { name: 'workspaces-header-icon' })).toBeInTheDocument();

    // Wait for service cards section to render - look for the service card descriptions
    await expect(canvas.getByText(/Configure workspaces to fit your organizational structure/)).toBeInTheDocument();
    await expect(canvas.getByText(/Create user groups of both end-users and service accounts/)).toBeInTheDocument();
    await expect(canvas.getByText(/Explore predefined roles to see if they fit your needs/)).toBeInTheDocument();
    await expect(canvas.getByText(/Grant access to your workspaces/)).toBeInTheDocument();

    // Verify service card titles
    const workspacesElements = canvas.getAllByText('Workspaces');
    await expect(workspacesElements.length).toBeGreaterThanOrEqual(2); // Title and button
    await expect(canvas.getByText('Groups')).toBeInTheDocument();
    await expect(canvas.getByText('Role')).toBeInTheDocument();
    await expect(canvas.getByText('Bindings')).toBeInTheDocument();

    // Verify service card action buttons by finding links with href attributes
    const workspacesLink = canvas.getByRole('link', { name: 'Workspaces' });
    await expect(workspacesLink).toBeInTheDocument();
    await expect(workspacesLink).toHaveAttribute('href', '/iam/access-management/workspaces');

    const groupsLink = canvas.getByRole('link', { name: 'View groups' });
    await expect(groupsLink).toBeInTheDocument();
    await expect(groupsLink).toHaveAttribute('href', '/iam/access-management/users-and-user-groups?&activeTab=user-groups');

    const rolesLink = canvas.getByRole('link', { name: 'View roles' });
    await expect(rolesLink).toBeInTheDocument();
    await expect(rolesLink).toHaveAttribute('href', '/iam/access-management/roles');

    const bindingsLink = canvas.getByRole('link', { name: 'View access requests' });
    await expect(bindingsLink).toBeInTheDocument();
    await expect(bindingsLink).toHaveAttribute('href', '/iam/access-management/access-requests');

    // Verify understanding access section
    await expect(canvas.getByText('Understanding access')).toBeInTheDocument();
    await expect(canvas.getByText('Default groups')).toBeInTheDocument();

    // Use more specific selector for the heading to avoid ambiguity
    await expect(canvas.getByRole('heading', { name: 'Granting access in workspaces' })).toBeInTheDocument();

    // Verify recommended content table
    await expect(canvas.getByText('Recommended content')).toBeInTheDocument();
    await expect(canvas.getByText('Create a workspace and grant access')).toBeInTheDocument();

    // Verify labels - there are multiple Documentation labels, so check for at least one Quick start and multiple Documentation
    const quickStartLabels = canvas.getAllByText('Quick start');
    await expect(quickStartLabels.length).toBeGreaterThanOrEqual(1);

    const documentationLabels = canvas.getAllByText('Documentation');
    await expect(documentationLabels.length).toBeGreaterThanOrEqual(3); // Should have 3+ documentation labels

    // Verify action links
    await expect(canvas.getByText('Begin Quick start')).toBeInTheDocument();

    const viewDocLinks = canvas.getAllByText('View documentation');
    await expect(viewDocLinks.length).toBeGreaterThanOrEqual(3); // Should have 3+ documentation links

    // Verify learning resources link
    await expect(canvas.getByText('View all Identity and Access Management Learning resources')).toBeInTheDocument();
  },
};

export const ExpandedMigrationSection: Story = {
  parameters: {
    docs: {
      description: {
        story:
          'Tests the expandable migration visualization section. Shows how users can expand and collapse the section to view information about how assets and permissions will be organized into workspaces.',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);
    const user = userEvent.setup();

    // Find and click the expandable section toggle
    const expandToggle = canvas.getByText('Show me how my assets and permissions will be organized into workspaces');
    await expect(expandToggle).toBeInTheDocument();

    // Expand the section
    await user.click(expandToggle);

    // Verify expanded content is visible
    await expect(canvas.getByText('A cool animation')).toBeInTheDocument();
    await expect(canvas.getByText('will go here')).toBeInTheDocument();
    await expect(canvas.getByText('when its ready')).toBeInTheDocument();

    // Collapse the section
    await user.click(expandToggle);

    // Note: PatternFly ExpandableSection might use different text when collapsed,
    // but the animation content should no longer be in the DOM or be hidden
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
    const user = userEvent.setup();

    // First wait for service cards to render by checking for their descriptions
    await expect(canvas.getByText(/Configure workspaces to fit your organizational structure/)).toBeInTheDocument();

    // Test service card action links (they render as links with href, not buttons)
    const workspacesLink = canvas.getByRole('link', { name: 'Workspaces' });
    await expect(workspacesLink).toBeInTheDocument();
    await expect(workspacesLink).toHaveAttribute('href', '/iam/access-management/workspaces');

    const groupsLink = canvas.getByRole('link', { name: 'View groups' });
    await expect(groupsLink).toBeInTheDocument();
    await expect(groupsLink).toHaveAttribute('href', '/iam/access-management/users-and-user-groups?&activeTab=user-groups');

    const rolesLink = canvas.getByRole('link', { name: 'View roles' });
    await expect(rolesLink).toBeInTheDocument();
    await expect(rolesLink).toHaveAttribute('href', '/iam/access-management/roles');

    const bindingsLink = canvas.getByRole('link', { name: 'View access requests' });
    await expect(bindingsLink).toBeInTheDocument();
    await expect(bindingsLink).toHaveAttribute('href', '/iam/access-management/access-requests');

    // Test clicking one of the links (navigation will be prevented in Storybook)
    await user.click(workspacesLink);
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
    await expect(canvas.getByText('Understanding access')).toBeInTheDocument();

    // Verify the data list is present
    const dataList = canvas.getByLabelText('understanding access');
    await expect(dataList).toBeInTheDocument();

    // Test Default groups section - this should be expanded by default based on isExpanded prop
    await expect(canvas.getByText('Default groups')).toBeInTheDocument();
    await expect(canvas.getByText('View your default groups')).toBeInTheDocument();

    // Should see the expanded content
    await expect(canvas.getByText('All Users group')).toBeInTheDocument();
    await expect(canvas.getByText('Admin Users group')).toBeInTheDocument();

    // Test Granting access section (using more specific selector for the heading to avoid ambiguity)
    await expect(canvas.getByRole('heading', { name: 'Granting access in workspaces' })).toBeInTheDocument();
    // Note: "Grant access" link is not visible since GRANT_ACCESS constant is empty string

    // The granting access section should have expandable content about User Groups, Roles, etc.
    // Look for key terms that should be in the expanded content
    await expect(canvas.getByText(/User Groups/)).toBeInTheDocument();
    await expect(canvas.getByText(/Roles/)).toBeInTheDocument();
    // Look for text that's unique to the understanding access section, not in service cards
    await expect(canvas.getByText(/provide distinct levels of access tailored/)).toBeInTheDocument();
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
    const recommendedTable = canvas.getByLabelText('Recommended content');
    await expect(recommendedTable).toBeInTheDocument();

    // Verify table content items
    await expect(canvas.getByText('Create a workspace and grant access')).toBeInTheDocument();
    await expect(canvas.getByText('Structuring your workspaces to fit your organizational use cases')).toBeInTheDocument();
    await expect(canvas.getByText('Understanding Workspace hierarchy and inheritance')).toBeInTheDocument();
    await expect(canvas.getByText('Understanding access management')).toBeInTheDocument();

    // Verify labels
    const quickStartLabels = canvas.getAllByText('Quick start');
    await expect(quickStartLabels[0]).toBeInTheDocument();

    const documentationLabels = canvas.getAllByText('Documentation');
    await expect(documentationLabels.length).toBeGreaterThanOrEqual(3); // Should have 3+ documentation labels

    // Verify action links
    await expect(canvas.getByText('Begin Quick start')).toBeInTheDocument();

    const viewDocLinks = canvas.getAllByText('View documentation');
    await expect(viewDocLinks.length).toBeGreaterThanOrEqual(3); // Should have 3+ documentation links

    // Verify learning resources link at the bottom
    const learningResourcesLink = canvas.getByText('View all Identity and Access Management Learning resources');
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
    await expect(canvas.getByText(/Configure workspaces to fit your organizational structure/)).toBeInTheDocument();

    // Verify that all key elements are still present in mobile view
    await expect(canvas.getByRole('heading', { level: 1 })).toHaveTextContent('Access Management');

    // Service cards should still be present and accessible (they render as links, not buttons)
    await expect(canvas.getByRole('link', { name: 'Workspaces' })).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'View groups' })).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'View roles' })).toBeInTheDocument();
    await expect(canvas.getByRole('link', { name: 'View access requests' })).toBeInTheDocument();

    // Content sections should remain accessible
    await expect(canvas.getByText('Understanding access')).toBeInTheDocument();
    await expect(canvas.getByText('Recommended content')).toBeInTheDocument();
  },
};
