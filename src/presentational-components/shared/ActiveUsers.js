import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Text, TextVariants } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
import PermissionsContext from '../../utilities/permissions-context';
import messages from '../../Messages';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';

const ActiveUser = ({ linkDescription, linkTitle }) => {
  const intl = useIntl();
  const chrome = useChrome();
  const env = chrome.getEnvironment();
  const prefix = chrome.isProd() ? '' : `${env}.`;
  const { orgAdmin } = useContext(PermissionsContext);
  return !chrome.isFedramp && orgAdmin ? (
    <Text className="pf-v5-u-mt-0" component={TextVariants.h7}>
      {`${intl.formatMessage(messages.usersDescription)} `}
      {linkDescription}
      <Text
        component={TextVariants.a}
        href={`https://www.${prefix}redhat.com/wapps/ugc/protected/usermgt/userList.html`}
        target="_blank"
        rel="noopener noreferrer"
      >
        {linkTitle}
        <ExternalLinkAltIcon />
      </Text>
      .
    </Text>
  ) : (
    <Text className="pf-v5-u-mt-0" component={TextVariants.h7}>
      {`${intl.formatMessage(messages.usersDescription)} `}
    </Text>
  );
};

ActiveUser.propTypes = {
  linkDescription: PropTypes.node,
  linkTitle: PropTypes.node,
};

ActiveUser.defaultProps = {
  linkDescription: '',
  linkTitle: ' user management list ',
};

export default ActiveUser;
