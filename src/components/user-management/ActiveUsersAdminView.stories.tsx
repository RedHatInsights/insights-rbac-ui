import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { ActiveUsersAdminView } from './ActiveUsersAdminView';
import { DECORATOR_ARG_TYPES, DEFAULT_DECORATOR_ARGS, StoryArgs } from '../../../.storybook/types';

// Component props + decorator arguments
type AdminViewStoryArgs = StoryArgs<React.ComponentProps<typeof ActiveUsersAdminView>>;

const meta: Meta<AdminViewStoryArgs> = {
  component: ActiveUsersAdminView,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    docs: {
      description: {
        component: `
ActiveUsersAdminView displays a descriptive text with a link to the Red Hat user management list.
This component is used to provide users with information about user management and directs them to the external user management interface.

## Features
- Displays internationalized user description message
- Provides customizable link text and description
- Opens user management in a new tab with proper security attributes
- Supports different Red Hat domain prefixes (prod vs staging)
- Includes external link icon for visual indication
        `,
      },
    },
    // Set default permissions for this component's stories
    permissions: {
      userAccessAdministrator: false,
      orgAdmin: true, // Admin view typically needs orgAdmin
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        <Story />
      </div>
    ),
  ],
  args: {
    prefix: '',
    linkTitle: ' user management list ',
    linkDescription: '',
    // Default decorator values
    ...DEFAULT_DECORATOR_ARGS,
  },
  argTypes: {
    // Component-specific props
    prefix: {
      description: 'Domain prefix for the Red Hat URL (empty for production, "access." for staging)',
      control: 'text',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
    linkTitle: {
      description: 'Text content for the clickable link',
      control: 'text',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '" user management list "' },
      },
    },
    linkDescription: {
      description: 'Additional descriptive text that appears before the link',
      control: 'text',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
    // Shared decorator controls
    ...DECORATOR_ARG_TYPES,
  },
} satisfies Meta<AdminViewStoryArgs>;

export default meta;
type Story = StoryObj<AdminViewStoryArgs>;

/**
 * Default production environment configuration
 */
export const Production: Story = {
  args: {
    prefix: '',
    linkTitle: ' user management list ',
    linkDescription: '',
  },
};

/**
 * Staging environment configuration with access prefix
 */
export const Staging: Story = {
  args: {
    prefix: 'access.',
    linkTitle: ' user management list ',
    linkDescription: '',
  },
};

/**
 * Custom link title for different contexts
 */
export const CustomLinkTitle: Story = {
  args: {
    prefix: '',
    linkTitle: ' Red Hat Account Management ',
    linkDescription: '',
  },
};

/**
 * With additional descriptive text before the link
 */
export const WithDescription: Story = {
  args: {
    prefix: '',
    linkTitle: ' user management interface ',
    linkDescription: 'For detailed user administration, visit the ',
  },
};

/**
 * Complete example with all customizations
 */
export const FullyCustomized: Story = {
  args: {
    prefix: 'access.',
    linkTitle: ' comprehensive user administration portal ',
    linkDescription: 'To manage users across your organization, access the ',
  },
};

/**
 * User Access Administrator permissions (different from orgAdmin)
 */
export const UserAccessAdmin: Story = {
  parameters: {
    permissions: {
      userAccessAdministrator: true,
      orgAdmin: false,
    },
  },
  args: {
    prefix: '',
    linkTitle: ' user management list ',
    linkDescription: '',
  },
};

/**
 * Demonstration of different environment configurations
 */
export const EnvironmentComparison: Story = {
  render: () => (
    <div>
      <h3>Environment Configurations:</h3>
      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '8px', color: '#151515' }}>Production:</h4>
        <ActiveUsersAdminView prefix="" />
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          → Links to: https://www.redhat.com/wapps/ugc/protected/usermgt/userList.html
        </div>
      </div>

      <div style={{ marginBottom: '24px' }}>
        <h4 style={{ marginBottom: '8px', color: '#151515' }}>Staging:</h4>
        <ActiveUsersAdminView prefix="access." />
        <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
          → Links to: https://www.access.redhat.com/wapps/ugc/protected/usermgt/userList.html
        </div>
      </div>

      <div>
        <h4 style={{ marginBottom: '8px', color: '#151515' }}>With Custom Description:</h4>
        <ActiveUsersAdminView
          prefix=""
          linkDescription="For advanced user management capabilities, navigate to the "
          linkTitle=" Red Hat User Management Console "
        />
      </div>
    </div>
  ),
};
