import React from 'react';
import PropTypes from 'prop-types';
import classNames from 'classnames';

import {
    Stack, StackItem,
    Title,
    Card, CardTitle, CardBody
} from '@patternfly/react-core';

import { bundleData } from './bundles';

const MUACard = ({ header, entitlements, isDisabled }) => (
  <React.Fragment>
    <Title headingLevel="h3" size="xl"> { header } </Title>
    { entitlements && entitlements?.map(([ key ]) => {
      const data = bundleData.find(({ entitlement }) => entitlement === key);
      return (
        data ? <Card
          key={ data.title }
          isFlat
          className={ classNames(
            'ins-c-mua-bundles__card',
            `ins-c-mua-bundles__card--${data.entitlement}`,
            { 'ins-c-mua-bundles__card--disabled': isDisabled }
          ) }>
          <CardTitle className='ins-c-mua-bundles__card--header'> { data.title }</CardTitle>
          <CardBody>
            <Stack hasGutter>
              <StackItem className='ins-c-mua-bundles__card--applist'>
                {Object.entries(data.apps || {}).map(([ appName ]) => (
                  <span key={ appName }> { appName } </span>
                ))}
              </StackItem>
            </Stack>
          </CardBody>
        </Card> : null
      );
    })}
  </React.Fragment>
);

MUACard.propTypes = {
  header: PropTypes.string,
  entitlements: PropTypes.array,
  isDisabled: PropTypes.bool
};

export default MUACard;
