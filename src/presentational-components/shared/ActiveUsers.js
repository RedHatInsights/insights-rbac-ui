import React from 'react';
import PropTypes from 'prop-types';
import { TextContent, Text, TextVariants } from '@patternfly/react-core';
const ActiveUser = ({ description, linkTitle }) => (
    <TextContent>
        <Text
        className="pf-u-mt-0"
        component={ TextVariants.h7 }>
            {description}{ ' ' }
        <Text
            component={ TextVariants.a }
            href={ `https://www.${window.insights.chrome.isProd ? '' : 'qa.'}redhat.com/wapps/ugc/protected/usermgt/userList.html` }
            target="_blank"
            rel='noopener noreferrer'
        >
                {linkTitle}
        </Text>
        </Text>
    </TextContent>
);

ActiveUser.propTypes = {
    description: PropTypes.node,
    linkTitle: PropTypes.node
};

ActiveUser.defaultProps = {
    description: '',
    linkTitle: 'user management list.'
};

export default ActiveUser;
