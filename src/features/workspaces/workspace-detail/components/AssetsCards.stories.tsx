import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import AssetsCards from './AssetsCards';

const meta: Meta<typeof AssetsCards> = {
  component: AssetsCards,
  tags: ['autodocs', 'workspaces'],
  parameters: {
    docs: {
      description: {
        component: `
AssetsCards component that displays two predefined asset management cards for Insights and OpenShift.
- Uses PatternFly Card and Panel components for consistent styling
- Shows Insights asset management options
- Each card includes a logo, title, description, and navigation link
- Links are workspace-specific and include the workspace name in the URL
- Uses internationalization for all text content

**Note:** In Storybook, the external SVG icon (Insights logo) is not available and will show as a broken image.
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '1200px' }}>
        <div
          style={{
            marginBottom: '20px',
            padding: '10px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '4px',
            fontSize: '14px',
          }}
        >
          <strong>⚠️ Storybook Note:</strong> The external SVG icon (Insights logo) is not available in this environment and will show as a broken
          image. The component functionality is still fully testable.
        </div>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof AssetsCards>;

export const Default: Story = {
  args: {
    workspaceName: 'my-workspace',
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check that navigation links are present with correct URLs
    const insightsLink = await canvas.findByRole('link', { name: /.*insights.*/i });
    await expect(insightsLink).toBeInTheDocument();
    await expect(insightsLink).toHaveAttribute('href', '/insights/inventory?workspace=my-workspace');
  },
};
