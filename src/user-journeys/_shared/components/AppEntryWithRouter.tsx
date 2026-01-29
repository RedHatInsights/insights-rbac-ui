import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { IamShell } from '../../../Iam';
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
 * Wrapper component for routing with address bar and navigation for user journey tests.
 * IamShell handles all /iam/* routes via the unified Routing component.
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
          <Route path="/iam/*" element={<IamShell />} />
        </Routes>
      </Page>
    </MemoryRouter>
  );
};
