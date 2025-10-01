import type { Meta, StoryObj } from '@storybook/react-webpack5';
import React from 'react';
import { MemoryRouter } from 'react-router-dom';
import { AppLink } from './AppLink';

const meta = {
  component: AppLink,
  // This component will have an automatically generated Autodocs entry: https://storybook.js.org/docs/writing-docs/autodocs
  tags: ['autodocs'],
  parameters: {
    // More on how to position stories at: https://storybook.js.org/docs/configure/story-layout
    docs: {
      description: {
        component: `
AppLink is a wrapper around react-router-dom's Link component that automatically handles basename routing for the application.
It merges the provided 'to' prop with the current app's basename to ensure proper navigation within the Red Hat Console environment.

## Features
- Automatically resolves app basename from Chrome service
- Supports both string and object 'to' props
- Handles path merging with proper "/" cleanup
- Custom basename override support
- Forward ref support
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <MemoryRouter>
        <div style={{ padding: '20px' }}>
          <Story />
        </div>
      </MemoryRouter>
    ),
  ],
  args: {
    children: 'Navigation Link',
    to: '/example-path',
  },
  argTypes: {
    to: {
      description: 'The destination path or location object for navigation',
      control: 'text',
    },
    linkBasename: {
      description: 'Custom basename to override the default app basename',
      control: 'text',
    },
    children: {
      description: 'Content to display inside the link',
      control: 'text',
    },
    className: {
      description: 'CSS class name for styling',
      control: 'text',
    },
  },
} satisfies Meta<typeof AppLink>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Basic usage of AppLink with a simple string path
 */
export const Default: Story = {
  args: {
    children: 'Go to Dashboard',
    to: '/dashboard',
  },
};

/**
 * AppLink with a custom basename override
 */
export const CustomBasename: Story = {
  args: {
    children: 'External Service Link',
    to: '/external-page',
    linkBasename: '/custom-app',
  },
};

/**
 * AppLink with nested path
 */
export const NestedPath: Story = {
  args: {
    children: 'View User Details',
    to: '/users/123/details',
  },
};

/**
 * AppLink with root path
 */
export const RootPath: Story = {
  args: {
    children: 'Home',
    to: '/',
  },
};

/**
 * AppLink with query parameters
 */
export const WithQueryParams: Story = {
  args: {
    children: 'Search Results',
    to: '/search?q=test&category=users',
  },
};

/**
 * AppLink with custom styling
 */
export const Styled: Story = {
  args: {
    children: 'Styled Link',
    to: '/styled-page',
    className: 'custom-link-class',
    style: {
      color: '#0066cc',
      textDecoration: 'underline',
      fontWeight: 'bold',
    },
  },
};

/**
 * AppLink demonstrating the path merging functionality
 */
export const PathMerging: Story = {
  render: () => (
    <div>
      <h3>Path Merging Examples:</h3>
      <ul style={{ listStyle: 'none', padding: 0 }}>
        <li style={{ marginBottom: '8px' }}>
          <AppLink to="/simple-path">Simple Path</AppLink>
          <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>→ /iam/user-access/simple-path</span>
        </li>
        <li style={{ marginBottom: '8px' }}>
          <AppLink to="nested/deep/path">Nested Path (no leading slash)</AppLink>
          <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>→ /iam/user-access/nested/deep/path</span>
        </li>
        <li style={{ marginBottom: '8px' }}>
          <AppLink to="/" linkBasename="/custom">
            Custom Basename
          </AppLink>
          <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>→ /custom/</span>
        </li>
        <li style={{ marginBottom: '8px' }}>
          <AppLink to="/with//double//slashes">Double Slashes Cleanup</AppLink>
          <span style={{ marginLeft: '10px', color: '#666', fontSize: '12px' }}>→ /iam/user-access/with/double/slashes</span>
        </li>
      </ul>
    </div>
  ),
};
