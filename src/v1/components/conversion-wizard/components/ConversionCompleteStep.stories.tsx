import type { Meta, StoryObj } from '@storybook/react-vite';
import * as React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { expect, within } from 'storybook/test';
import { ConversionCompleteStep } from './ConversionCompleteStep';

const meta = {
  component: ConversionCompleteStep,
  // The dashboard button navigates, so the component needs a router context
  decorators: [
    (Story) => (
      <MemoryRouter>
        <Story />
      </MemoryRouter>
    ),
  ],
  parameters: {
    layout: 'padded',
  },
} satisfies Meta<typeof ConversionCompleteStep>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * The ConversionCompleteStep is shown after the conversion API call completes successfully.
 * It displays a loading spinner while the API call is in progress, then shows a success message
 * with options to navigate to the Access Management dashboard or view the getting started guide.
 */
export const Default: Story = {
  tags: ['autodocs'],
  args: {
    isLoading: false,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify title is present', async () => {
      expect(canvas.getByRole('heading', { name: /conversion complete/i })).toBeInTheDocument();
    });

    await step('Verify success message is present', async () => {
      expect(canvas.getByText(/your organization has been successfully converted to workspace-based access management/i)).toBeInTheDocument();
    });

    await step('Verify dashboard navigation button is present', async () => {
      const button = canvas.getByRole('button', { name: /go to access management dashboard/i });
      expect(button).toBeInTheDocument();
    });

    await step('Verify getting started link is present and external', async () => {
      const link = canvas.getByRole('link', { name: /getting started with access management/i });
      expect(link).toBeInTheDocument();
      expect(link).toHaveAttribute(
        'href',
        'https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf',
      );
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  },
};

/**
 * Loading state shown while the API call is in progress
 */
export const Loading: Story = {
  args: {
    isLoading: true,
  },
  play: async ({ canvasElement, step }) => {
    const canvas = within(canvasElement);

    await step('Verify loading spinner is present', async () => {
      expect(canvas.getByRole('progressbar', { name: /converting organization/i })).toBeInTheDocument();
    });

    await step('Verify loading message is present', async () => {
      expect(canvas.getByText(/converting your organization/i)).toBeInTheDocument();
    });

    await step('Verify success content is not present', async () => {
      expect(canvas.queryByRole('heading', { name: /conversion complete/i })).not.toBeInTheDocument();
      expect(canvas.queryByRole('button', { name: /go to access management dashboard/i })).not.toBeInTheDocument();
    });
  },
};
