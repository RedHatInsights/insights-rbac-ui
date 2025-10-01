import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { action } from 'storybook/actions';
import { expect, fn, userEvent, within } from 'storybook/test';
import { ResourceDefinitionsLink } from './ResourceDefinitionsLink';

const meta: Meta<typeof ResourceDefinitionsLink> = {
  component: ResourceDefinitionsLink,
  tags: ['autodocs'],
  parameters: {
    backgrounds: {
      default: 'console',
    },
    docs: {
      description: {
        component: `
ResourceDefinitionsLink displays resource definition counts as clickable links or shows "N/A" when no resources are available.
This component is commonly used in access tables to show the number of resource definitions associated with a permission.

## 🎯 Purpose

Resource definitions specify the specific resources (like AWS accounts, cost centers, or inventory groups) that a permission applies to.
This component provides a consistent way to display the count and allow users to view the details.

## 🔧 Usage

### With Resource Definitions
When the access object contains resource definitions, the component displays the count as a clickable link.
Clicking the link triggers the onClick callback, typically to open a modal showing the resource details.

### Without Resource Definitions  
When no resource definitions are present (empty array), the component displays "N/A" as plain text.
This indicates that the permission applies to all resources of that type.

## 📋 Props

- **onClick** (required): Function called when the count link is clicked
- **access.resourceDefinitions** (required): Array of resource definition objects

## 🎨 Design Notes

- Count appears as a clickable link (styled as \`<a>\` tag)
- "N/A" appears as plain text
- Uses consistent internationalization via react-intl
- No additional styling needed - inherits from context
        `,
      },
    },
  },
  args: {
    onClick: fn(),
  },
  argTypes: {
    onClick: {
      description: 'Callback function called when the resource definitions link is clicked',
    },
    access: {
      description: 'Access object containing resourceDefinitions array',
    },
  },
} satisfies Meta<typeof ResourceDefinitionsLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default comparison view showing different states side by side.
 * Demonstrates the visual difference between clickable and non-clickable states.
 */
export const StateComparison: Story = {
  render: () => (
    <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>No Resource Definitions</div>
        <ResourceDefinitionsLink onClick={action('no-resources-clicked')} access={{ resourceDefinitions: [] }} />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>1 Resource Definition</div>
        <ResourceDefinitionsLink
          onClick={action('single-resource-clicked')}
          access={{ resourceDefinitions: [{ attributeFilter: { value: 'account' } }] }}
        />
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ marginBottom: '8px', fontSize: '14px', color: '#666' }}>Multiple Resource Definitions</div>
        <ResourceDefinitionsLink
          onClick={action('multiple-resources-clicked')}
          access={{ resourceDefinitions: Array(12).fill({ attributeFilter: { value: 'account' } }) }}
        />
      </div>
    </div>
  ),
};

/**
 * Shows a clickable link with 5 resource definitions.
 * Click the link to see the action logged in the Actions panel.
 */
export const WithResourceDefinitions: Story = {
  args: {
    access: {
      resourceDefinitions: [
        { attributeFilter: { value: 'account-1' } },
        { attributeFilter: { value: 'account-2' } },
        { attributeFilter: { value: 'account-3' } },
        { attributeFilter: { value: 'account-4' } },
        { attributeFilter: { value: 'account-5' } },
      ],
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('5', { selector: 'a' }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};

/**
 * Shows "N/A" when no resource definitions are available.
 * This indicates the permission applies to all resources.
 */
export const NoResourceDefinitions: Story = {
  args: {
    onClick: fn(),
    access: {
      resourceDefinitions: [],
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    // Verify "N/A" is displayed as non-clickable span
    const naText = await canvas.findByText('N/A');
    await expect(naText.tagName).toBe('SPAN');
    // onClick should not be called since there's no clickable element
    await expect(args.onClick).not.toHaveBeenCalled();
  },
};

/**
 * Single resource definition showing count of 1.
 * Commonly seen for specific, targeted permissions.
 */
export const SingleResourceDefinition: Story = {
  args: {
    onClick: fn(),
    access: {
      resourceDefinitions: [{ attributeFilter: { value: 'specific-account' } }],
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('1', { selector: 'a' }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};

/**
 * Large number of resource definitions to test display.
 * Shows how the component handles higher counts.
 */
export const ManyResourceDefinitions: Story = {
  args: {
    onClick: fn(),
    access: {
      resourceDefinitions: Array(42).fill({ attributeFilter: { value: 'account' } }),
    },
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByText('42', { selector: 'a' }));
    await expect(args.onClick).toHaveBeenCalled();
  },
};
