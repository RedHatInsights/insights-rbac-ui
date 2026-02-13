import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Iam } from '../../../Iam';
import { FakeAddressBar } from './FakeAddressBar';
import { FrontendYamlNavigation } from './FrontendYamlNavigation';
import { ProductionHeader } from './ProductionHeader';
import { GlobalBreadcrumb } from './GlobalBreadcrumb';
import { Page, PageSidebar, PageSidebarBody } from '@patternfly/react-core';

/**
 * Common permission presets for Kessel journey stories.
 * Use these instead of boolean flags for explicit permission testing.
 */
export const KESSEL_PERMISSIONS = {
  /** Full admin - can do everything */
  FULL_ADMIN: ['rbac:*:*', 'inventory:groups:read', 'inventory:groups:write'],
  /** Read-only - can view workspaces but not create/edit */
  READ_ONLY: ['rbac:group:read', 'rbac:role:read', 'inventory:groups:read'],
  /** Workspace admin - can manage workspaces */
  WORKSPACE_ADMIN: ['inventory:groups:read', 'inventory:groups:write'],
  /** User viewer - can only view users (rbac:principal:read) */
  USER_VIEWER: ['rbac:principal:read'],
  /** No permissions - should see unauthorized */
  NONE: [],
} as const;

interface KesselAppEntryWithRouterProps {
  initialRoute?: string;
  typingDelay?: number;
  /** Required: Explicit permissions (rbac:*, inventory:*, etc.) - use KESSEL_PERMISSIONS presets or custom array */
  permissions?: readonly string[];
  /** User identity: is this user an org admin? (separate from permissions) */
  orgAdmin?: boolean;
  /** Environment: 'staging' (default) or 'production' */
  environment?: 'staging' | 'production';
  'platform.rbac.workspaces'?: boolean;
  'platform.rbac.workspaces-list'?: boolean;
  'platform.rbac.workspace-hierarchy'?: boolean;
  'platform.rbac.workspaces-role-bindings'?: boolean;
  'platform.rbac.workspaces-role-bindings-write'?: boolean;
  'platform.rbac.workspaces-organization-management'?: boolean;
  'platform.rbac.group-service-accounts'?: boolean;
  'platform.rbac.group-service-accounts.stable'?: boolean;
  'platform.rbac.common-auth-model'?: boolean;
  'platform.rbac.common.userstable'?: boolean;
}

/**
 * Wrapper component for Kessel (Workspaces) journey tests.
 * Uses the production Iam component directly for maximum fidelity.
 * testMode enables test-friendly QueryClient settings (no cache, no retries)
 * while keeping full error handling wired up (403/500 → ApiErrorBoundary).
 * Uses KesselNavigation instead of LeftNavigation to include Workspaces link.
 */
export const KesselAppEntryWithRouter: React.FC<KesselAppEntryWithRouterProps> = ({ initialRoute = '/iam/user-access/groups' }) => {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      {/* FakeAddressBar must be outside Page to avoid z-index conflicts with masthead */}
      <FakeAddressBar />
      <Page
        masthead={<ProductionHeader />}
        sidebar={
          <PageSidebar>
            <PageSidebarBody>
              <FrontendYamlNavigation />
            </PageSidebarBody>
          </PageSidebar>
        }
      >
        <GlobalBreadcrumb />
        <Routes>
          <Route path="/iam/*" element={<Iam testMode />} />
        </Routes>
      </Page>
    </MemoryRouter>
  );
};

/**
 * Helper to create dynamic environment parameters from story args.
 *
 * Requires explicit permissions - no magic derivation from boolean flags.
 * - `permissions`: What the user can DO (authorization) - supports rbac:*, inventory:*, etc.
 * - `orgAdmin`: Who the user IS (identity for user profile)
 */
