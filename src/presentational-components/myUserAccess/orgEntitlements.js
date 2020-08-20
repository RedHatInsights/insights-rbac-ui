import React from 'react';
import PropTypes from 'prop-types';

import { bundleData } from './bundles';
import { Stack, StackItem } from '@patternfly/react-core';
import MUABundleCard from './bundleCard';
import MUAPageSection from './pageSection';

const MUAOrgEntitlements = ({ entitlements }) => {

  const entitledBundles = Object.entries(entitlements).filter(([ , { is_entitled }]) => is_entitled);

  return (
    <React.Fragment>
      <MUAPageSection
      title={ `Your organization's subscriptions` }>
        <Stack hasGutter className='ins-l-mua-bundles'>
          { entitledBundles.map(([ key ]) => {
            const data = bundleData.find(({ entitlement }) => entitlement === key);
            return (
              data ? <StackItem key={ data.entitlement }>
                <MUABundleCard
                  entitlement={ data.entitlement }
                  title={ data.title }
                  body={ data.body }
                  url={ data.url }
                  appList={ data.apps }/>
              </StackItem> : <React.Fragment />
            );
          })}
        </Stack>
      </MUAPageSection>
    </React.Fragment>
  );
};

MUAOrgEntitlements.propTypes = {
  entitlements: PropTypes.object
};

export default MUAOrgEntitlements;
