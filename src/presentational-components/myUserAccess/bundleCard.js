import React from 'react';
import PropTypes from 'prop-types';

import { Button, Card, CardTitle, CardBody, Stack, StackItem } from '@patternfly/react-core';

import './bundleCard.scss';

const MUABundleCard = ({ entitlement, title, body, appList, url }) => (
  <Card className={ `ins-c-mua-bundles__card ins-c-mua-bundles__card--${entitlement}` }>
    <CardTitle> { title }</CardTitle>
    <CardBody>
      <Stack hasGutter>
        <StackItem className='ins-c-mua-bundles__card--body'> { body } </StackItem>
        <StackItem className='ins-c-mua-bundles__card--applist'>
          { appList && Object.entries(appList).map(([ appName, appPath ]) => (
              <Button
                  component='a'
                  isInline
                  variant="link"
                  key={ appName }
                  href={ `${window.insights.chrome.isBeta() ? '/beta/' : '/'}${url}${appPath}` }>
                  { appName }
              </Button>
          )) }
        </StackItem>
      </Stack>
    </CardBody>
  </Card>
);

MUABundleCard.propTypes = {
  entitlement: PropTypes.string,
  title: PropTypes.string,
  body: PropTypes.string,
  url: PropTypes.string,
  appList: PropTypes.object
};

export default MUABundleCard;
