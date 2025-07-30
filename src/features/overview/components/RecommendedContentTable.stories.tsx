import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import { RecommendedContentTable } from './RecommendedContentTable';

const meta: Meta<typeof RecommendedContentTable> = {
  component: RecommendedContentTable,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The RecommendedContentTable component displays a structured table of recommended content including quickstarts, documentation, and other resources.

## Features
- Displays table with recommended content items
- Categorized content with colored labels (Quick Start, Documentation, Other Resource)
- External links with appropriate icons (ArrowRight for internal, ExternalLink for external)
- Proper accessibility labels and OUIA test attributes
- Responsive table layout using PatternFly Table components

## Content Categories
- **Green labels**: Quick Start tutorials
- **Orange labels**: Documentation links  
- **Purple labels**: Other resources (API, blog posts)
`,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof RecommendedContentTable>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify the title is present
    await expect(canvas.findByRole('heading', { level: 2 })).resolves.toBeInTheDocument();

    // Verify the table is present
    const table = await canvas.findByLabelText('Recommended content table');
    await expect(table).toBeInTheDocument();

    // Check for various content types by label colors
    const quickStartLabels = canvas.getAllByText(/Quick Start/i);
    const documentationLabels = canvas.getAllByText(/Documentation/i);
    const otherResourceLabels = canvas.getAllByText(/Other Resource/i);

    // Verify we have the expected number of each type
    await expect(quickStartLabels.length).toBeGreaterThan(0);
    await expect(documentationLabels.length).toBeGreaterThan(0);
    await expect(otherResourceLabels.length).toBeGreaterThan(0);

    // Check for external links (should have target="_blank")
    const externalLinks = canvas.getAllByRole('link');
    const externalLinkElements = externalLinks.filter((link) => link.getAttribute('target') === '_blank');
    await expect(externalLinkElements.length).toBeGreaterThan(0);
  },
};

export const LinkVerification: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Verify specific link properties
    const quickStartLinks = canvas.getAllByText(/Begin Quick Start/i);
    await expect(quickStartLinks.length).toBeGreaterThan(0);

    const documentationLinks = canvas.getAllByText(/View Documentation/i);
    await expect(documentationLinks.length).toBeGreaterThan(0);

    const apiLinks = canvas.getAllByText(/View API site/i);
    await expect(apiLinks.length).toBeGreaterThan(0);

    const blogLinks = canvas.getAllByText(/Read blog post/i);
    await expect(blogLinks.length).toBeGreaterThan(0);

    // Verify OUIA attributes
    const table = await canvas.findByLabelText('Recommended content table');
    await expect(table).toHaveAttribute('data-ouia-component-id', 'recommended-table');

    const title = await canvas.findByRole('heading', { level: 2 });
    await expect(title).toHaveAttribute('data-ouia-component-id', 'recommended-title');
  },
};
