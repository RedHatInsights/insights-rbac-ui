import React from 'react';
import { render, screen } from '@testing-library/react';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { IntlProvider } from 'react-intl';
import { PermissionGuard } from './PermissionGuard';

vi.mock('../hooks/useAccessPermissions', () => ({
  useAccessPermissions: vi.fn(),
}));

vi.mock('../hooks/useUserData', () => ({
  __esModule: true,
  default: vi.fn(),
}));

vi.mock('@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess', () => ({
  __esModule: true,
  default: ({ serviceName, bodyText }: { serviceName: string; bodyText: string }) => (
    <div data-testid="unauthorized-access">
      <span data-testid="service-name">{serviceName}</span>
      <span data-testid="body-text">{bodyText}</span>
    </div>
  ),
}));

vi.mock('../../shared/components/ui-states/LoaderPlaceholders', () => ({
  AppPlaceholder: () => <div data-testid="loading-placeholder">Loading...</div>,
}));

import { useAccessPermissions } from '../hooks/useAccessPermissions';
import useUserData from '../hooks/useUserData';

const mockUseAccessPermissions = useAccessPermissions as Mock;
const mockUseUserData = useUserData as Mock;

const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => <IntlProvider locale="en">{children}</IntlProvider>;

const defaultUserData = { orgAdmin: false, ready: true, userAccessAdministrator: false, entitlements: {} };

const renderWithProviders = (ui: React.ReactNode, userData = defaultUserData) => {
  mockUseUserData.mockReturnValue(userData);
  return render(<TestWrapper>{ui}</TestWrapper>);
};

describe('PermissionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUserData.mockReturnValue(defaultUserData);
  });

  describe('loading state', () => {
    it('shows loading placeholder while permissions are being checked', () => {
      mockUseAccessPermissions.mockReturnValue({ hasAccess: undefined, isLoading: true });
      renderWithProviders(
        <PermissionGuard permissions={['rbac:role:read']}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>,
      );
      expect(screen.getByTestId('loading-placeholder')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('unauthorized state', () => {
    it('shows UnauthorizedAccess when user lacks required permissions', () => {
      mockUseAccessPermissions.mockReturnValue({ hasAccess: false, isLoading: false });
      renderWithProviders(
        <PermissionGuard permissions={['rbac:role:write']}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>,
      );
      expect(screen.getByTestId('unauthorized-access')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('authorized state', () => {
    it('renders children when user has required permissions', () => {
      mockUseAccessPermissions.mockReturnValue({ hasAccess: true, isLoading: false });
      renderWithProviders(
        <PermissionGuard permissions={['rbac:role:read']}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>,
      );
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });

  describe('empty permissions (public routes)', () => {
    it('renders children immediately without permission check when permissions array is empty', () => {
      mockUseAccessPermissions.mockReturnValue({ hasAccess: false, isLoading: false });
      renderWithProviders(
        <PermissionGuard permissions={[]}>
          <div data-testid="public-content">Public Content</div>
        </PermissionGuard>,
      );
      expect(screen.getByTestId('public-content')).toBeInTheDocument();
    });
  });

  describe('requireOrgAdmin', () => {
    it('renders children when orgAdmin is true and requireOrgAdmin is true', () => {
      mockUseAccessPermissions.mockReturnValue({ hasAccess: true, isLoading: false });
      renderWithProviders(
        <PermissionGuard permissions={[]} requireOrgAdmin={true}>
          <div data-testid="protected-content">Org Admin Content</div>
        </PermissionGuard>,
        { orgAdmin: true, ready: true, userAccessAdministrator: false, entitlements: {} },
      );
      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('shows UnauthorizedAccess when orgAdmin is false and requireOrgAdmin is true', () => {
      mockUseAccessPermissions.mockReturnValue({ hasAccess: true, isLoading: false });
      renderWithProviders(
        <PermissionGuard permissions={[]} requireOrgAdmin={true}>
          <div data-testid="protected-content">Org Admin Content</div>
        </PermissionGuard>,
        { orgAdmin: false, ready: true, userAccessAdministrator: false, entitlements: {} },
      );
      expect(screen.getByTestId('unauthorized-access')).toBeInTheDocument();
    });
  });
});
