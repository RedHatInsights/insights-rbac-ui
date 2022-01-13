import React, { useContext, Fragment } from 'react';
import { Route } from 'react-router-dom';
import { Bullseye, Spinner } from '@patternfly/react-core';
import AsyncComponent from '@redhat-cloud-services/frontend-components/AsyncComponent';
import pathnames from '../../utilities/pathnames';
import { RegistryContext } from '../../utilities/store';

const fallback = (
  <Bullseye>
    <Spinner size="xl" />
  </Bullseye>
);

const AccessRequests = () => {
  const { getRegistry } = useContext(RegistryContext);

  /**
   * The module name has changes after the nav rework.
   * We have to keep these changes in sync with the nav promotion.
   */
  const appName = 'accessRequests';
  return (
    <Fragment>
      <Route
        path={pathnames['access-requests']}
        exact
        render={() => (
          <AsyncComponent
            appName={appName}
            module="./AccessRequestsPage"
            scope="accessRequests"
            isInternal={false}
            fallback={fallback}
            getRegistry={getRegistry}
          />
        )}
      />
      <Route
        path={pathnames['access-requests-detail']}
        exact
        render={() => (
          <AsyncComponent
            appName={appName}
            module="./AccessRequestDetailsPage"
            scope="accessRequests"
            fallback={fallback}
            isInternal={false}
            getRegistry={getRegistry}
          />
        )}
      />
    </Fragment>
  );
};

export default AccessRequests;
