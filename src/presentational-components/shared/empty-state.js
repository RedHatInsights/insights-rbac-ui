import React from 'react';
import PropTypes from 'prop-types';
import { EmptyState, EmptyStateBody, EmptyStateIcon, EmptyStateVariant, Title } from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';

const EmptyWithAction = ({ title, icon, description, actions, ...props }) => (
  <EmptyState variant={EmptyStateVariant.small} {...props}>
    <EmptyStateIcon icon={icon || SearchIcon} />
    <Title headingLevel="h4" size="lg">
      {title}
    </Title>
    <EmptyStateBody className="pf-u-mb-md">
      {description.map((text, key) => (
        <React.Fragment key={key}>
          {text} <br />
        </React.Fragment>
      ))}
    </EmptyStateBody>
    {actions}
  </EmptyState>
);

EmptyWithAction.propTypes = {
  icon: PropTypes.func,
  title: PropTypes.node,
  description: PropTypes.node,
  actions: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
  className: PropTypes.string,
};

export default EmptyWithAction;
