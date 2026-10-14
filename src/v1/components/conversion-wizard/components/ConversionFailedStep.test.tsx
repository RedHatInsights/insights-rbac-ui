import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { IntlProvider } from 'react-intl';
import { ConversionFailedStep } from './ConversionFailedStep';

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => <IntlProvider locale="en">{children}</IntlProvider>;

describe('ConversionFailedStep', () => {
  it('shows the failure heading and message', () => {
    render(<ConversionFailedStep />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { name: /conversion failed/i })).toBeInTheDocument();
    expect(screen.getByText(/check the troubleshooting documentation or contact support for help/i)).toBeInTheDocument();
  });

  it('links to the troubleshooting documentation in a new tab', () => {
    render(<ConversionFailedStep />, { wrapper: Wrapper });

    const link = screen.getByRole('link', { name: /troubleshooting with access management/i });
    expect(link).toHaveAttribute(
      'href',
      'https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf#page=1',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows the error detail under the generic message when one is given', () => {
    render(<ConversionFailedStep detail="You must be an Organization Administrator to convert." />, { wrapper: Wrapper });

    const generic = screen.getByText(/check the troubleshooting documentation or contact support for help/i);
    const detail = screen.getByText('You must be an Organization Administrator to convert.');

    expect(detail).toBeInTheDocument();
    // Order matters: the detail explains the generic message, so it has to follow it.
    expect(generic.compareDocumentPosition(detail) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it('omits the detail paragraph when no detail is given', () => {
    const { container } = render(<ConversionFailedStep />, { wrapper: Wrapper });

    expect(container.querySelector('small')).not.toBeInTheDocument();
  });

  it('does not show any success content', () => {
    render(<ConversionFailedStep />, { wrapper: Wrapper });

    expect(screen.queryByRole('heading', { name: /conversion complete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /go to access management dashboard/i })).not.toBeInTheDocument();
  });
});
