import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { TextContent, Text, TextVariants } from '@patternfly/react-core';

const ExpandableDescription = ({ description, roles }) => (
  <Fragment>
    <TextContent>
      <Text className="groups-table-detail heading" component={ TextVariants.small }>Description</Text>
      <Text className="groups-table-detail content" component={ TextVariants.h5 }>{ description }</Text>
    </TextContent>
    <TextContent>
      <Text className="groups-table-detail heading" component={ TextVariants.small }>roles</Text>
      <Text
        className="groups-table-detail content"
        component={ TextVariants.h5 }>
        { `${roles.map((role, index) => `${index !== 0 ? ', ' : ''} ${role.description}`)}` }
      </Text>
    </TextContent>
  </Fragment>
);

ExpandableDescription.propTypes = {
  description: PropTypes.string,
  roles: PropTypes.arrayOf(PropTypes.shape({
    name: PropTypes.string.isRequired,
    description: PropTypes.string
  })).isRequired
};

export default ExpandableDescription;

