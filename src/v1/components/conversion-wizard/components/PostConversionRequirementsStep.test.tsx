import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { IntlProvider } from 'react-intl';
import { PostConversionRequirementsStep } from './PostConversionRequirementsStep';

const renderWithIntl = (component: React.ReactElement) => {
  return render(<IntlProvider locale="en">{component}</IntlProvider>);
};

describe('PostConversionRequirementsStep', () => {
  it('renders the main title', () => {
    renderWithIntl(<PostConversionRequirementsStep />);

    expect(screen.getByRole('heading', { name: 'Post-conversion requirements' })).toBeInTheDocument();
  });

  it('renders the introduction paragraph', () => {
    renderWithIntl(<PostConversionRequirementsStep />);

    expect(screen.getByText(/Review your access structure within one week of conversion/i)).toBeInTheDocument();
    expect(screen.getByText(/Default Admin Access and Default Access are fixed by design/i)).toBeInTheDocument();
  });

  it('renders all 5 numbered list items with titles', () => {
    renderWithIntl(<PostConversionRequirementsStep />);

    // Item 1
    expect(screen.getByText(/Know what's fixed/i)).toBeInTheDocument();

    // Item 2
    expect(screen.getByText('Adjust default access roles')).toBeInTheDocument();

    // Item 3
    expect(screen.getByText('Review the Ungrouped hosts workspace')).toBeInTheDocument();

    // Item 4
    expect(screen.getByText('Verify critical user access')).toBeInTheDocument();

    // Item 5
    expect(screen.getByText('Plan workspace structure')).toBeInTheDocument();
  });

  it('renders item 1 description about what is fixed by design', () => {
    renderWithIntl(<PostConversionRequirementsStep />);

    expect(screen.getByText(/Default Admin Access binds at the root workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/Default Access binds at the Default workspace/i)).toBeInTheDocument();
  });

  it('renders item 2 description about adjusting default access roles', () => {
    renderWithIntl(<PostConversionRequirementsStep />);

    expect(screen.getByText(/Default Access carries over whatever roles you had configured/i)).toBeInTheDocument();
  });

  it('renders item 3 description about ungrouped hosts', () => {
    renderWithIntl(<PostConversionRequirementsStep />);

    expect(screen.getByText(/Systems here inherit Default Access's bound roles/i)).toBeInTheDocument();
  });

  it('renders item 4 bullet points about critical user access', () => {
    renderWithIntl(<PostConversionRequirementsStep />);

    expect(screen.getByText(/Confirm 3-5 users across your org can reach their systems/i)).toBeInTheDocument();
    expect(screen.getByText(/Covers Default Admin Access, Default Access, and custom groups/i)).toBeInTheDocument();
  });

  it('renders item 5 with all sub-items about planning workspace structure', () => {
    renderWithIntl(<PostConversionRequirementsStep />);

    expect(screen.getByText(/Create subworkspaces under the Default workspace for:/i)).toBeInTheDocument();
    expect(screen.getByText('High-security production environments')).toBeInTheDocument();
    expect(screen.getByText('Compliance-required isolated systems')).toBeInTheDocument();
    expect(screen.getByText(/Organization Administrators keep access everywhere via Default Admin Access/i)).toBeInTheDocument();
  });
});
