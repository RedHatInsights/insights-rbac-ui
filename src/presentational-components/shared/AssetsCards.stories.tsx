import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import AssetsCards from './AssetsCards';

const meta: Meta<typeof AssetsCards> = {
  component: AssetsCards,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
AssetsCards component that displays two predefined asset management cards for Insights and OpenShift.
- Uses PatternFly Card and Panel components for consistent styling
- Shows Insights and OpenShift asset management options
- Each card includes a logo, title, description, and navigation link
- Links are workspace-specific and include the workspace name in the URL
- Uses internationalization for all text content

**Note:** In Storybook, the external SVG icons (Insights and OpenShift logos) are not available and will show as broken images.
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
          <strong>⚠️ Storybook Note:</strong> The external SVG icons (Insights and OpenShift logos) are not available in this environment and will
          show as broken images. The component functionality is still fully testable.
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
    const insightsLink = canvas.getByRole('link', { name: /.*insights.*/i });
    expect(insightsLink).toBeInTheDocument();
    expect(insightsLink).toHaveAttribute('href', '/insights/inventory?workspace=my-workspace');

    const openshiftLink = canvas.getByRole('link', { name: /.*openshift.*/i });
    expect(openshiftLink).toBeInTheDocument();
    expect(openshiftLink).toHaveAttribute('href', '/openshift/?workspace=my-workspace');
  },
};
