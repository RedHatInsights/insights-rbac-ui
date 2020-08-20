import React from 'react';
import PropTypes from 'prop-types';

import { Card, CardTitle, CardBody, Stack, StackItem } from '@patternfly/react-core';

import './bundleCard.scss';

const MUABundleCard = ({ entitlement, title, appList }) => {

  return (
    <Card
      isFlat
      className={ `ins-c-mua-bundles__card ins-c-mua-bundles__card--${entitlement}` }>
      <CardTitle> { title }</CardTitle>
      <CardBody>
        <Stack hasGutter>
          <StackItem className='ins-c-mua-bundles__card--applist'>
            { appList && Object.entries(appList).map(([ appName ]) => (
                <span key={ appName }> { appName } </span>
            )) }
          </StackItem>
        </Stack>
      </CardBody>
    </Card>
  );
};

MUABundleCard.propTypes = {
  entitlement: PropTypes.string,
  title: PropTypes.string,
  appList: PropTypes.object
};

export default MUABundleCard;
