import React, { FunctionComponent } from 'react';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

type ActiveUsersNonAdminViewProps = {
  children?: React.ReactNode;
};

export const ActiveUsersNonAdminView: FunctionComponent<ActiveUsersNonAdminViewProps> = ({ children }) => {
  const intl = useIntl();
  return (
    <>
      <span className="pf-v6-u-mt-0">{`${intl.formatMessage(messages.usersDescription)} `}</span>
      {children}
    </>
  );
};
