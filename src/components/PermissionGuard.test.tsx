import React from 'react';
import { render, screen } from '@testing-library/react';
import { type Mock, beforeEach, describe, expect, it, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import { IntlProvider } from 'react-intl';
import PermissionGuard from './PermissionGuard';
import PermissionsContext from '../utilities/permissionsContext';

// Mock the usePermissions hook
vi.mock('@redhat-cloud-services/frontend-components-utilities/RBACHook', () => ({
  __esModule: true,
  default: vi.fn(),
}));

// Mock the components to simplify testing
vi.mock('@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess', () => ({
  __esModule: true,
  default: ({ serviceName, bodyText }: { serviceName: string; bodyText: string }) => (
    <div data-testid="unauthorized-access">
      <span data-testid="service-name">{serviceName}</span>
      <span data-testid="body-text">{bodyText}</span>
    </div>
  ),
}));

vi.mock('./ui-states/LoaderPlaceholders', () => ({
  AppPlaceholder: () => <div data-testid="loading-placeholder">Loading...</div>,
}));

// Import the mocked hook for type-safe manipulation
import usePermissions from '@redhat-cloud-services/frontend-components-utilities/RBACHook';

const mockUsePermissions = usePermissions as Mock;

// Wrapper component that provides both IntlProvider and PermissionsContext
const TestWrapper: React.FC<{ children: React.ReactNode; contextValue?: { orgAdmin: boolean; userAccessAdministrator: boolean } }> = ({
  children,
  contextValue = { orgAdmin: false, userAccessAdministrator: false },
}) => (
  <IntlProvider locale="en">
    <PermissionsContext.Provider value={contextValue}>{children}</PermissionsContext.Provider>
  </IntlProvider>
);

// Helper to render with both IntlProvider and PermissionsContext
const renderWithProviders = (ui: React.ReactNode, contextValue = { orgAdmin: false, userAccessAdministrator: false }) => {
  return render(<TestWrapper contextValue={contextValue}>{ui}</TestWrapper>);
};

describe('PermissionGuard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('shows loading placeholder while permissions are being checked', () => {
      mockUsePermissions.mockReturnValue({ hasAccess: undefined, isLoading: true });

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
      mockUsePermissions.mockReturnValue({ hasAccess: false, isLoading: false });

      renderWithProviders(
        <PermissionGuard permissions={['rbac:role:write']}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>,
      );

      expect(screen.getByTestId('unauthorized-access')).toBeInTheDocument();
      expect(screen.getByTestId('service-name')).toHaveTextContent('this page');
      expect(screen.getByTestId('body-text')).toHaveTextContent("You don't have permission to view this page.");
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });
  });

  describe('authorized state', () => {
    it('renders children when user has required permissions', () => {
      mockUsePermissions.mockReturnValue({ hasAccess: true, isLoading: false });

      renderWithProviders(
        <PermissionGuard permissions={['rbac:role:read']}>
          <div data-testid="protected-content">Protected Content</div>
        </PermissionGuard>,
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('unauthorized-access')).not.toBeInTheDocument();
      expect(screen.queryByTestId('loading-placeholder')).not.toBeInTheDocument();
    });
  });

  describe('empty permissions (public routes)', () => {
    it('renders children immediately without permission check when permissions array is empty', () => {
      mockUsePermissions.mockReturnValue({ hasAccess: false, isLoading: false });

      renderWithProviders(
        <PermissionGuard permissions={[]}>
          <div data-testid="public-content">Public Content</div>
        </PermissionGuard>,
      );

      // Should render children even though hasAccess is false
      expect(screen.getByTestId('public-content')).toBeInTheDocument();
      expect(screen.queryByTestId('unauthorized-access')).not.toBeInTheDocument();
    });

    it('passes dummy permission to hook when permissions array is empty', () => {
      mockUsePermissions.mockReturnValue({ hasAccess: true, isLoading: false });

      renderWithProviders(
        <PermissionGuard permissions={[]}>
          <div>Content</div>
        </PermissionGuard>,
      );

      // Hook should be called with dummy permission to keep hook order consistent
      expect(mockUsePermissions).toHaveBeenCalledWith('rbac', ['rbac:*:*'], false, true);
    });
  });

  describe('checkAll logic', () => {
    it('uses AND logic by default (checkAll=true)', () => {
      mockUsePermissions.mockReturnValue({ hasAccess: true, isLoading: false });

      renderWithProviders(
        <PermissionGuard permissions={['rbac:role:read', 'rbac:group:read']}>
          <div>Content</div>
        </PermissionGuard>,
      );

      // Should pass checkAll=true (4th argument) by default
      expect(mockUsePermissions).toHaveBeenCalledWith(
        'rbac',
        ['rbac:role:read', 'rbac:group:read'],
        false,
        true, // checkAll=true (AND logic)
      );
    });

    it('uses OR logic when checkAll=false', () => {
      mockUsePermissions.mockReturnValue({ hasAccess: true, isLoading: false });

      renderWithProviders(
        <PermissionGuard permissions={['rbac:role:read', 'rbac:group:read']} checkAll={false}>
          <div>Content</div>
        </PermissionGuard>,
      );

      // Should pass checkAll=false (4th argument)
      expect(mockUsePermissions).toHaveBeenCalledWith(
        'rbac',
        ['rbac:role:read', 'rbac:group:read'],
        false,
        false, // checkAll=false (OR logic)
      );
    });
  });

  describe('hook call order (Rules of Hooks compliance)', () => {
    it('always calls usePermissions even for public routes', () => {
      mockUsePermissions.mockReturnValue({ hasAccess: true, isLoading: false });

      renderWithProviders(
        <PermissionGuard permissions={[]}>
          <div>Content</div>
        </PermissionGuard>,
      );

      // Hook should always be called to maintain consistent hook order
      expect(mockUsePermissions).toHaveBeenCalled();
    });
  });

  describe('requireOrgAdmin', () => {
    it('renders children when orgAdmin is true and requireOrgAdmin is true', () => {
      mockUsePermissions.mockReturnValue({ hasAccess: true, isLoading: false });

      renderWithProviders(
        <PermissionGuard permissions={[]} requireOrgAdmin={true}>
          <div data-testid="protected-content">Org Admin Content</div>
        </PermissionGuard>,
        { orgAdmin: true, userAccessAdministrator: false },
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
      expect(screen.queryByTestId('unauthorized-access')).not.toBeInTheDocument();
    });

    it('shows UnauthorizedAccess when orgAdmin is false and requireOrgAdmin is true', () => {
      mockUsePermissions.mockReturnValue({ hasAccess: true, isLoading: false });

      renderWithProviders(
        <PermissionGuard permissions={[]} requireOrgAdmin={true}>
          <div data-testid="protected-content">Org Admin Content</div>
        </PermissionGuard>,
        { orgAdmin: false, userAccessAdministrator: false },
      );

      expect(screen.getByTestId('unauthorized-access')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('checks both orgAdmin and granular permissions when both are specified', () => {
      mockUsePermissions.mockReturnValue({ hasAccess: true, isLoading: false });

      renderWithProviders(
        <PermissionGuard permissions={['rbac:role:read']} requireOrgAdmin={true}>
          <div data-testid="protected-content">Content</div>
        </PermissionGuard>,
        { orgAdmin: true, userAccessAdministrator: false },
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });

    it('fails when orgAdmin is true but granular permissions are missing', () => {
      mockUsePermissions.mockReturnValue({ hasAccess: false, isLoading: false });

      renderWithProviders(
        <PermissionGuard permissions={['rbac:role:write']} requireOrgAdmin={true}>
          <div data-testid="protected-content">Content</div>
        </PermissionGuard>,
        { orgAdmin: true, userAccessAdministrator: false },
      );

      expect(screen.getByTestId('unauthorized-access')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('fails when granular permissions pass but orgAdmin is false', () => {
      mockUsePermissions.mockReturnValue({ hasAccess: true, isLoading: false });

      renderWithProviders(
        <PermissionGuard permissions={['rbac:role:read']} requireOrgAdmin={true}>
          <div data-testid="protected-content">Content</div>
        </PermissionGuard>,
        { orgAdmin: false, userAccessAdministrator: false },
      );

      expect(screen.getByTestId('unauthorized-access')).toBeInTheDocument();
      expect(screen.queryByTestId('protected-content')).not.toBeInTheDocument();
    });

    it('ignores orgAdmin check when requireOrgAdmin is false (default)', () => {
      mockUsePermissions.mockReturnValue({ hasAccess: true, isLoading: false });

      renderWithProviders(
        <PermissionGuard permissions={['rbac:role:read']}>
          <div data-testid="protected-content">Content</div>
        </PermissionGuard>,
        { orgAdmin: false, userAccessAdministrator: false },
      );

      expect(screen.getByTestId('protected-content')).toBeInTheDocument();
    });
  });
});
