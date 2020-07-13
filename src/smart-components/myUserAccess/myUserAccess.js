import React, { useEffect, useState } from 'react';
import { PageHeader, PageHeaderTitle, Main } from '@redhat-cloud-services/frontend-components';
import { Text, TextContent } from '@patternfly/react-core';
import OrgAdminLabel from '../../presentational-components/myUserAccess/orgAdminLabel';

import './myUserAccess.scss';
import MUAPageSection from '../../presentational-components/myUserAccess/pageSection';
import MUAOrgEntitlements from '../../presentational-components/myUserAccess/orgEntitlements';

const MyUserAccess = () => {

    const [ isOrgAdmin, setIsOrgAdmin ] = useState();
    const [ entitlements, setEntitlements ] = useState();
    const [ isUserReady, setIsUserReady ] = useState(false);

    useEffect(() => {
        insights.chrome.auth.getUser().then((user) => {
          setIsOrgAdmin(user.identity.user.is_org_admin);
          setEntitlements(user.entitlements);
          setIsUserReady(true);
        });
    }, []);

    return (
      <React.Fragment>
        { isUserReady ?
          <React.Fragment>
            <PageHeader>
              <TextContent>
                <PageHeaderTitle title={ <React.Fragment>
                    <span> My user access </span>
                    { isOrgAdmin && <OrgAdminLabel/> }
                    </React.Fragment> }/>
                <Text component="p" className='ins-p-myUserAccess--subtitle'>
                  <span>Understand your Red Hat access by exploring your organization&apos;s entitlements and your individual user roles.</span>
                  { isOrgAdmin && <span> As an admin, you can manage other users&apos; permissions with &apos;User access&apos;</span>}
                </Text>
              </TextContent>
            </PageHeader>
            <Main>
              { entitlements && <MUAPageSection
                  title='Organization entitlements'
                  popOverContent='Your organization is subscribed to the following bundles'>
                    <MUAOrgEntitlements entitlements={ entitlements }/>
                </MUAPageSection>
              }
              <MUAPageSection title='My roles'>
                  TODO
              </MUAPageSection>
            </Main>
          </React.Fragment>
          : <span> test </span>
        }
      </React.Fragment>
    );
};

export default MyUserAccess;
