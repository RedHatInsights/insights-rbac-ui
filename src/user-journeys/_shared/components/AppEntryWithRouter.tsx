import React, { Suspense } from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppEntry from '../../../AppEntry';
import MyUserAccess from '../../../features/myUserAccess/MyUserAccess';
import { FakeAddressBar } from './FakeAddressBar';
import { LeftNavigation } from './LeftNavigation';
import { Masthead, MastheadMain, Page, PageSidebar, PageSidebarBody } from '@patternfly/react-core';

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
 * Wrapper component for routing with address bar and navigation for user journey tests
 */
export const AppEntryWithRouter: React.FC<AppEntryWithRouterProps> = ({ initialRoute = '/iam/user-access/groups' }) => {
  return (
    <MemoryRouter initialEntries={[initialRoute]}>
      <Page
        header={
          <Masthead>
            <MastheadMain>
              <FakeAddressBar />
            </MastheadMain>
          </Masthead>
        }
        sidebar={
          <PageSidebar>
            <PageSidebarBody>
              <LeftNavigation />
            </PageSidebarBody>
          </PageSidebar>
        }
      >
        <Suspense fallback={<div>Loading...</div>}>
          <Routes>
            <Route
              path="/iam/my-user-access"
              element={
                <div style={{ padding: 0, margin: 0 }}>
                  <MyUserAccess />
                </div>
              }
            />
            <Route path="/iam/user-access/*" element={<AppEntry />} />
          </Routes>
        </Suspense>
      </Page>
    </MemoryRouter>
  );
};
