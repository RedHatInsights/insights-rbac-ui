import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { TextContent, Text, TextVariants } from '@patternfly/react-core';

const ExpandableDescription = ({ description, members }) => (
  <Fragment>
    <TextContent>
      <Text className="groups-table-detail heading" component={ TextVariants.small }>Description</Text>
      <Text className="groups-table-detail content" component={ TextVariants.h5 }>{ description }</Text>
    </TextContent>
    <TextContent>
      <Text className="groups-table-detail heading" component={ TextVariants.small }>members</Text>
      <Text
        className="groups-table-detail content"
        component={ TextVariants.h5 }>
        { `${members.map(({ first_name, last_name }, index) => `${index !== 0 ? ' ' : ''}${first_name} ${last_name}`)}` }
      </Text>
    </TextContent>
  </Fragment>
);

ExpandableDescription.propTypes = {
  description: PropTypes.string.isRequired,
  members: PropTypes.arrayOf(PropTypes.shape({
    first_name: PropTypes.string.isRequired,
    last_name: PropTypes.string.isRequired
  })).isRequired
};

export default ExpandableDescription;

