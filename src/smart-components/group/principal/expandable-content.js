import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { TextContent, Text, TextVariants } from '@patternfly/react-core';

const ExpandableContent = ({ username, email, first_name, last_name }) => (
  <Fragment>
    <TextContent>
      <Text className="principals-table-detail heading" component={ TextVariants.small }>Username</Text>
      <Text className="principals-table-detail content" component={ TextVariants.h5 }>{ username }</Text>
      <Text className="principals-table-detail heading" component={ TextVariants.small }>Email</Text>
      <Text className="principals-table-detail content" component={ TextVariants.h5 }>{ email }</Text>
      <Text className="principals-table-detail heading" component={ TextVariants.small }>Name</Text>
      <Text className="principals-table-detail content" component={ TextVariants.h5 }>{ `${first_name} ${last_name}` }</Text>
    </TextContent>
  </Fragment>
);

ExpandableContent.propTypes = {
  username: PropTypes.string,
  email: PropTypes.string,
  first_name: PropTypes.string,
  last_name: PropTypes.string
};

export default ExpandableContent;

