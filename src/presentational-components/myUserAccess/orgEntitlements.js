import React from 'react';
import PropTypes from 'prop-types';

import { bundleData } from './bundles';
import { Grid, GridItem } from '@patternfly/react-core';
import MUABundleCard from './bundleCard';

const MUAOrgEntitlements = ({ entitlements }) => {

  console.log(entitlements);

  const entitledBundles = Object.entries(entitlements).filter(([ , { is_entitled }]) => is_entitled);

  return (
    <Grid sm={ 12 } md={ 6 } lg={ 4 } hasGutter className='ins-l-mua-bundles'>
      { entitledBundles.map(([ key ]) => {
        const data = bundleData.find(({ entitlement }) => entitlement === key);
        return (
          data ? <GridItem key={ data.entitlement }>
            <MUABundleCard
              entitlement={ data.entitlement }
              title={ data.title }
              body={ data.body }
              url={ data.url }
              appList={ data.apps }/>
          </GridItem> : <React.Fragment />
        );
      })}
    </Grid>
  );
};

MUAOrgEntitlements.propTypes = {
  entitlements: PropTypes.object
};

export default MUAOrgEntitlements;
