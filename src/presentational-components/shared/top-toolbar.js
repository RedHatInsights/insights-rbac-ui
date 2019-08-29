import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Level, LevelItem, Stack, StackItem, Text, TextContent, TextVariants  } from '@patternfly/react-core';
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

export const TopToolbarTitle = ({ title, description, children }) => (
  <Fragment>
    <Level className="pf-u-mb-xl">
      <LevelItem>
        <Stack gutter="sm">
          <StackItem>
            <TextContent className="top-toolbar-title">
              { <Text component={ TextVariants.h2 }>{ title || <ToolbarTitlePlaceholder /> }</Text> }
            </TextContent>
          </StackItem>
          <StackItem>
            <TextContent className="top-toolbar-title">
              { description || <Text component={ TextVariants.h4 }>{ description }</Text> }
            </TextContent>
          </StackItem>
        </Stack>
      </LevelItem>
      { children }
    </Level>
  </Fragment>
);

TopToolbarTitle.propTypes = {
  title: PropTypes.string,
  description: PropTypes.string,
  children: PropTypes.oneOfType([
    PropTypes.node,
    PropTypes.arrayOf(PropTypes.node)
  ])
};
