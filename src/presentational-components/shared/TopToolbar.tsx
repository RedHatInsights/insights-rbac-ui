import React, { Fragment, ReactNode } from 'react';
import { Flex, FlexItem, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { ToolbarTitlePlaceholder } from './LoaderPlaceholders';
import RbacBreadcrumbs from './Breadcrumbs';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/PageHeader';

import './TopToolbar.scss';

interface BreadcrumbItemProps {
  title?: string;
  to?: string;
  isActive?: boolean;
}

interface TopToolbarProps {
  children: ReactNode;
  breadcrumbs?: BreadcrumbItemProps[];
}

export const TopToolbar: React.FC<TopToolbarProps> = ({ children, breadcrumbs }) => (
  <Fragment>
    {breadcrumbs && (
      <section className="pf-v5-c-page__main-breadcrumb">
        <RbacBreadcrumbs breadcrumbs={breadcrumbs} />
      </section>
    )}
    <PageHeader className="rbac-page-header">{children}</PageHeader>
  </Fragment>
);

interface TopToolbarTitleProps {
  title?: ReactNode;
  renderTitleTag?: () => ReactNode;
  description?: ReactNode;
  children?: ReactNode;
}

export const TopToolbarTitle: React.FC<TopToolbarTitleProps> = ({ title, renderTitleTag, description, children }) => (
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
