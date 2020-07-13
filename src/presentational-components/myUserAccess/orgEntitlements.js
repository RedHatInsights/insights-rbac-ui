import React from 'react';
import PropTypes from 'prop-types';

import { bundleData } from './bundles';
import { Grid, GridItem } from '@patternfly/react-core';
import MUABundleCard from './bundleCard';

const MUAOrgEntitlements = ({ entitlements }) => {

  let entitledBundles = [];

  Object.entries(entitlements).map(([ key, value ]) => value.is_entitled === true && entitledBundles.push(key));

  return (
    <Grid sm={ 12 } md={ 6 } lg={ 4 } hasGutter className='ins-l-mua-bundles'>
      { bundleData.map(data => entitledBundles.includes(data.entitlement) &&
        <GridItem key={ data.entitlement }>
          <MUABundleCard
            entitlement={ data.entitlement }
            title={ data.title }
            body={ data.body }
            url={ data.url }
            appList={ data.apps }/>
        </GridItem>
      )}
    </Grid>
  );
};

MUAOrgEntitlements.propTypes = {
  entitlements: PropTypes.object
};

export default MUAOrgEntitlements;
