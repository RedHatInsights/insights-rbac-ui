import React, { useEffect, useState } from 'react';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components';
import { Text, TextContent, Spinner } from '@patternfly/react-core';
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
          <PageHeader>
            <TextContent>
              <PageHeaderTitle
                title={
                  <React.Fragment>
                    <span> My User Access </span>
                    <StatusLabel isOrgAdmin={user.isOrgAdmin} />
                  </React.Fragment>
                }
              />
              <Text component="p" className="ins-p-myUserAccess--subtitle">
                <span>Understand your Red Hat access by exploring your organization&apos;s entitlements and your individual user roles.</span>
              </Text>
            </TextContent>
          </PageHeader>
          <section className="ins-l-myUserAccess-split">
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
