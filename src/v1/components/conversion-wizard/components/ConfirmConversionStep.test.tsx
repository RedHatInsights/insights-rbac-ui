import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { IntlProvider } from 'react-intl';
import { ConfirmConversionStep } from './ConfirmConversionStep';

const renderWithIntl = (component: React.ReactElement) => {
  return render(<IntlProvider locale="en">{component}</IntlProvider>);
};

describe('ConfirmConversionStep', () => {
  it('renders the main title', () => {
    renderWithIntl(<ConfirmConversionStep />);

    expect(screen.getByRole('heading', { name: 'Confirm conversion' })).toBeInTheDocument();
  });

  it('renders the warning banner with correct title and description', () => {
    renderWithIntl(<ConfirmConversionStep />);

    expect(screen.getByRole('heading', { name: /Warning alert: Conversion is permanent/i })).toBeInTheDocument();
    expect(screen.getByText(/Once you convert to workspace-based access management, you cannot revert/i)).toBeInTheDocument();
  });

  it('renders the introduction paragraph', () => {
    renderWithIntl(<ConfirmConversionStep />);

    expect(screen.getByText(/You are about to convert your organization from User Access/i)).toBeInTheDocument();
  });

  it('renders all 4 action items', () => {
    renderWithIntl(<ConfirmConversionStep />);

    expect(screen.getByText(/Create a workspace hierarchy \(root, default, and ungrouped assets workspaces\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Convert all existing permissions to role bindings/i)).toBeInTheDocument();
    expect(screen.getByText(/Preserve all user groups and role assignments/i)).toBeInTheDocument();
    expect(screen.getByText(/Change the scope of Default Admin Access and Default Access groups/i)).toBeInTheDocument();
  });

  it('renders the confirmation question', () => {
    renderWithIntl(<ConfirmConversionStep />);

    expect(screen.getByText(/Are you sure you wish to move forward with this conversion/i)).toBeInTheDocument();
  });

  it('warning banner should not have a close button (non-dismissable)', () => {
    renderWithIntl(<ConfirmConversionStep />);

    // Check that there are no close buttons in the alert
    const closeButtons = screen.queryAllByRole('button', { name: /close/i });
    expect(closeButtons).toHaveLength(0);
  });
});
