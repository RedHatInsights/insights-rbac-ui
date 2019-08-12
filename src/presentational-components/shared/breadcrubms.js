import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';

const RbacBreadcrumbs = (breadcrumbs) => {
  return (
    breadcrumbs ?  <Breadcrumb style={ { minHeight: 18 } }>
      { Object.keys(breadcrumbs).map(item => (
        <BreadcrumbItem key={ breadcrumbs[item].title } isActive={ breadcrumbs[item].isActive }>
          { (breadcrumbs[item].to && <NavLink exact to={ breadcrumbs[item].to }>{ breadcrumbs[item].title }</NavLink>) || breadcrumbs[item].title }
        </BreadcrumbItem>
      )) }
    </Breadcrumb> : null
  );
};

RbacBreadcrumbs.propTypes = {
  breadcrumbs: PropTypes.array
};

export default RbacBreadcrumbs;
