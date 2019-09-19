import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Level, LevelItem, Text, TextContent, TextVariants  } from '@patternfly/react-core';
import { ToolbarTitlePlaceholder } from './loader-placeholders';
import RbacBreadcrumbs from './breadcrubms';

import './top-toolbar.scss';

export const TopToolbar = ({ children,  breadcrumbs, paddingBottom }) => (
  <div className={ `pf-u-pr-xl pf-u-pl-lg ${paddingBottom ? 'pf-u-pb-sm' : ''} top-toolbar` }>
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
    <Level>
      <LevelItem>
        <Text className="pf-u-mb-sm">
          <TextContent>
            { <Text component={ TextVariants.h1 }>{ title || <ToolbarTitlePlaceholder /> }</Text> }
          </TextContent>
        </Text>
        { description &&
            <Text className="pf-u-pt-sm pf-u-mb-md">
              <TextContent>
                <Text component={ TextVariants.p }>{ description }</Text>
              </TextContent>
            </Text> }
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
