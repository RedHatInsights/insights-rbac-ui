import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Iam } from '../../../Iam';
import { FakeAddressBar } from './FakeAddressBar';
import { KesselNavigation } from './KesselNavigation';
import { ProductionHeader } from './ProductionHeader';
import { GlobalBreadcrumb } from './GlobalBreadcrumb';
import { Page, PageSidebar, PageSidebarBody } from '@patternfly/react-core';

interface KesselAppEntryWithRouterProps {
  initialRoute?: string;
  typingDelay?: number;
  orgAdmin?: boolean;
  userAccessAdministrator?: boolean;
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
      <Page
        masthead={<ProductionHeader />}
        sidebar={
          <PageSidebar>
            <PageSidebarBody>
              <KesselNavigation />
            </PageSidebarBody>
          </PageSidebar>
        }
      >
        <FakeAddressBar />
        <GlobalBreadcrumb />
        <Routes>
          <Route path="/iam/*" element={<Iam testMode />} />
        </Routes>
      </Page>
    </MemoryRouter>
  );
};

/**
 * Helper to create dynamic environment parameters from story args
 */
export const createDynamicEnvironment = (args: KesselAppEntryWithRouterProps) => {
  const { orgAdmin = false, userAccessAdministrator = false } = args;

  // Determine if user has write permissions for Kessel access checks
  const hasWritePermissions = orgAdmin || userAccessAdministrator;

  return {
    // Journey stories use Iam directly - skip preview.tsx provider wrapping
    noWrapping: true,
    chrome: {
      environment: 'prod',
      getUserPermissions: () => {
        let permissions;
        if (orgAdmin) {
          permissions = [
            { permission: 'rbac:*:*', resourceDefinitions: [] },
            { permission: 'inventory:hosts:read', resourceDefinitions: [] },
            { permission: 'inventory:groups:write', resourceDefinitions: [] },
            { permission: 'inventory:groups:*', resourceDefinitions: [] },
          ];
        } else if (userAccessAdministrator) {
          permissions = [
            { permission: 'rbac:group:*', resourceDefinitions: [] },
            { permission: 'rbac:principal:*', resourceDefinitions: [] },
            { permission: 'rbac:role:read', resourceDefinitions: [] },
            { permission: 'inventory:hosts:read', resourceDefinitions: [] },
          ];
        } else {
          permissions = [
            { permission: 'rbac:group:read', resourceDefinitions: [] },
            { permission: 'rbac:role:read', resourceDefinitions: [] },
            { permission: 'inventory:hosts:read', resourceDefinitions: [] },
          ];
        }
        return Promise.resolve(permissions);
      },
      auth: {
        getUser: () =>
          Promise.resolve({
            identity: {
              user: {
                username: 'test-user',
                email: 'test@redhat.com',
                first_name: 'Test',
                last_name: 'User',
                is_org_admin: args.orgAdmin || false,
              },
            },
            entitlements: {
              ansible: { is_entitled: true },
              cost_management: { is_entitled: true },
              insights: { is_entitled: true },
              openshift: { is_entitled: true },
              rhel: { is_entitled: true },
              smart_management: { is_entitled: false },
            },
          }),
        getToken: () => Promise.resolve('mock-token-12345'),
      },
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
    // Kessel access check configuration - mirrors the permission logic above
    accessCheck: {
      canEdit: () => hasWritePermissions,
      canCreate: () => hasWritePermissions,
    },
  };
};
