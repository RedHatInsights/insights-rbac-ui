import React, { useEffect, useState, useContext } from 'react';
import { NavLink } from 'react-router-dom';
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';

import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import { Text, Spinner } from '@patternfly/react-core';
import StatusLabel from '../../presentational-components/myUserAccess/StatusLabel';
import PermissionsContext from '../../utilities/permissions-context';
import pathnames from '../../utilities/pathnames';
import { bundleData } from '../../presentational-components/myUserAccess/bundles';
import './MUAHome.scss';
import MUAContent from './MUAContent';
import useSearchParams from '../../hooks/useSearchParams';

const MyUserAccess = () => {
  const [user, setUser] = useState({});
  let { bundle } = useSearchParams('bundle');
  const [bundleParam, setBundleParam] = useState(bundle);
  const { userAccessAdministrator } = useContext(PermissionsContext);
  useEffect(() => {
    insights.chrome.auth.getUser().then(({ identity, entitlements }) => setUser({ entitlements, isOrgAdmin: identity?.user?.is_org_admin }));
  }, []);
  const enhancedEntitlements = {
    ...user.entitlements,
    application_services: { is_entitled: true, is_trial: false },
  };

  const entitledBundles = Object.entries(enhancedEntitlements).filter(([, { is_entitled }]) => is_entitled);

  const [isDropdownOpen, setDropdownOpen] = useState(false);

  return (
    <React.Fragment>
      {Object.prototype.hasOwnProperty.call(user, 'entitlements') &&
      (Object.prototype.hasOwnProperty.call(user, 'isOrgAdmin') || userAccessAdministrator) ? (
        <React.Fragment>
          <PageHeaderTitle
            className="rbac-p-myUserAccess--title sticky"
            title={
              <React.Fragment>
                <span> My User Access </span>
                <StatusLabel isOrgAdmin={user.isOrgAdmin} isUserAccessAdmin={userAccessAdministrator} />
              </React.Fragment>
            }
          />
          <Text component="p" className="rbac-p-myUserAccess--subtitle">
            Select applications to view your personal permissions.
          </Text>
          {entitledBundles && (
            <div className="rbac-p-myUserAccess--dropdown sticky">
              <Dropdown
                ouiaId="mua-bundle-dropdown"
                toggle={
                  <DropdownToggle onToggle={() => setDropdownOpen(!isDropdownOpen)} id="mua-bundle-dropdown">
                    {bundleParam ? bundleParam : 'Choose a subscription...'}
                  </DropdownToggle>
                }
                dropdownItems={bundleData.map((data) => (
                  <NavLink key={data.entitlement} to={{ pathname: pathnames['my-user-access'].path, search: `bundle=${data.entitlement}` }}>
                    <DropdownItem
                      onClick={() => {
                        setBundleParam(data.title), setDropdownOpen(false);
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
            <MUAContent entitlements={enhancedEntitlements} isOrgAdmin={user.isOrgAdmin} isUserAccessAdmin={userAccessAdministrator} />
          </section>
        </React.Fragment>
      ) : (
        <Spinner />
      )}
    </React.Fragment>
  );
};

export default MyUserAccess;
