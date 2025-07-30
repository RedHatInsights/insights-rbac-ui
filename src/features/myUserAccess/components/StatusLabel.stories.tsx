import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import StatusLabel from './StatusLabel';

const meta: Meta<typeof StatusLabel> = {
  component: StatusLabel,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The StatusLabel component displays administrative role badges for users.
It shows different colored labels based on the user's administrative privileges:

- **Organization Administrator**: Purple label with tooltip explaining org admin privileges
- **User Access Administrator**: Purple label with tooltip explaining user access admin privileges  
- **No Admin Roles**: Renders nothing (empty fragment)

The component uses PatternFly's Label and Tooltip components and reads localized text
from the Messages file for internationalization support.

### Usage
This component is typically used in user listings and profile displays to quickly
identify users with elevated permissions.
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof StatusLabel>;

export const Comparison: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '16px', flexDirection: 'column' }}>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ minWidth: '200px' }}>No admin roles:</span>
        <StatusLabel isOrgAdmin={false} isUserAccessAdmin={false} />
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ minWidth: '200px' }}>Organization Admin:</span>
        <StatusLabel isOrgAdmin={true} isUserAccessAdmin={false} />
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ minWidth: '200px' }}>User Access Admin:</span>
        <StatusLabel isOrgAdmin={false} isUserAccessAdmin={true} />
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span style={{ minWidth: '200px' }}>Both roles:</span>
        <StatusLabel isOrgAdmin={true} isUserAccessAdmin={true} />
      </div>
    </div>
  ),
  parameters: {
    docs: {
      description: {
        story: 'Side-by-side comparison of all possible StatusLabel states.',
      },
    },
  },
};

export const OrganizationAdministrator: Story = {
  args: {
    isOrgAdmin: true,
    isUserAccessAdmin: false,
  },
};

export const UserAccessAdministrator: Story = {
  args: {
    isOrgAdmin: false,
    isUserAccessAdmin: true,
  },
};

export const BothAdminRoles: Story = {
  args: {
    isOrgAdmin: true,
    isUserAccessAdmin: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'Edge case where a user has both org admin and user access admin roles. Organization Administrator takes precedence.',
      },
    },
  },
};

export const NoAdminRoles: Story = {
  render: (args) => (
    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
      <StatusLabel {...args} />
      <span style={{ fontSize: '14px', color: '#6a6e73', fontStyle: 'italic' }}>
        ← Component correctly renders nothing when user has no admin roles
      </span>
    </div>
  ),
  args: {
    isOrgAdmin: false,
    isUserAccessAdmin: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'When a user has no administrative roles, the component renders an empty fragment (nothing). This is the expected behavior.',
      },
    },
  },
};
