import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { IntlProvider } from 'react-intl';
import { IntroductionStep } from './IntroductionStep';

const renderWithIntl = (component: React.ReactElement) => {
  return render(<IntlProvider locale="en">{component}</IntlProvider>);
};

describe('IntroductionStep', () => {
  it('renders all section titles', () => {
    renderWithIntl(<IntroductionStep />);

    expect(screen.getByText('What changes during conversion')).toBeInTheDocument();
    expect(screen.getByText('During conversion a workspace hierarchy will be created')).toBeInTheDocument();
    expect(screen.getByText('How permissions change')).toBeInTheDocument();
    expect(screen.getByText('How role bindings work')).toBeInTheDocument();
    expect(screen.getByText('Legacy remediation plans will be deleted')).toBeInTheDocument();
  });

  it('renders workspace hierarchy description list items', () => {
    renderWithIntl(<IntroductionStep />);

    expect(screen.getByText('Root workspace')).toBeInTheDocument();
    expect(screen.getByText('Created at the top level for organization access')).toBeInTheDocument();

    expect(screen.getByText('Default workspace')).toBeInTheDocument();
    expect(screen.getByText('Created under Root, existing workspaces move here as sub workspaces')).toBeInTheDocument();

    expect(screen.getByText('Existing workspaces')).toBeInTheDocument();
    expect(screen.getByText('Moved under the default workspace. Configured permissions are preserved.')).toBeInTheDocument();

    expect(screen.getByText('Ungrouped hosts workspace')).toBeInTheDocument();
    expect(screen.getByText('Created under Default for existing systems not yet in a workspace')).toBeInTheDocument();
  });

  it('renders permissions change description list items', () => {
    renderWithIntl(<IntroductionStep />);

    expect(screen.getByText('Default Admin access')).toBeInTheDocument();
    expect(screen.getByText('Scoped to root workspace (all workspaces)')).toBeInTheDocument();

    expect(screen.getByText('Default Access')).toBeInTheDocument();
    expect(screen.getByText('Scoped to default workspace and sub workspaces only')).toBeInTheDocument();

    expect(screen.getByText('Custom groups')).toBeInTheDocument();
    expect(screen.getByText('Preserved with all memberships intact')).toBeInTheDocument();
  });

  it('renders role bindings description list items', () => {
    renderWithIntl(<IntroductionStep />);

    expect(screen.getByText('A role binding connects:')).toBeInTheDocument();

    expect(screen.getByText('Who')).toBeInTheDocument();
    expect(screen.getByText('User group')).toBeInTheDocument();

    expect(screen.getByText('What')).toBeInTheDocument();
    expect(screen.getByText('Role (permissions)')).toBeInTheDocument();

    expect(screen.getByText('Where')).toBeInTheDocument();
    expect(screen.getByText('Workspace')).toBeInTheDocument();
  });

  it('renders all three diagrams with correct alt text', () => {
    renderWithIntl(<IntroductionStep />);

    const diagrams = screen.getAllByRole('img');
    expect(diagrams).toHaveLength(3);

    expect(diagrams[0]).toHaveAttribute('alt', 'Workspace hierarchy diagram');
    expect(diagrams[1]).toHaveAttribute('alt', 'Permissions and workspace hierarchy diagram');
    expect(diagrams[2]).toHaveAttribute('alt', 'Role bindings example diagram');
  });

  it('renders links with correct hrefs', () => {
    renderWithIntl(<IntroductionStep />);

    const gettingStartedLink = screen.getByText('Getting Started with Access Management');
    expect(gettingStartedLink).toHaveAttribute(
      'href',
      'https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf#page=1'
    );
    expect(gettingStartedLink).toHaveAttribute('target', '_blank');
    expect(gettingStartedLink).toHaveAttribute('rel', 'noopener noreferrer');

    const roleBindingsLink = screen.getByText('How role bindings work');
    expect(roleBindingsLink).toHaveAttribute(
      'href',
      'https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf#page=21'
    );
    expect(roleBindingsLink).toHaveAttribute('target', '_blank');
    expect(roleBindingsLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders introduction text with workspaces in bold', () => {
    renderWithIntl(<IntroductionStep />);

    expect(
      screen.getByText(/new access management model replaces the legacy User Access feature/i)
    ).toBeInTheDocument();

    const workspacesText = screen.getByText('workspaces');
    expect(workspacesText.tagName).toBe('STRONG');
  });
});
