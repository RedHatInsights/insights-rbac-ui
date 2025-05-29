import React from 'react';
import PropTypes from 'prop-types';
import { NavLink } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import { BreadcrumbPlaceholder } from './loader-placeholders';

const RbacBreadcrumbs = (breadcrumbs) => {
  return breadcrumbs ? (
    <Breadcrumb>
      {Object.values(breadcrumbs).map((item, index) =>
        item.title ? (
          <BreadcrumbItem key={item.title} isActive={item.isActive}>
            {(item.to && (
              <NavLink end to={item.to}>
                {item.title}
              </NavLink>
            )) ||
              item.title}
          </BreadcrumbItem>
        ) : (
          <BreadcrumbPlaceholder key={index} />
        ),
      )}
    </Breadcrumb>
  ) : null;
};

RbacBreadcrumbs.propTypes = {
  breadcrumbs: PropTypes.object,
};

export default RbacBreadcrumbs;
