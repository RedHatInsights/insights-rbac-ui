import React from 'react';
import { Meta, StoryObj } from '@storybook/react-webpack5';
import { MemoryRouter } from 'react-router-dom';
import MUACard from './MUACard';

const meta: Meta<typeof MUACard> = {
  component: MUACard,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
## MUACard Component

The **MUACard** component is a **My User Access** card component that displays user entitlements and applications. It serves as a dashboard showing what applications and services a user has access to based on their entitlements.

### Visual Structure

1. **Header** (optional): A title like "My Applications" or "Available Applications"
2. **Cards**: Each card represents a bundle/entitlement the user has access to
3. **Card Content**: Each card shows:
   - **Title**: The bundle name (e.g., "OpenShift", "Red Hat Enterprise Linux", "Ansible Automation Platform", "Settings and User Access")
   - **Applications List**: A list of applications available under that bundle
   - **Clickable**: Each card is wrapped in a NavLink for navigation

### How It Works

The component takes an array of entitlements in the format \`[entitlementKey, entitlementObject]\` where:
- \`entitlementKey\` matches the bundle entitlement (e.g., 'openshift', 'rhel', 'ansible', 'settings')
- \`entitlementObject\` contains \`{ is_entitled: boolean, is_trial: boolean }\`

The component only renders cards for bundles where the user is actually entitled (\`is_entitled: true\`).

### Available Bundles

- **OpenShift**: clusters, advisor, subscriptions, cost management
- **Red Hat Enterprise Linux**: advisor, compliance, drift, image builder, patch, vulnerability, policies, remediations, subscriptions, repositories, provisioning, tasks, ros, malware detection
- **Ansible Automation Platform**: automation hub, automation services catalog, insights
- **Settings and User Access**: rbac, sources

### Use Cases

- **Full Access User**: Sees all 4 cards with complete application access
- **Limited User**: Sees 1-2 cards with only their entitled applications
- **Disabled State**: Sees cards but they're grayed out and non-interactive
- **No Access User**: Sees no cards at all

This component is essentially a **dashboard of available applications** based on the user's entitlements, making it easy for users to see what they can access and navigate to those applications.
        `,
      },
    },
  },
  argTypes: {
    header: { control: 'text' },
    isDisabled: { control: 'boolean' },
  },
  decorators: [
    (Story) => (
      <MemoryRouter initialEntries={['/']}>
        <div style={{ padding: '20px', maxWidth: '1200px' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof MUACard>;

// Sample entitlements data
const sampleEntitlements: Array<[string, any]> = [
  ['openshift', { is_entitled: true, is_trial: false }],
  ['rhel', { is_entitled: true, is_trial: false }],
  ['ansible', { is_entitled: true, is_trial: false }],
  ['settings', { is_entitled: true, is_trial: false }],
];

const limitedEntitlements: Array<[string, any]> = [
  ['rhel', { is_entitled: true, is_trial: false }],
  ['settings', { is_entitled: true, is_trial: false }],
];

const singleEntitlement: Array<[string, any]> = [['openshift', { is_entitled: true, is_trial: false }]];

export const Default: Story = {
  args: {
    entitlements: sampleEntitlements,
    isDisabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows all 4 cards (OpenShift, RHEL, Ansible, Settings) with their respective applications. This represents a user with full access to all available bundles.',
      },
    },
  },
};

export const WithHeader: Story = {
  args: {
    header: 'My Applications',
    entitlements: sampleEntitlements,
    isDisabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Same as Default but with a "My Applications" header. Demonstrates how the component looks with a descriptive title.',
      },
    },
  },
};

export const Disabled: Story = {
  args: {
    header: 'My Applications',
    entitlements: sampleEntitlements,
    isDisabled: true,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Shows all cards but they're grayed out and non-clickable. This represents a disabled state where the user can see what they have access to but cannot interact with the cards.",
      },
    },
  },
};

export const LimitedEntitlements: Story = {
  args: {
    header: 'Available Applications',
    entitlements: limitedEntitlements,
    isDisabled: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          'Shows only 2 cards (RHEL and Settings) - useful for users with restricted access. Demonstrates how the component adapts to different entitlement levels.',
      },
    },
  },
};

export const SingleEntitlement: Story = {
  args: {
    header: 'OpenShift Applications',
    entitlements: singleEntitlement,
    isDisabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows only 1 card (OpenShift) - for users with very limited access. This demonstrates the component with minimal entitlements.',
      },
    },
  },
};

export const NoEntitlements: Story = {
  args: {
    header: 'My Applications',
    entitlements: [],
    isDisabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Shows no cards - for users with no entitlements. This demonstrates the empty state of the component.',
      },
    },
  },
};

export const WithoutHeader: Story = {
  args: {
    entitlements: sampleEntitlements,
    isDisabled: false,
  },
  parameters: {
    docs: {
      description: {
        story: 'Same as Default but without a header. Shows how the component looks when used without a title.',
      },
    },
  },
};
