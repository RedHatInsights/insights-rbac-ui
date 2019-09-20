import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';

const RbacBreadcrumbs = (breadcrumbs) => {
  return (
    <Fragment>
      { breadcrumbs && <Breadcrumb className="pf-u-pt-xl">
        { Object.values(breadcrumbs).map(item => (
          <BreadcrumbItem key={ item.title } isActive={ item.isActive }>
            { (item.to && <NavLink exact to={ item.to }>{ item.title }</NavLink>) || item.title }
          </BreadcrumbItem>
        )) }
      </Breadcrumb> }
    </Fragment>
  );
};

RbacBreadcrumbs.propTypes = {
  breadcrumbs: PropTypes.object
};

export default RbacBreadcrumbs;
