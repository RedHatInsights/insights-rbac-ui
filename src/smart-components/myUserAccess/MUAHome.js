import React, { useEffect, useState } from 'react';
import { PageHeaderTitle } from '@redhat-cloud-services/frontend-components';
import { Text, Spinner } from '@patternfly/react-core';
import StatusLabel from '../../presentational-components/myUserAccess/StatusLabel';

import './MUAHome.scss';
import MUAContent from './MUAContent';

const MyUserAccess = () => {
  const [user, setUser] = useState({});

  useEffect(() => {
    insights.chrome.auth.getUser().then(({ identity, entitlements }) => setUser({ entitlements, isOrgAdmin: identity?.user?.is_org_admin }));
  }, []);

  return (
    <React.Fragment>
      {Object.prototype.hasOwnProperty.call(user, 'entitlements') && Object.prototype.hasOwnProperty.call(user, 'isOrgAdmin') ? (
        <React.Fragment>
          <PageHeaderTitle
            className="ins-p-myUserAccess--title sticky"
            title={
              <React.Fragment>
                <span> My User Access </span>
                <StatusLabel isOrgAdmin={user.isOrgAdmin} />
              </React.Fragment>
            }
          />
          <Text component="p" className="ins-p-myUserAccess--subtitle">
            Select from your organization&apos;s subscriptions below to discover your individual application-specific roles and permissions.
          </Text>
          <div className="ins-p-myUserAccess--dropdown sticky">
            <div className="pf-c-dropdown pf-m-expanded">
              <button className="pf-c-dropdown__toggle" type="button">
                <span className="pf-c-dropdown__toggle-text">Choose a subscription...</span>
                <span className="pf-c-dropdown__toggle-icon">
                  <i className="fas fa-caret-down"></i>
                </span>
              </button>
            </div>
          </div>
          <section>
            <MUAContent entitlements={user.entitlements} isOrgAdmin={user.isOrgAdmin} />
          </section>
        </React.Fragment>
      ) : (
        <Spinner />
      )}
    </React.Fragment>
  );
};

export default MyUserAccess;
