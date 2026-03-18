import React, { useEffect, useState } from 'react';
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

import StatusLabel from './components/StatusLabel';
import { bundleData } from './bundleData';
import { UserAccessLayout } from './components/UserAccessLayout';
import type { Entitlements } from './components/BundleCard';
import { AccessTable } from './AccessTable';
import { RolesTable } from './RolesTable';
import { useBundleApps } from './useBundleApps';
import { DEFAULT_MUA_BUNDLE } from '../../../shared/utilities/constants';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import useUserData from '../../hooks/useUserData';

// FilterState is now in shared types.ts file

export const MyUserAccess: React.FC = () => {
  const intl = useIntl();
  const user = useUserData();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();
  const bundle = searchParams.get('bundle');
  const { userAccessAdministrator } = useUserData();

  useEffect(() => {
    // Only set default bundle if bundle is falsy and we haven't already set it
    if (!bundle) {
      setSearchParams({ bundle: DEFAULT_MUA_BUNDLE });
    }
  }, [bundle, setSearchParams]);

  const entitledBundles: Entitlements = Object.entries(user.entitlements || {}).filter(([, { is_entitled }]) => is_entitled);

  const [isDropdownOpen, setDropdownOpen] = useState(false);

  // Bundle and filter logic moved from BundleView
  const apps = useBundleApps(bundle || undefined);
  const hasAdminAccess = user.orgAdmin || userAccessAdministrator;

  if (!user.ready) {
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
            <StatusLabel isOrgAdmin={user.orgAdmin} isUserAccessAdmin={userAccessAdministrator} />
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
          title={intl.formatMessage(user.orgAdmin || userAccessAdministrator ? messages.yourRoles : messages.yourPermissions, {
            name: bundleData.find(({ entitlement }) => entitlement === (bundle || DEFAULT_MUA_BUNDLE))?.title,
          })}
          currentBundle={bundle || DEFAULT_MUA_BUNDLE}
        >
          {hasAdminAccess ? (
            <RolesTable key={bundle} apps={apps} showResourceDefinitions={hasAdminAccess} />
          ) : (
            <AccessTable key={bundle} apps={apps} showResourceDefinitions={hasAdminAccess} />
          )}
        </UserAccessLayout>
      </PageSection>
    </React.Fragment>
  );
};

export default MyUserAccess;
