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
  const {
    helpTopics: { setActiveTopic, closeHelpTopic },
  } = useChrome();
  const { activeHelpTopic } = useContext(HelpTopicContext);

  return (
    <Suspense fallback={<AppPlaceholder />}>
      <button onClick={() => (activeHelpTopic ? closeHelpTopic() : setActiveTopic('workspace'))}>
        {activeHelpTopic ? 'Close help topic drawer' : 'Open workspace help topic'}
      </button>
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
