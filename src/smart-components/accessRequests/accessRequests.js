import React, { lazy, Suspense } from 'react';
import PropTypes from 'prop-types';
import { Switch, Route } from 'react-router-dom';
import { routes } from '../../../package.json';

const AccessRequestsPage = lazy(() => import('@redhat-cloud-services/access-requests-frontend/lib/Routes/AccessRequestsPage'));
const AccessRequestDetailsPage = lazy(() => import('@redhat-cloud-services/access-requests-frontend/lib/Routes/AccessRequestDetailsPage'));

const AccessRequestsPageWrapper = () => <AccessRequestsPage isInternal={false} />;
const AccessRequestDetailsPageWrapper = ({ match }) => <AccessRequestDetailsPage requestId={match.params.requestId} isInternal={false} />;
AccessRequestDetailsPageWrapper.propTypes = {
  match: PropTypes.object,
};

const AccessRequests = () => (
  <Suspense fallback={<React.Fragment />}>
    <Switch>
      <Route path={routes['access-requests']} exact component={AccessRequestsPageWrapper} />
      <Route path={routes['access-requests-detail']} exact component={AccessRequestDetailsPageWrapper} />
    </Switch>
  </Suspense>
);

export default AccessRequests;
