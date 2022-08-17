import React from 'react';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

/**
 * Just a placeholder component. Will w8 for some designs.
 */
const NoMatch = () => {
  const intl = useIntl();
  return (
    <div>
      <h1>{intl.formatMessage(messages.pageNotExists)}</h1>
    </div>
  );
};

export default NoMatch;
