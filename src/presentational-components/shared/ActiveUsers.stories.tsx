import type { Meta, StoryObj } from '@storybook/react-webpack5';
import ActiveUsers from './ActiveUsers';
import { DECORATOR_ARG_TYPES, DEFAULT_DECORATOR_ARGS, StoryArgs } from '../../test/storybook-types';
import React from 'react';

/**
 * ActiveUsers is a smart component that conditionally renders either ActiveUsersAdminView
 * or ActiveUsersNonAdminView based on:
 * - User permissions (orgAdmin)
 * - Feature flags (platform.rbac.itless)
 * - Environment settings (production vs staging)
 *
 * The component uses Chrome API for environment detection and prefixes for staging environments.
 */

// Extract component props type
type ActiveUserProps = React.ComponentProps<typeof ActiveUsers>;

// Story args extend component props with decorator args
type ActiveUsersStoryArgs = StoryArgs<ActiveUserProps>;

const meta: Meta<ActiveUsersStoryArgs> = {
  component: ActiveUsers,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
Smart component that displays active users information with environment-aware behavior.

**Decision Logic:**
- If ITLess mode is enabled: Always shows NonAdminView
- If user is orgAdmin AND not ITLess: Shows AdminView with environment prefix
- Otherwise: Shows NonAdminView

**Environment Handling:**
- Production: Uses empty prefix
- Staging: Uses environment-specific prefix (e.g., "stage.")
        `,
      },
    },
  },
  argTypes: {
    // Component-specific props
    linkDescription: {
      control: 'text',
      description: 'Optional description text for the admin view link',
    },
    linkTitle: {
      control: 'text',
      description: 'Optional title text for the admin view link',
    },
    // Shared decorator controls
    ...DECORATOR_ARG_TYPES,
  },
  args: {
    // Default context values for controls
    ...DEFAULT_DECORATOR_ARGS,
  },
};

export default meta;
type Story = StoryObj<ActiveUsersStoryArgs>;

/**
 * Default story showing NonAdminView (most common case)
 */
export const Default: Story = {
  args: {
    orgAdmin: false,
    userAccessAdministrator: false,
    environment: 'prod',
    'platform.rbac.itless': false,
  },
};

/**
 * Org admin user in production - shows AdminView with no prefix
 */
export const OrgAdminProduction: Story = {
  args: {
    orgAdmin: true,
    userAccessAdministrator: false,
    environment: 'prod',
    'platform.rbac.itless': false,
    linkDescription: 'Manage and invite users to your organization',
    linkTitle: 'User Management Portal',
  },
};

/**
 * Org admin user in staging - shows AdminView with environment prefix
 */
export const OrgAdminStaging: Story = {
  args: {
    orgAdmin: true,
    userAccessAdministrator: false,
    environment: 'stage',
    'platform.rbac.itless': false,
    linkDescription: 'Staging environment for user management',
    linkTitle: 'User Management (Staging)',
  },
};

/**
 * ITLess mode enabled - always shows NonAdminView regardless of permissions
 */
export const ITLessMode: Story = {
  args: {
    orgAdmin: true, // Even though user is orgAdmin...
    userAccessAdministrator: false,
    environment: 'prod',
    'platform.rbac.itless': true, // ...ITLess mode overrides
  },
};

/**
 * User Access Admin (not Org Admin) - shows NonAdminView
 * Note: userAccessAdministrator permission doesn't trigger AdminView, only orgAdmin does
 */
export const UserAccessAdmin: Story = {
  args: {
    orgAdmin: false,
    userAccessAdministrator: true,
    environment: 'prod',
    'platform.rbac.itless': false,
  },
};

/**
 * Development environment example
 */
export const DevelopmentEnvironment: Story = {
  args: {
    orgAdmin: true,
    userAccessAdministrator: false,
    environment: 'ci-beta',
    'platform.rbac.itless': false,
    linkDescription: 'Development environment user management',
    linkTitle: 'User Management (Dev)',
  },
};
