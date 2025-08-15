import React, { useContext, useEffect, useState } from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core/deprecated';

import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { Spinner, Text } from '@patternfly/react-core';
import StatusLabel from './components/StatusLabel';
import PermissionsContext from '../../utilities/permissionsContext';
import { bundleData } from './bundleData';
import { UserAccessLayout } from './components/UserAccessLayout';
import type { Entitlements } from './components/BundleCard';
import { AccessTable } from './AccessTable';
import { RolesTable } from './RolesTable';
import OrgAdminContext from '../../utilities/orgAdminContext';
import { useBundleApps } from './useBundleApps';
import { DEFAULT_MUA_BUNDLE } from '../../utilities/constants';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

import './MyUserAccess.scss';

interface UserEntitlements {
  [key: string]: { is_entitled: boolean };
}

interface User {
  entitlements?: UserEntitlements;
  isOrgAdmin?: boolean;
}

// FilterState is now in shared types.ts file

export const MyUserAccess: React.FC = () => {
  const intl = useIntl();
  const chrome = useChrome();
  const location = useLocation();
  const [user, setUser] = useState<User>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const bundle = searchParams.get('bundle');
  const { userAccessAdministrator } = useContext(PermissionsContext);

  useEffect(() => {
    chrome.auth.getUser().then((user: any) => {
      const { identity, entitlements } = user || {};
      setUser({
        entitlements,
        isOrgAdmin: identity?.user?.is_org_admin,
      });
    });

    // Only set default bundle if bundle is falsy and we haven't already set it
    if (!bundle) {
      setSearchParams({ bundle: DEFAULT_MUA_BUNDLE });
    }
  }, [bundle, setSearchParams]);

  const enhancedEntitlements: UserEntitlements = {
    ...user.entitlements,
  };

  const entitledBundles: Entitlements = Object.entries(enhancedEntitlements).filter(([, { is_entitled }]) => is_entitled);

  const [isDropdownOpen, setDropdownOpen] = useState(false);

  // Bundle and filter logic moved from BundleView
  const apps = useBundleApps(bundle || undefined);
  const hasAdminAccess = user.isOrgAdmin || userAccessAdministrator;

  // No more bloated FilterItem[] at business logic level!

  return (
    <React.Fragment>
      {Object.prototype.hasOwnProperty.call(user, 'entitlements') &&
      (Object.prototype.hasOwnProperty.call(user, 'isOrgAdmin') || userAccessAdministrator) ? (
        <React.Fragment>
          <PageHeaderTitle
            className="rbac-p-myUserAccess--title sticky"
            title={
              <React.Fragment>
                <span> {intl.formatMessage(messages.myUserAccess)} </span>
                <StatusLabel isOrgAdmin={user.isOrgAdmin} isUserAccessAdmin={userAccessAdministrator} />
              </React.Fragment>
            }
          />
          <Text component="p" className="rbac-p-myUserAccess--subtitle">
            {intl.formatMessage(messages.selectAppsToViewPermissions)}
          </Text>
          {entitledBundles && (
            <div className="rbac-p-myUserAccess--dropdown sticky">
              <Dropdown
                ouiaId="mua-bundle-dropdown"
                toggle={
                  <DropdownToggle onToggle={() => setDropdownOpen(!isDropdownOpen)} id="mua-bundle-dropdown">
                    {bundle
                      ? bundleData.find(({ entitlement }) => entitlement === bundle)?.title
                      : intl.formatMessage(messages.chooseSubscriptionEllipsis)}
                  </DropdownToggle>
                }
                dropdownItems={bundleData.map((data) => (
                  <NavLink key={data.entitlement} to={{ pathname: location.pathname, search: `bundle=${data.entitlement}` }}>
                    <DropdownItem
                      onClick={() => {
                        setDropdownOpen(false);
                      }}
                      component="button"
                    >
                      {data.title}
                    </DropdownItem>
                  </NavLink>
                ))}
                isOpen={isDropdownOpen}
              />
            </div>
          )}
          <section>
            <UserAccessLayout
              entitledBundles={entitledBundles}
              title={intl.formatMessage(user.isOrgAdmin || userAccessAdministrator ? messages.yourRoles : messages.yourPermissions, {
                name: bundleData.find(({ entitlement }) => entitlement === (bundle || DEFAULT_MUA_BUNDLE))?.title,
              })}
              currentBundle={bundle || DEFAULT_MUA_BUNDLE}
            >
              <OrgAdminContext.Provider value={hasAdminAccess}>
                {hasAdminAccess ? (
                  <RolesTable key={bundle} apps={apps} showResourceDefinitions={hasAdminAccess} />
                ) : (
                  <AccessTable key={bundle} apps={apps} showResourceDefinitions={hasAdminAccess} />
                )}
              </OrgAdminContext.Provider>
            </UserAccessLayout>
          </section>
        </React.Fragment>
      ) : (
        <Spinner />
      )}
    </React.Fragment>
  );
};

export default MyUserAccess;
