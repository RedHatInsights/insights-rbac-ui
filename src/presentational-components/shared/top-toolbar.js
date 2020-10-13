import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Text, TextContent, TextVariants, Flex, FlexItem } from '@patternfly/react-core';
import { ToolbarTitlePlaceholder } from './loader-placeholders';
import RbacBreadcrumbs from './breadcrubms';
import { PageHeader, PageHeaderTitle } from '@redhat-cloud-services/frontend-components/components/PageHeader';

import './top-toolbar.scss';

export const TopToolbar = ({ children, breadcrumbs }) => (
  <Fragment>
    {breadcrumbs && (
      <section className="pf-c-page__main-breadcrumb">
        <RbacBreadcrumbs {...breadcrumbs} />
      </section>
    )}
    <PageHeader className="ins-rbac-page-header">{children}</PageHeader>
  </Fragment>
);

TopToolbar.propTypes = {
  children: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.node), PropTypes.node]).isRequired,
  breadcrumbs: PropTypes.array,
  paddingBottom: PropTypes.bool,
};

TopToolbar.defaultProps = {
  paddingBottom: false,
};

export const TopToolbarTitle = ({ title, renderTitleTag, description, children }) => (
  <Fragment>
    <Flex>
      <FlexItem className="pf-u-mb-sm">
        <PageHeaderTitle title={title || <ToolbarTitlePlaceholder />} className="ins-rbac-page-header__title" />
      </FlexItem>
      <FlexItem alignSelf={{ modifier: 'alignSelfCenter' }}>{renderTitleTag && renderTitleTag()}</FlexItem>
    </Flex>
    {description && (
      <TextContent className="ins-rbac-page-header__description">
        {typeof description === 'string' ? <Text component={TextVariants.p}>{description}</Text> : description}
      </TextContent>
    )}
    {children}
  </Fragment>
);

TopToolbarTitle.propTypes = {
  title: PropTypes.node,
  renderTitleTag: PropTypes.func,
  description: PropTypes.node,
  children: PropTypes.oneOfType([PropTypes.node, PropTypes.arrayOf(PropTypes.node)]),
};
