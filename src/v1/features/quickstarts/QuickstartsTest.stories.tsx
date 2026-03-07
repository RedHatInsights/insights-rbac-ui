import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect } from 'storybook/test';
import QuickstartsTest from './QuickstartsTest';

const meta: Meta<typeof QuickstartsTest> = {
  component: QuickstartsTest,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
The QuickstartsTest component renders the PatternFly Quickstarts Catalog, providing guided tutorials 
and onboarding experiences for Red Hat's User Access management features.

## Overview
Based on the [PatternFly Quickstarts module](https://github.com/patternfly/patternfly-quickstarts), 
this component displays interactive tutorials that help users learn features through step-by-step guidance.

## Features
- **Interactive Tutorials**: Step-by-step guided tours for learning RBAC features
- **Progress Tracking**: Tracks user progress through tutorials
- **Filtering & Search**: Helps users find relevant tutorials by difficulty, category, or status
- **Responsive Design**: Works across different screen sizes
- **Accessibility**: Built with PatternFly's accessibility standards

## How it Works
1. Integrates with Red Hat Cloud Services Chrome environment
2. Uses the \`useChrome\` hook to access quickstarts functionality
3. Renders the catalog component that displays available tutorials
4. Tutorials are typically defined in YAML files and loaded dynamically

## Real-world Usage
In production, this would show actual quickstart tutorials like:
- "Getting Started with RBAC" - Learn basic role management
- "Creating Custom Roles" - Advanced role configuration
- "Managing User Groups" - Group organization and permissions
- "Workspace Administration" - Workspace setup and management

## Technical Details
- Zero props required - pulls configuration from Chrome context
- Lightweight wrapper around PatternFly's quickstart implementation
- Supports theming and customization through Chrome configuration
        `,
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof QuickstartsTest>;

export const Default: Story = {
  parameters: {
    docs: {
      description: {
        story: `
The default quickstarts catalog showing available tutorials for RBAC features.
This story demonstrates the typical user experience when accessing the quickstarts section.

In this mock version, you can see:
- Tutorial cards with titles, descriptions, and metadata
- Different difficulty levels (Beginner, Intermediate, Advanced)
- Progress indicators (Available, In Progress, Completed)
- Estimated completion times
- Interactive hover effects and action buttons

The catalog layout is responsive and follows PatternFly design patterns for optimal user experience.
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    // Test that the component renders without errors
    await expect(canvasElement).toBeInTheDocument();

    // Verify component renders the quickstarts catalog
    await expect(canvasElement.children.length).toBeGreaterThan(0);

    // Check for the main heading
    const heading = canvasElement.querySelector('h2');
    await expect(heading).toBeTruthy();
    await expect(heading?.textContent).toContain('Quick starts');

    // Verify tutorial cards are present
    const tutorialCards = canvasElement.querySelectorAll('[style*="border: 1px solid"]');
    await expect(tutorialCards.length).toBeGreaterThan(0);
  },
};
