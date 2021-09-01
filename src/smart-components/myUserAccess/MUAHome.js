import React, { useEffect, useState } from 'react';
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core';

import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';
import { Text, Spinner } from '@patternfly/react-core';
import StatusLabel from '../../presentational-components/myUserAccess/StatusLabel';

import './MUAHome.scss';
import MUAContent from './MUAContent';

const MyUserAccess = () => {
  const [user, setUser] = useState({});
  useEffect(() => {
    insights.chrome.auth.getUser().then(({ identity, entitlements }) => setUser({ entitlements, isOrgAdmin: identity?.user?.is_org_admin }));
  }, []);
  const enhancedEntitlements = {
    ...user.entitlements,
    application_services: { is_entitled: true, is_trial: false },
  };

  const [isDropdownOpen, setDropdownOpen] = useState(false);

  const dropdownItems = [<DropdownItem key="test">test</DropdownItem>];

  return (
    <React.Fragment>
      {Object.prototype.hasOwnProperty.call(user, 'entitlements') && Object.prototype.hasOwnProperty.call(user, 'isOrgAdmin') ? (
        <React.Fragment>
          <PageHeaderTitle
            className="rbac-p-myUserAccess--title sticky"
            title={
              <React.Fragment>
                <span> My User Access </span>
                <StatusLabel isOrgAdmin={user.isOrgAdmin} />
              </React.Fragment>
            }
          />
          <Text component="p" className="rbac-p-myUserAccess--subtitle">
            Select applications to view your personal permissions.
          </Text>
          <div className="rbac-p-myUserAccess--dropdown sticky">
            <Dropdown
              ouiaId="mua-bundle-dropdown"
              toggle={
                <DropdownToggle onToggle={() => setDropdownOpen()} id="mua-bundle-dropdown">
                  Choose a subscription...
                </DropdownToggle>
              }
              dropdownItems={dropdownItems}
              isOpen={isDropdownOpen}
            />
          </div>
          <section>
            <MUAContent entitlements={enhancedEntitlements} isOrgAdmin={user.isOrgAdmin} />
          </section>
        </React.Fragment>
      ) : (
        <Spinner />
      )}
    </React.Fragment>
  );
};

export default MyUserAccess;
