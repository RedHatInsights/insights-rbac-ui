import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { SilentErrorBoundary } from './SilentErrorBoundary';

const meta: Meta<typeof SilentErrorBoundary> = {
  component: SilentErrorBoundary,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'SilentErrorBoundary catches and silently handles errors that match a specific string pattern. When a matching error occurs, the component renders null instead of crashing.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof SilentErrorBoundary>;

/**
 * Basic usage of SilentErrorBoundary wrapping content
 */
export const Default: Story = {
  args: {
    silentErrorString: 'Network error',
    children: (
      <div style={{ padding: '16px', border: '1px solid #ccc', borderRadius: '4px' }}>
        <h3>Protected Content</h3>
        <p>This content is protected by a SilentErrorBoundary that will silently catch errors containing &quot;Network error&quot;.</p>
        <Button variant="primary">Interactive Button</Button>
      </div>
    ),
  },
};

/**
 * Real-world example: suppressing focus-trap errors in modal components
 */
export const FocusTrapSuppression: Story = {
  render: () => (
    <div style={{ padding: '20px', maxWidth: '600px' }}>
      <Alert variant="info" title="Focus Trap Error Protection" style={{ marginBottom: '16px' }}>
        This demonstrates how SilentErrorBoundary can be used to suppress common focus-trap errors in modal components without disrupting the user
        experience.
      </Alert>

      <SilentErrorBoundary silentErrorString="focus-trap">
        <div
          style={{
            border: '2px dashed #06c',
            padding: '16px',
            borderRadius: '4px',
            background: '#f8f9fa',
          }}
        >
          <h4>Modal Content Protected by SilentErrorBoundary</h4>
          <p>
            This content is protected by an error boundary that will silently catch any focus-trap related errors that commonly occur in modal
            dialogs.
          </p>
          <p>
            Pattern: <code>silentErrorString=&quot;focus-trap&quot;</code>
          </p>
          <Button variant="primary">Focus-able Element</Button>
        </div>
      </SilentErrorBoundary>
    </div>
  ),
};

/**
 * Example with multiple error boundaries handling different error types
 */
export const MultipleErrorBoundaries: Story = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <Alert variant="warning" title="Nested Error Boundaries" style={{ marginBottom: '16px' }}>
        Multiple SilentErrorBoundary components can be nested to handle different types of errors.
      </Alert>

      <SilentErrorBoundary silentErrorString="outer-error">
        <div
          style={{
            border: '2px solid blue',
            padding: '16px',
            margin: '8px',
            borderRadius: '4px',
            background: '#f0f8ff',
          }}
        >
          <h4>Outer Boundary (catches &quot;outer-error&quot;)</h4>
          <p>This boundary will catch errors containing &quot;outer-error&quot;</p>

          <SilentErrorBoundary silentErrorString="validation">
            <div
              style={{
                border: '2px solid green',
                padding: '16px',
                margin: '8px',
                borderRadius: '4px',
                background: '#f0fff0',
              }}
            >
              <h4>Inner Boundary (catches &quot;validation&quot;)</h4>
              <p>This nested boundary specifically handles validation errors</p>
              <Button variant="secondary">Protected Content</Button>
            </div>
          </SilentErrorBoundary>
        </div>
      </SilentErrorBoundary>
    </div>
  ),
};

/**
 * Configuration examples showing different error patterns
 */
export const ConfigurationExamples: Story = {
  render: () => (
    <div style={{ padding: '20px' }}>
      <h3>SilentErrorBoundary Configuration Examples</h3>
      <p>Different configurations for common error patterns:</p>

      <div style={{ display: 'grid', gap: '16px', marginTop: '16px' }}>
        <div style={{ border: '1px solid #ccc', padding: '12px', borderRadius: '4px' }}>
          <h4>Focus Trap Errors</h4>
          <code>{'<SilentErrorBoundary silentErrorString="focus-trap">'}</code>
          <p>Catches: &quot;focus-trap: your focus-trap must have at least one tabbable element&quot;</p>
        </div>

        <div style={{ border: '1px solid #ccc', padding: '12px', borderRadius: '4px' }}>
          <h4>Network Errors</h4>
          <code>{'<SilentErrorBoundary silentErrorString="Network">'}</code>
          <p>Catches: &quot;Network request failed&quot;, &quot;NetworkError&quot;</p>
        </div>

        <div style={{ border: '1px solid #ccc', padding: '12px', borderRadius: '4px' }}>
          <h4>Validation Errors</h4>
          <code>{'<SilentErrorBoundary silentErrorString="validation">'}</code>
          <p>Catches: &quot;validation failed&quot;, &quot;Validation error occurred&quot;</p>
        </div>
      </div>
    </div>
  ),
};

/**
 * Demonstrates the component behavior when no errors occur
 */
export const NoErrors: Story = {
  render: () => (
    <SilentErrorBoundary silentErrorString="test-error">
      <div
        style={{
          padding: '20px',
          border: '2px solid #28a745',
          borderRadius: '4px',
          background: '#d4edda',
        }}
      >
        <h3>✅ Normal Operation</h3>
        <p>When no errors occur, the SilentErrorBoundary is transparent and simply renders its children normally.</p>
        <p>
          The error boundary is active but invisible, ready to catch any errors matching: <code>&quot;test-error&quot;</code>
        </p>
        <Button variant="primary">Everything Working Normally</Button>
      </div>
    </SilentErrorBoundary>
  ),
};
