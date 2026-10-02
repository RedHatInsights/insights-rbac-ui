import React, { FunctionComponent } from 'react';
import { useIntl } from 'react-intl';

type ActiveUsersNonAdminViewProps = {
  children?: React.ReactNode;
};

export const ActiveUsersNonAdminView: FunctionComponent<ActiveUsersNonAdminViewProps> = ({ children }) => {
  const intl = useIntl();
  return (
    <>
      <span className="pf-v6-u-mt-0">{`${intl.formatMessage({ id: 'usersDescription', defaultMessage: 'These are all of the users in your Red Hat organization.', description: 'Description text for user list' })} `}</span>
      {children}
    </>
  );
};
