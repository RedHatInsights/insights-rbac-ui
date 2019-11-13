import React from 'react';
import PropTypes from 'prop-types';
import {
  Bullseye,
  EmptyState,
  Title,
  EmptyStateVariant,
  EmptyStateBody,
  EmptyStateIcon
} from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';

const EmptyWithFilter = ({ title, icon, description, actions, ...props }) => (
  <Bullseye { ...props }>
    <EmptyState variant={ EmptyStateVariant.full }>
      <EmptyStateIcon icon={ icon || SearchIcon } />
      <Title headingLevel="h5" size="lg">
        { title }
      </Title>
      <EmptyStateBody>
        { description.map((text, key) => <React.Fragment key={ key }>{ text } <br /></React.Fragment>) }
      </EmptyStateBody>
      { actions }
    </EmptyState>
  </Bullseye >
);

EmptyWithFilter.propTypes = {
  icon: PropTypes.node,
  title: PropTypes.node,
  description: PropTypes.node,
  actions: PropTypes.arrayOf(PropTypes.node),
  className: PropTypes.string
};

EmptyWithFilter.propTypes = {
  actions: []
};

export default EmptyWithFilter;
