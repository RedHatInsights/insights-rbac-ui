import { Route, Switch, Redirect } from 'react-router-dom';
import React, { lazy, Suspense, useContext, useEffect, useState } from 'react';
import { AppPlaceholder } from './presentational-components/shared/loader-placeholders';
import pathnames from './utilities/pathnames';
import QuickstartsTestButtons from './utilities/quickstarts-test-buttons';

const Groups = lazy(() => import('./smart-components/group/groups'));
const Roles = lazy(() => import('./smart-components/role/roles'));
const Users = lazy(() => import('./smart-components/user/users'));
const MyUserAccess = lazy(() => import('./smart-components/myUserAccess/MUAHome'));
const AccessRequests = lazy(() => import('./smart-components/accessRequests/accessRequests'));
const QuickstartsTest = lazy(() => import('./smart-components/quickstarts/quickstarts-test'));

import { HelpTopicContext } from '@patternfly/quickstarts';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

export const Routes = () => {
  const [topicsReady, setTopicsReady] = useState(false);
  const {
    helpTopics: { updateHelpTopics },
  } = useChrome();
  const { activeHelpTopic, setActiveHelpTopicByName, helpTopics } = useContext(HelpTopicContext);
  useEffect(() => {
    fetch('/api/quickstarts/v1/helptopics?bundle=application-services').then(async (data) => {
      const response = await data.json();
      setTopicsReady(true);
      updateHelpTopics(...response.data.map(({ content }) => content).flat());
    });
  }, []);
  console.log({ activeHelpTopic, helpTopics });
  return (
    <Suspense fallback={<AppPlaceholder />}>
      {topicsReady && <button onClick={() => setActiveHelpTopicByName('workspace')}>Trigger help topic</button>}
      <QuickstartsTestButtons />
      <Switch>
        <Route path={pathnames.groups} component={Groups} />
        <Route path={pathnames.roles} component={Roles} />
        <Route path={pathnames.users} component={Users} />
        <Route path={pathnames['my-user-access']} component={MyUserAccess} />
        <Route path={pathnames['access-requests']} component={AccessRequests} />

        {localStorage.getItem('quickstarts:enabled') === 'true' && <Route path={pathnames['quickstarts-test']} component={QuickstartsTest} />}
        <Route>
          <Redirect to={pathnames.users} />
        </Route>
      </Switch>
    </Suspense>
  );
};
