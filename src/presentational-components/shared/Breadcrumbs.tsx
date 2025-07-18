import React from 'react';
import { NavLink } from 'react-router-dom';
import { Breadcrumb, BreadcrumbItem } from '@patternfly/react-core';
import { BreadcrumbPlaceholder } from './LoaderPlaceholders';

interface BreadcrumbItemProps {
  title?: string;
  to?: string;
  isActive?: boolean;
}

interface RbacBreadcrumbsProps {
  breadcrumbs?: BreadcrumbItemProps[];
}

const RbacBreadcrumbs: React.FC<RbacBreadcrumbsProps> = ({ breadcrumbs }) => {
  return breadcrumbs ? (
    <Breadcrumb>
      {breadcrumbs.map((item, index) =>
        item?.title ? (
          <BreadcrumbItem key={item.title} isActive={item.isActive}>
            {item.to ? (
              <NavLink end to={item.to}>
                {item.title}
              </NavLink>
            ) : (
              item.title
            )}
          </BreadcrumbItem>
        ) : (
          <BreadcrumbPlaceholder key={index} />
        ),
      )}
    </Breadcrumb>
  ) : null;
};

export default RbacBreadcrumbs;
