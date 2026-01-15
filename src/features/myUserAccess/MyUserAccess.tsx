import React, { useContext, useEffect, useState } from 'react';
import { NavLink, useLocation, useSearchParams } from 'react-router-dom';
import {
  Dropdown,
  DropdownItem,
  DropdownList,
  Flex,
  FlexItem,
  MenuToggle,
  MenuToggleElement,
  PageSection,
  Spinner,
  Title,
} from '@patternfly/react-core';

import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
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

  if (
    !Object.prototype.hasOwnProperty.call(user, 'entitlements') ||
    !(Object.prototype.hasOwnProperty.call(user, 'isOrgAdmin') || userAccessAdministrator)
  ) {
    return (
      <PageSection>
        <Spinner />
      </PageSection>
    );
  }

  return (
    <React.Fragment>
      <PageSection hasBodyWrapper={false}>
        <Flex alignItems={{ default: 'alignItemsCenter' }} gap={{ default: 'gapMd' }}>
          <FlexItem>
            <Title headingLevel="h1" size="2xl">
              {intl.formatMessage(messages.myUserAccess)}
            </Title>
          </FlexItem>
          <FlexItem>
            <StatusLabel isOrgAdmin={user.isOrgAdmin} isUserAccessAdmin={userAccessAdministrator} />
          </FlexItem>
        </Flex>
      </PageSection>
      {/* Mobile-only dropdown for bundle selection */}
      {entitledBundles && (
        <PageSection hasBodyWrapper={false} className="pf-v6-u-display-none-on-lg pf-v6-u-pt-0">
          <Dropdown
            toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
              <MenuToggle
                ref={toggleRef}
                onClick={() => setDropdownOpen(!isDropdownOpen)}
                isExpanded={isDropdownOpen}
                id="mua-bundle-dropdown"
                data-ouia-component-id="mua-bundle-dropdown"
                isFullWidth
              >
                {bundle
                  ? bundleData.find(({ entitlement }) => entitlement === bundle)?.title
                  : intl.formatMessage(messages.chooseSubscriptionEllipsis)}
              </MenuToggle>
            )}
            isOpen={isDropdownOpen}
            onOpenChange={setDropdownOpen}
          >
            <DropdownList>
              {bundleData.map((data) => (
                <DropdownItem key={data.entitlement} onClick={() => setDropdownOpen(false)}>
                  <NavLink to={{ pathname: location.pathname, search: `bundle=${data.entitlement}` }}>{data.title}</NavLink>
                </DropdownItem>
              ))}
            </DropdownList>
          </Dropdown>
        </PageSection>
      )}
      <PageSection hasBodyWrapper={false}>
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
      </PageSection>
    </React.Fragment>
  );
};

export default MyUserAccess;
