import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Iam } from '../../../Iam';
import { FakeAddressBar } from './FakeAddressBar';
import { LeftNavigation } from './LeftNavigation';
import { Page, PageSidebar, PageSidebarBody } from '@patternfly/react-core';
import { ProductionHeader } from './ProductionHeader';
import { GlobalBreadcrumb } from './GlobalBreadcrumb';

interface AppEntryWithRouterProps {
  initialRoute?: string;
  typingDelay?: number;
  orgAdmin?: boolean;
  userAccessAdministrator?: boolean;
  'platform.rbac.workspaces'?: boolean;
  'platform.rbac.group-service-accounts'?: boolean;
  'platform.rbac.group-service-accounts.stable'?: boolean;
  'platform.rbac.common-auth-model'?: boolean;
  'platform.rbac.common.userstable'?: boolean;
}

/**
 * Wrapper component for user journey tests.
 * Uses the production Iam component directly for maximum fidelity.
 * testMode enables test-friendly QueryClient settings (no cache, no retries)
 * while keeping full error handling wired up (403/500 → ApiErrorBoundary).
 * Only adds MemoryRouter (for test navigation) and visual chrome (header, sidebar, breadcrumb).
 */
export const AppEntryWithRouter: React.FC<AppEntryWithRouterProps> = ({ initialRoute = '/iam/user-access/groups' }) => {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Page
        masthead={<ProductionHeader />}
        sidebar={
          <PageSidebar>
            <PageSidebarBody>
              <LeftNavigation />
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
