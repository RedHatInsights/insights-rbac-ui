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

    expect(
      screen.getByText(
        /After converting to access management, it is critical to review your organizational structure and permissions, and edit access/i,
      ),
    ).toBeInTheDocument();
    expect(screen.getByText(/within one week after conversion/i)).toBeInTheDocument();
  });

  it('renders all 5 numbered list items with titles', () => {
    renderWithIntl(<PostConversionRequirementsStep />);

    // Item 1
    expect(screen.getByText('Understand default workspace scope')).toBeInTheDocument();

    // Item 2
    expect(screen.getByText('Review Ungrouped hosts workspace')).toBeInTheDocument();

    // Item 3
    expect(screen.getByText('Verify critical user access')).toBeInTheDocument();

    // Item 4
    expect(screen.getByText('Review root workspace permissions')).toBeInTheDocument();

    // Item 5
    expect(screen.getByText('Plan workspace structure')).toBeInTheDocument();
  });

  it('renders item 1 description about default workspace scope', () => {
    renderWithIntl(<PostConversionRequirementsStep />);

    expect(screen.getByText(/Default access and any custom default access groups now only applies to the default workspace/i)).toBeInTheDocument();
    expect(screen.getByText(/Go to Users and Groups and review who is in the Default access/i)).toBeInTheDocument();
  });

  it('renders item 2 description about ungrouped hosts', () => {
    renderWithIntl(<PostConversionRequirementsStep />);

    expect(screen.getByText(/Systems here inherit Default access permissions/i)).toBeInTheDocument();
  });

  it('renders item 3 bullet points about critical user access', () => {
    renderWithIntl(<PostConversionRequirementsStep />);

    expect(screen.getByText(/Confirm that key users in your organization can access their systems/i)).toBeInTheDocument();
    expect(screen.getByText(/Focus on users in Default Admin Access, Default Access, and custom groups/i)).toBeInTheDocument();
  });

  it('renders item 4 description about root workspace permissions', () => {
    renderWithIntl(<PostConversionRequirementsStep />);

    expect(screen.getByText(/Typically, only Organization Administrators should have access to the root workspace/i)).toBeInTheDocument();
  });

  it('renders item 5 with all sub-items about planning workspace structure', () => {
    renderWithIntl(<PostConversionRequirementsStep />);

    expect(screen.getByText(/Consider creating subworkspaces to the default workspace for:/i)).toBeInTheDocument();
    expect(screen.getByText('High-security production environments')).toBeInTheDocument();
    expect(screen.getByText('Compliance-required isolated systems')).toBeInTheDocument();
    expect(screen.getByText('Environments where Default Admin Access should NOT have access')).toBeInTheDocument();
    expect(screen.getByText('Sketch your ideal structure before implementing')).toBeInTheDocument();
  });
});
