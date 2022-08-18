import React, { Fragment } from 'react';
import { Alert } from '@patternfly/react-core';
import RhelBundle from './rhel';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

import './MUABundles.scss';

const OpenshiftBundle = (props) => {
  const intl = useIntl();
  return (
    <Fragment>
      <div className="pf-u-mb-xl">
        <Alert isInline variant="info" title="OpenShift Clusters permissions are not managed with User Access">
          <p>{intl.formatMessage(messages.openshiftPermissions)}</p>
        </Alert>
      </div>
      <RhelBundle {...props} />
    </Fragment>
  );
};

export default OpenshiftBundle;
