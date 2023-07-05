import React from 'react';
import { useIntl } from 'react-intl';
import { Text, TextVariants } from '@patternfly/react-core';
import messages from '../../Messages';

const ActiveUser = () => {
  const intl = useIntl();

  return (
    <Text className="pf-u-mt-0" component={TextVariants.h7}>
      {`${intl.formatMessage(messages.usersDescription)} `}
    </Text>
  );
};

export default ActiveUser;
