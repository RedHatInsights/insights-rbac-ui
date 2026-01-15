import React, { ReactNode, useEffect } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useLocation } from 'react-router-dom';
import UnauthorizedAccess from '@patternfly/react-component-groups/dist/dynamic/UnauthorizedAccess';
import { AppLink } from '../navigation/AppLink';

import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';

const errorStates = {
  403: ({ serviceName }: { serviceName: string }) => (
    <UnauthorizedAccess
      data-codemods
      serviceName={serviceName}
      bodyText={
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

interface ErrorReducerCatcherProps {
  children: ReactNode;
}

const ErrorReducerCatcher: React.FC<ErrorReducerCatcherProps> = ({ children }) => {
  const errorCode = useSelector(({ errorReducer: { errorCode } }: any) => errorCode);
  const location = useLocation();
  const dispatch = useDispatch();
  const intl = useIntl();

  const sectionTitles: Record<string, string> = {
    '/users': intl.formatMessage(messages.rbacUsers),
    '/groups': intl.formatMessage(messages.rbacGroups),
  };

  useEffect(() => {
    if (errorCode) {
      // dispatch({ type: API_ERROR, payload: undefined });
    }
  }, [location?.pathname, dispatch, errorCode]);

  if (errorCode) {
    const State = errorStates[errorCode as keyof typeof errorStates];
    const name = sectionTitles[Object.keys(sectionTitles).find((key) => location?.pathname.includes(key)) || ''] || 'RBAC';

    return State ? <State serviceName={name} /> : null;
  }

  return children;
};

export default ErrorReducerCatcher;
