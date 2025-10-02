import React, { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-webpack5';
import { expect, userEvent, within } from 'storybook/test';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import WizardContext from '@data-driven-forms/react-form-renderer/wizard-context';
import { WizardError } from './WizardError';

// Wrapper component for interactive testing
const WizardErrorWrapper: React.FC<{
  title?: string;
  text?: string;
  customFooter?: React.ReactElement;
}> = ({ title = 'Something went wrong', text = 'An error occurred while processing your request.', customFooter }) => {
  const [errorCleared, setErrorCleared] = useState(false);
  const [jumpedToStep, setJumpedToStep] = useState<number | null>(null);

  const mockContext = {
    setWizardError: () => {
      setErrorCleared(true);
      console.log('Wizard error cleared');
    },
  };

  // Mock the wizard context to capture jumpToStep calls
  const mockWizardContextValue = {
    jumpToStep: (step: number) => {
      setJumpedToStep(step);
      console.log(`Jumped to step: ${step}`);
    },
    formOptions: {} as any,
    crossroads: [],
    currentStep: {
      fields: [],
      name: 'current-step',
      title: 'Current Step',
    },
    handlePrev: () => {},
    handleNext: () => {},
    navSchema: [],
    activeStepIndex: 0,
    maxStepIndex: 0,
    isDynamic: false,
    prevSteps: [],
    onKeyDown: () => {},
    setPrevSteps: () => {},
  };

  return (
    <WizardContext.Provider value={mockWizardContextValue}>
      <div style={{ padding: '20px', maxWidth: '600px' }}>
        {errorCleared && (
          <div
            data-testid="error-cleared-message"
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#f0f8f0',
              border: '1px solid #4caf50',
              borderRadius: '4px',
            }}
          >
            ✓ Error was cleared successfully
          </div>
        )}
        {jumpedToStep !== null && (
          <div
            data-testid="step-jumped-message"
            style={{
              marginBottom: '16px',
              padding: '12px',
              backgroundColor: '#e3f2fd',
              border: '1px solid #2196f3',
              borderRadius: '4px',
            }}
          >
            🔄 Jumped to step: {jumpedToStep}
          </div>
        )}

        {!errorCleared && <WizardError context={mockContext} title={title} text={text} customFooter={customFooter} />}
      </div>
    </WizardContext.Provider>
  );
};

const meta: Meta<typeof WizardError> = {
  component: WizardError,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          'WizardError displays error states in wizard workflows with retry functionality. It provides a standardized way to show errors and allow users to return to the first step of a wizard.',
      },
    },
  },
};

export default meta;
type Story = StoryObj<typeof WizardError>;

/**
 * Basic wizard error with default retry button
 */
export const Default: Story = {
  render: () => <WizardErrorWrapper title="Operation Failed" text="Unable to create the resource. Please check your inputs and try again." />,
};

/**
 * Interactive demo with play function testing error clearing and step jumping
 */
export const InteractiveDemo: Story = {
  render: () => (
    <WizardErrorWrapper title="Network Error" text="Connection to the server was lost. Please check your network connection and try again." />
  ),
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for component to render
    await expect(canvas.getByText('Network Error')).toBeInTheDocument();

    // Find and click the retry button
    const retryButton = canvas.getByRole('button', { name: /return to step 1/i });
    await userEvent.click(retryButton);

    // Verify error was cleared and step was jumped
    await expect(canvas.getByTestId('error-cleared-message')).toBeInTheDocument();
    await expect(canvas.getByTestId('step-jumped-message')).toBeInTheDocument();
    await expect(canvas.getByTestId('step-jumped-message')).toHaveTextContent('Jumped to step: 0');
  },
};

/**
 * Wizard error with custom footer actions
 */
export const CustomFooter: Story = {
  render: () => {
    const customFooter = (
      <div style={{ display: 'flex', gap: '12px' }}>
        <Button variant="primary" onClick={() => console.log('Custom retry')}>
          Try Again
        </Button>
        <Button variant="secondary" onClick={() => console.log('Contact support')}>
          Contact Support
        </Button>
        <Button variant="link" onClick={() => console.log('Cancel')}>
          Cancel
        </Button>
      </div>
    );

    return (
      <WizardErrorWrapper
        title="Critical Error"
        text="A critical error has occurred that requires immediate attention."
        customFooter={customFooter}
      />
    );
  },
};
