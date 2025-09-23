import { Text, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
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
      <Text className="pf-v5-u-mt-0" component={TextVariants.h6}>
        {`${intl.formatMessage(messages.usersDescription)} `}
      </Text>
      {children}
    </>
  );
};
