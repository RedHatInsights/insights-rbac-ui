import React from 'react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import AppEntry from '../../../AppEntry';
import MyUserAccess from '../../../features/myUserAccess/MyUserAccess';
import { FakeAddressBar } from './FakeAddressBar';
import { LeftNavigation } from './LeftNavigation';

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
      <FakeAddressBar />
      <LeftNavigation />
      <div style={{ paddingTop: '40px', marginLeft: '250px', minHeight: '100vh', backgroundColor: '#f0f0f0' }}>
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
      </div>
    </MemoryRouter>
  );
};
