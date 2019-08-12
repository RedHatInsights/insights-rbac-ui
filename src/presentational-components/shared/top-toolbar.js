import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Level, LevelItem, Text, TextContent, TextVariants  } from '@patternfly/react-core';
import { ToolbarTitlePlaceholder } from './loader-placeholders';
import RbacBreadcrumbs from './breadcrubms';

import './top-toolbar.scss';

export const TopToolbar = ({ children,  breadcrumbs, paddingBottom }) => (
  <div className={ `pf-u-pt-xl pf-u-pr-xl pf-u-pl-xl ${paddingBottom ? 'pf-u-pb-xl' : ''} top-toolbar` }>
    <Level className="pf-u-mb-md">
      <RbacBreadcrumbs { ...breadcrumbs } />
    </Level>
    { children }
  </div>
);

TopToolbar.propTypes = {
  children: PropTypes.oneOfType([
    PropTypes.arrayOf(PropTypes.node),
    PropTypes.node
  ]).isRequired,
  breadcrumbs: PropTypes.array,
  paddingBottom: PropTypes.bool
};

TopToolbar.defaultProps = {
  paddingBottom: false
};

export const TopToolbarTitle = ({ title, children }) => (
  <Fragment>
    <Level className="pf-u-mb-xl">
      <LevelItem>
        <TextContent className="top-toolbar-title">
          { <Text component={ TextVariants.h2 }>{ title || <ToolbarTitlePlaceholder /> }</Text> }
        </TextContent>
      </LevelItem>
      { children }
    </Level>
  </Fragment>
);

TopToolbarTitle.propTypes = {
  title: PropTypes.string.isRequired,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
};
