import React, { Fragment, ReactNode } from 'react';
import { Flex, FlexItem, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { ToolbarTitlePlaceholder } from '../ui-states/LoaderPlaceholders';
import { RbacBreadcrumbs } from '../navigation/Breadcrumbs';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';

import './PageLayout.scss';

interface BreadcrumbItemProps {
  title?: string;
  to?: string;
  isActive?: boolean;
}

interface PageLayoutProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItemProps[];
}

export const PageLayout: React.FC<PageLayoutProps> = ({ children, breadcrumbs }) => (
  <Fragment>
    {breadcrumbs && (
      <section className="pf-v5-c-page__main-breadcrumb">
        <RbacBreadcrumbs breadcrumbs={breadcrumbs} />
      </section>
    )}
    <PageHeader className="rbac-page-header">{children}</PageHeader>
  </Fragment>
);

interface PageTitleProps {
  title?: ReactNode;
  renderTitleTag?: () => ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}

export const PageTitle: React.FC<PageTitleProps> = ({ title, renderTitleTag, description, children }) => (
  <Fragment>
    <Flex>
      <FlexItem className="pf-v5-u-mb-sm">
        <PageHeaderTitle title={title || <ToolbarTitlePlaceholder />} className="rbac-page-header__title" />
      </FlexItem>
      <FlexItem alignSelf={{ default: 'alignSelfCenter' }}>{renderTitleTag && renderTitleTag()}</FlexItem>
    </Flex>
    {description && (
      <TextContent className="rbac-page-header__description">
        {typeof description === 'string' ? <Text component={TextVariants.p}>{description}</Text> : description}
      </TextContent>
    )}
    {children}
  </Fragment>
);
