import React, { useEffect, useState } from 'react';
import { PageHeader, PageHeaderTitle, Main } from '@redhat-cloud-services/frontend-components';
import { Text, TextContent, Spinner } from '@patternfly/react-core';
import OrgAdminLabel from '../../presentational-components/myUserAccess/orgAdminLabel';

import './myUserAccess.scss';
import MUAPageSection from '../../presentational-components/myUserAccess/pageSection';
import MUAOrgEntitlements from '../../presentational-components/myUserAccess/orgEntitlements';

const MyUserAccess = () => {

    const [ user, setUser ] = useState({});

    useEffect(() => {
      insights.chrome.auth.getUser().then(({ identity, entitlements }) => (
        setUser({ entitlements, isOrgAdmin: identity?.user?.is_org_admin })
      ));
    }, []);

    return (
      <React.Fragment>
        { Object.prototype.hasOwnProperty.call(user, 'entitlements') && Object.prototype.hasOwnProperty.call(user, 'isOrgAdmin') ?
          <React.Fragment>
            <PageHeader>
              <TextContent>
                <PageHeaderTitle title={ <React.Fragment>
                    <span> My User Access </span>
                    { user.isOrgAdmin && <OrgAdminLabel/> }
                    </React.Fragment> }/>
                <Text component="p" className='ins-p-myUserAccess--subtitle'>
                  <span>Understand your Red Hat access by exploring your organization&apos;s entitlements and your individual user roles.</span>
                  { user.isOrgAdmin && <span> As an admin, you can manage other users&apos; permissions with <b>User Access</b>.</span>}
                </Text>
              </TextContent>
            </PageHeader>
            <Main>
              { user.entitlements && <MUAPageSection
                  title='Organization entitlements'
                  popOverContent='Your organization is subscribed to the following bundles'>
                    <MUAOrgEntitlements entitlements={ user.entitlements }/>
                </MUAPageSection>
              }
              <MUAPageSection title='My roles'>
                  TODO
              </MUAPageSection>
            </Main>
          </React.Fragment>
          : <Spinner/>
        }
      </React.Fragment>
    );
};

export default MyUserAccess;
