import React, { Fragment, useEffect } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import NotAuthorized from '@patternfly/react-component-groups/dist/dynamic/NotAuthorized';
import NotificationPortal from '@redhat-cloud-services/frontend-components-notifications/NotificationPortal/';
import AppLink from './AppLink';

import { API_ERROR } from '../../redux/action-types';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';

const errorStates = {
  403: ({ serviceName }) => (
    <NotAuthorized
      serviceName={serviceName}
      description={
        <FormattedMessage
          {...messages.contactOrgAdmin}
          values={{
            link: (
              <AppLink to={pathnames['my-user-access'].link} linkBasename="/iam">
                My User Access
              </AppLink>
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
