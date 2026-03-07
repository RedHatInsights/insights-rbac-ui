import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, within } from 'storybook/test';
import InlineError from './InlineError';

const meta: Meta<typeof InlineError> = {
  component: InlineError,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component: `
InlineError component that displays form validation errors inline.
- Uses PatternFly Alert component with danger variant
- Designed to work with data-driven-forms field API
- Displays title and description from field validation
- Automatically handles field API integration
        `,
      },
    },
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof InlineError>;

// Mock the useFieldApi hook to simulate form field data
const mockFieldApi = {
  title: 'Email Address',
  description: 'This field is required and cannot be empty.',
};

interface InlineErrorWrapperProps {
  title?: string;
  description?: string;
}

// Create a wrapper component that mocks the useFieldApi hook
const InlineErrorWrapper = (props: InlineErrorWrapperProps) => {
  // Mock the useFieldApi hook
  const mockProps = {
    ...props,
    title: mockFieldApi.title,
    description: mockFieldApi.description,
  };

  return <InlineError {...mockProps} />;
};

export const Default: Story = {
  render: () => <InlineErrorWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check that the error message is displayed
    const errorTitle = canvas.getByText('Email Address');
    const errorDescription = canvas.getByText('This field is required and cannot be empty.');

    expect(errorTitle).toBeInTheDocument();
    expect(errorDescription).toBeInTheDocument();
  },
};

export const WithCustomError: Story = {
  render: () => {
    const customProps = {
      title: 'Invalid Email Format',
      description: 'Please enter a valid email address in the format user@domain.com',
    };
    return <InlineError {...customProps} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check that the custom error message is displayed
    const errorTitle = canvas.getByText('Invalid Email Format');
    const errorDescription = canvas.getByText('Please enter a valid email address in the format user@domain.com');

    expect(errorTitle).toBeInTheDocument();
    expect(errorDescription).toBeInTheDocument();
  },
};

export const LongErrorMessage: Story = {
  render: () => {
    const longErrorProps = {
      title: 'Complex Validation Error',
      description:
        'This is a very long error message that demonstrates how the component handles lengthy validation text. It should wrap properly and remain readable within the inline alert component.',
    };
    return <InlineError {...longErrorProps} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Check that the long error message is displayed
    const errorTitle = canvas.getByText('Complex Validation Error');
    const errorDescription = canvas.getByText(/This is a very long error message/);

    expect(errorTitle).toBeInTheDocument();
    expect(errorDescription).toBeInTheDocument();
  },
};

export const InlineErrorSubcomponent: Story = {
  parameters: {
    docs: {
      description: {
        story: `
This story demonstrates how InlineError is typically used as a subcomponent within forms.
The component is designed to work with data-driven-forms and automatically receives field validation data.
        `,
      },
    },
  },
  render: () => (
    <div>
      <h3>InlineError in Form Context</h3>
      <p>
        The InlineError component is designed to be used within data-driven-forms and automatically receives validation error data through the
        useFieldApi hook.
      </p>
      <div style={{ border: '1px solid #ccc', padding: '20px', borderRadius: '4px' }}>
        <h4>Form Field Example</h4>
        <div style={{ marginBottom: '10px' }}>
          <label htmlFor="email">Email Address:</label>
          <input
            id="email"
            type="email"
            style={{
              width: '100%',
              padding: '8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              marginTop: '5px',
            }}
            placeholder="Enter email address"
          />
        </div>
        <InlineErrorWrapper />
      </div>
    </div>
  ),
};
