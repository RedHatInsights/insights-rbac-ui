import React, { useEffect, Fragment } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useDispatch, useSelector } from 'react-redux';
import { NotAuthorized } from '@patternfly/react-component-groups';

import { useLocation } from 'react-router-dom';
import { API_ERROR } from '../../redux/action-types';
import NotificationPortal from '@redhat-cloud-services/frontend-components-notifications/NotificationPortal/';
import messages from '../../Messages';

const errorStates = {
  403: (props) => (
    <NotAuthorized
      {...props}
      description={
        <FormattedMessage
          {...messages.notAuthorized}
          values={{
            page: (
              <>
                &nbsp;<a href={`./iam/my-user-access`}>My User Access</a>&nbsp;
              </>
            ),
          }}
        />
      }
    />
  ),
};

const ErroReducerCatcher = ({ children }) => {
  const errorCode = useSelector(({ errorReducer: { errorCode } }) => errorCode);
  const location = useLocation();
  const dispatch = useDispatch();
  const intl = useIntl();

  const sectionTitles = {
    '/users': intl.formatMessage(messages.rbacUsers),
    '/groups': intl.formatMessage(messages.rbacGroups),
  };

  useEffect(() => {
    if (errorCode) {
      dispatch({ type: API_ERROR, payload: undefined });
    }
  }, [location?.pathname]);

  if (errorCode) {
    const State = errorStates[errorCode];
    const name = sectionTitles[Object.keys(sectionTitles).find((key) => location?.pathname.includes(key))] || 'RBAC';

    return <State serviceName={name} />;
  }

  return (
    <Fragment>
      <NotificationPortal />
      {children}
    </Fragment>
  );
};

ErroReducerCatcher.propTypes = {
  children: PropTypes.node.isRequired,
};

export default ErroReducerCatcher;
