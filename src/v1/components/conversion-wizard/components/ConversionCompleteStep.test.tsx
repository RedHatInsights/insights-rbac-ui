import React from 'react';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { IntlProvider } from 'react-intl';
import { BrowserRouter } from 'react-router-dom';
import { ConversionCompleteStep } from './ConversionCompleteStep';

const mockNavigate = vi.fn();

vi.mock('../../../../shared/hooks/useAppNavigate', () => ({
  default: () => mockNavigate,
}));

const Wrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <IntlProvider locale="en">
    <BrowserRouter>{children}</BrowserRouter>
  </IntlProvider>
);

describe('ConversionCompleteStep', () => {
  beforeEach(() => {
    mockNavigate.mockClear();
  });

  it('shows loading spinner when isLoading is true', () => {
    render(<ConversionCompleteStep isLoading={true} />, { wrapper: Wrapper });

    expect(screen.getByRole('progressbar', { name: /converting organization/i })).toBeInTheDocument();
    expect(screen.getByText(/converting your organization/i)).toBeInTheDocument();
  });

  it('shows success content when isLoading is false', () => {
    render(<ConversionCompleteStep isLoading={false} />, { wrapper: Wrapper });

    expect(screen.getByRole('heading', { name: /conversion complete/i })).toBeInTheDocument();
    expect(screen.getByText(/your organization has been successfully converted to workspace-based access management/i)).toBeInTheDocument();
  });

  it('shows primary button to navigate to dashboard', () => {
    render(<ConversionCompleteStep isLoading={false} />, { wrapper: Wrapper });

    const button = screen.getByRole('button', { name: /go to access management dashboard/i });
    expect(button).toBeInTheDocument();
  });

  it('navigates to overview page when dashboard button is clicked', async () => {
    const user = userEvent.setup();
    render(<ConversionCompleteStep isLoading={false} />, { wrapper: Wrapper });

    const button = screen.getByRole('button', { name: /go to access management dashboard/i });
    await user.click(button);

    expect(mockNavigate).toHaveBeenCalledWith('/user-access/overview');
  });

  it('shows external link to getting started guide', () => {
    render(<ConversionCompleteStep isLoading={false} />, { wrapper: Wrapper });

    const link = screen.getByRole('link', { name: /getting started with access management/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute(
      'href',
      'https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf',
    );
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('shows external link icon on getting started link', () => {
    render(<ConversionCompleteStep isLoading={false} />, { wrapper: Wrapper });

    const link = screen.getByRole('link', { name: /getting started with access management/i });
    const icon = link.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('shows success icon when not loading', () => {
    const { container } = render(<ConversionCompleteStep isLoading={false} />, { wrapper: Wrapper });

    // CheckCircleIcon should be present
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('does not show success content when loading', () => {
    render(<ConversionCompleteStep isLoading={true} />, { wrapper: Wrapper });

    expect(screen.queryByRole('heading', { name: /conversion complete/i })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: /go to access management dashboard/i })).not.toBeInTheDocument();
  });
});
