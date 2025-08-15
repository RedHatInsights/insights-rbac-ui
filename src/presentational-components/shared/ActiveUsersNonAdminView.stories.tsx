import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { ActiveUsersNonAdminView } from './ActiveUsersNonAdminView';

const meta = {
  component: ActiveUsersNonAdminView,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    layout: 'centered',
    docs: {
      description: {
        component: `
ActiveUsersNonAdminView displays a descriptive text about user management for non-admin users.
This component is used to provide users with information about user management without providing admin-level access to external management tools.

## Features
- Displays internationalized user description message
- Simple, read-only information display
- No interactive elements or external links
- Consistent styling with PatternFly components
- Used for non-administrative user contexts

## Usage
This component is typically shown to users who don't have administrative privileges, providing them with contextual information about user management without actionable links.
        `,
      },
    },
    // Non-admin view uses default permissions (both false)
    permissions: {
      userAccessAdministrator: false,
      orgAdmin: false,
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        <Story />
      </div>
    ),
  ],
  args: {},
  argTypes: {
    // This component has no props, but we can document that fact
  },
} satisfies Meta<typeof ActiveUsersNonAdminView>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default display for non-admin users
 */
export const Default: Story = {
  args: {},
};