export const createDynamicEnvironment = (args: KesselAppEntryWithRouterProps) => {
  const permissions = args.permissions;
  if (!permissions) {
    throw new Error('permissions is required - use KESSEL_PERMISSIONS presets or provide explicit array');
  }

  // Derive write capability from permissions (has any :write or :* permission)
  const hasWritePermissions = permissions.some((p) => p.includes(':write') || p.includes(':*') || p === 'rbac:*:*');

  // Default workspace IDs from the fixtures - used by useSelfAccessCheck mock
  // Stories using different fixtures should override workspacePermissions
  const DEFAULT_WORKSPACE_IDS = ['root-1', 'ws-1', 'ws-2', 'ws-3'];
  const allGranted = {
    view: DEFAULT_WORKSPACE_IDS,
    edit: DEFAULT_WORKSPACE_IDS,
    delete: DEFAULT_WORKSPACE_IDS,
    create: DEFAULT_WORKSPACE_IDS,
    move: DEFAULT_WORKSPACE_IDS,
    rename: DEFAULT_WORKSPACE_IDS,
  };
  const allDenied = { view: [], edit: [], delete: [], create: [], move: [], rename: [] };
  const workspacePermissions = hasWritePermissions ? allGranted : allDenied;

  // orgAdmin is explicit - controls user identity, not permissions
  const isOrgAdmin = args.orgAdmin === true;

  // Environment - defaults to staging for test environments
  const environment = args.environment === 'production' ? 'prod' : 'stage';

  // Convert permission strings to chrome.getUserPermissions format
  const chromePermissions = permissions.map((permission) => ({
    permission,
    resourceDefinitions: [],
  }));

  return {
    // Journey stories use Iam directly - skip preview.tsx provider wrapping
    noWrapping: true,
    // Explicit permissions for route-level permission guard
    permissions,
    // Environment setting
    environment: args.environment ?? 'staging',
    // Workspace permissions for useSelfAccessCheck mock (workspace IDs user can edit/create in)
    workspacePermissions,
    // User identity for auth.getUser() - used by StorybookMockContext
    userIdentity: {
      org_id: '12510751',
      account_number: '123456',
      user: {
        username: 'test-user',
        email: 'test@redhat.com',
        first_name: 'Test',
        last_name: 'User',
        is_org_admin: isOrgAdmin,
      },
      entitlements: {
        ansible: { is_entitled: true },
        cost_management: { is_entitled: true },
        insights: { is_entitled: true },
        openshift: { is_entitled: true },
        rhel: { is_entitled: true },
        smart_management: { is_entitled: false },
      },
    },
    // Chrome config (for compatibility - most values now come from StorybookMockContext)
    chrome: {
      environment,
      getUserPermissions: () => Promise.resolve(chromePermissions),
      isBeta: () => false,
      isProd: () => false,
      getEnvironment: () => 'stage',
      getBundle: () => 'iam',
      getApp: () => '',
    },
    featureFlags: {
      'platform.rbac.workspaces': args['platform.rbac.workspaces'] ?? false,
      'platform.rbac.workspaces-list': args['platform.rbac.workspaces-list'] ?? false,
      'platform.rbac.workspace-hierarchy': args['platform.rbac.workspace-hierarchy'] ?? false,
      'platform.rbac.workspaces-role-bindings': args['platform.rbac.workspaces-role-bindings'] ?? false,
      'platform.rbac.workspaces-role-bindings-write': args['platform.rbac.workspaces-role-bindings-write'] ?? false,
      'platform.rbac.workspaces-organization-management': args['platform.rbac.workspaces-organization-management'] ?? false,
      'platform.rbac.group-service-accounts': args['platform.rbac.group-service-accounts'] ?? false,
      'platform.rbac.group-service-accounts.stable': args['platform.rbac.group-service-accounts.stable'] ?? false,
      'platform.rbac.common-auth-model': args['platform.rbac.common-auth-model'] ?? false,
      'platform.rbac.common.userstable': args['platform.rbac.common.userstable'] ?? false,
      'platform.rbac.itless': false,
    },
  };
};
