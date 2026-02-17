import React, { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
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

import { usePlatformAuth } from '../../hooks/usePlatformAuth';
import StatusLabel from './components/StatusLabel';
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
  const { getUser } = usePlatformAuth();
  const [user, setUser] = useState<User>({});
  const [searchParams, setSearchParams] = useSearchParams();
  const bundleFromUrl = searchParams.get('bundle');
  const bundle = bundleFromUrl || DEFAULT_MUA_BUNDLE;
  // Avoid any permission/context hook here: triggers re-render cascade and freeze when navigating from Users.
  const userAccessAdministrator = false;

  // Defer so we don't call chrome identity in the same tick as route transition (avoids freeze when navigating from user-access/* back to my-user-access)
  useEffect(() => {
    const id = window.requestAnimationFrame(() => {
      getUser().then((chromeUser) => {
        const { identity, entitlements } = chromeUser || {};
        setUser({
          entitlements,
          isOrgAdmin: identity?.user?.is_org_admin,
        });
      });
    });
    return () => window.cancelAnimationFrame(id);
  }, [getUser]);

  const enhancedEntitlements: UserEntitlements = {
    ...user.entitlements,
  };

  const entitledBundles: Entitlements = Object.entries(enhancedEntitlements).filter(([, { is_entitled }]) => is_entitled);

  const [isDropdownOpen, setDropdownOpen] = useState(false);

  // Use replace to avoid history push; prevents shell from treating each bundle switch as full navigation (HEAD /iam storm)
  const onBundleSelect = useCallback((b: string) => {
    setSearchParams({ bundle: b }, { replace: true });
  }, [setSearchParams]);

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
                <DropdownItem
                  key={data.entitlement}
                  onClick={() => {
                    setDropdownOpen(false);
                    setSearchParams({ bundle: data.entitlement }, { replace: true });
                  }}
                >
                  {data.title}
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
          onBundleSelect={onBundleSelect}
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
