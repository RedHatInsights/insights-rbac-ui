import React from 'react';
import PropTypes from 'prop-types';
import { Text, TextVariants } from '@patternfly/react-core';
import { ExternalLinkAltIcon } from '@patternfly/react-icons';
const ActiveUser = ({ description, linkTitle }) => (
  <Text className="pf-u-mt-0" component={TextVariants.h7}>
    {description}
    <Text
      component={TextVariants.a}
      href={`https://www.${window.insights.chrome.isProd ? '' : 'qa.'}redhat.com/wapps/ugc/protected/usermgt/userList.html`}
      target="_blank"
      rel="noopener noreferrer"
    >
      {linkTitle}
      <ExternalLinkAltIcon />
    </Text>
    .
  </Text>
);

ActiveUser.propTypes = {
  description: PropTypes.node,
  linkTitle: PropTypes.node,
};

ActiveUser.defaultProps = {
  description: '',
  linkTitle: ' user management list ',
};

export default ActiveUser;
