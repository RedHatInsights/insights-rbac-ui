import React, { Fragment } from 'react';
import { Alert } from '@patternfly/react-core';
import RhelBundle from './rhel';

import './MUABundles.scss';

const OpenshiftBundle = (props) => (
  <Fragment>
    <div className="pf-u-mb-xl">
      <Alert isInline variant="info" title="OpenShift Clusters permissions are not managed with User Access">
        <p>
          All users in the organization may view everything, but only Org. Administrators and cluster owners can perform actions on clusters. The
          table below displays roles for other OpenShift applications and services.
        </p>
      </Alert>
    </div>
    <RhelBundle {...props} />
  </Fragment>
);

export default OpenshiftBundle;
