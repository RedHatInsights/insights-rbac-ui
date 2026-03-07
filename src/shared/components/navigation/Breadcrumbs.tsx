import React from 'react';
import { NavLink } from 'react-router-dom';
import { Breadcrumb } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { BreadcrumbItem } from '@patternfly/react-core/dist/dynamic/components/Breadcrumb';
import { BreadcrumbPlaceholder } from '../ui-states/LoaderPlaceholders';
import { useAppLink } from '../../hooks/useAppLink';

interface BreadcrumbItemProps {
  title?: string;
  to?: string;
  isActive?: boolean;
}

interface RbacBreadcrumbsProps {
  breadcrumbs?: BreadcrumbItemProps[];
}

const RbacBreadcrumbs: React.FC<RbacBreadcrumbsProps> = ({ breadcrumbs }) => {
  const toAppLink = useAppLink();

  return breadcrumbs ? (
    <Breadcrumb>
      {breadcrumbs.map((item, index) =>
        item?.title ? (
          <BreadcrumbItem key={item.title} isActive={item.isActive}>
            {item.to ? (
              <NavLink end to={toAppLink(item.to)}>
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

export { RbacBreadcrumbs };
