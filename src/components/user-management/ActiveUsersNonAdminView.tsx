import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
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
      <Content className="pf-v6-u-mt-0" component={ContentVariants.h6}>
        {`${intl.formatMessage(messages.usersDescription)} `}
      </Content>
      {children}
    </>
  );
};
