import React, { Fragment, ReactNode } from 'react';
import PageHeader from '@patternfly/react-component-groups/dist/dynamic/PageHeader';
import { RbacBreadcrumbs } from '../navigation/Breadcrumbs';
import { ToolbarTitlePlaceholder } from '../ui-states/LoaderPlaceholders';

interface BreadcrumbItemProps {
  title?: string;
  to?: string;
  isActive?: boolean;
}

interface PageTitleProps {
  title?: ReactNode;
  description?: ReactNode;
  label?: ReactNode;
  actionMenu?: ReactNode;
}

interface PageLayoutProps {
  /** Breadcrumb navigation items */
  breadcrumbs?: BreadcrumbItemProps[];
  /** Page title configuration */
  title?: PageTitleProps;
  /** Page content that appears below the title */
  children?: ReactNode;
}

/**
 * PageLayout provides a consistent page structure with:
 * - Optional breadcrumbs
 * - Page header with title, description, label, and actions
 * - Content area
 */
export const PageLayout: React.FC<PageLayoutProps> = ({ breadcrumbs, title, children }) => (
  <Fragment>
    {breadcrumbs && (
      <section className="pf-v6-c-page__main-breadcrumb">
        <RbacBreadcrumbs breadcrumbs={breadcrumbs} />
      </section>
    )}
    {title && (
      <PageHeader title={title.title || <ToolbarTitlePlaceholder />} subtitle={title.description} label={title.label} actionMenu={title.actionMenu} />
    )}
    {children}
  </Fragment>
);
