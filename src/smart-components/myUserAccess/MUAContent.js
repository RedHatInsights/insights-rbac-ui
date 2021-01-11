import React from 'react';
import PropTypes from 'prop-types';

import { Grid, GridItem, Stack, StackItem, Title } from '@patternfly/react-core';

import MUACard from '../../presentational-components/myUserAccess/MUACard';

import './MUAContent.scss';
import MuaBundleRoute from './MUABundleRoute';
import OrgAdminContext from '../../utilities/org-admin-context';

const MUAContent = ({ entitlements, isOrgAdmin }) => {
  const entitledBundles = Object.entries(entitlements).filter(([, { is_entitled }]) => is_entitled);
  const unEntitledBundles = Object.entries(entitlements).filter(([, { is_entitled }]) => !is_entitled);

  return (
    <OrgAdminContext.Provider value={isOrgAdmin}>
      <Grid>
        <GridItem className="pf-m-3-col-on-md ins-l-myUserAccess-section__cards ins-m-hide-on-sm">
          <Stack>
            <StackItem className="ins-l-myUserAccess-section__cards--entitled">
              {/* No conditional here because you have to have a subscription to get to /settings */}
              <MUACard header={`Your organization's subscriptions`} entitlements={entitledBundles} />
            </StackItem>
            {unEntitledBundles.length > 0 && (
              <StackItem className="ins-l-myUserAccess-section__cards--unentitled">
                <MUACard header="Not subscribed" entitlements={unEntitledBundles} isDisabled />
              </StackItem>
            )}
          </Stack>
        </GridItem>
        <GridItem className="pf-m-9-col-on-md ins-l-myUserAccess-section__table">
          <Title headingLevel="h3" size="xl">
            Your {isOrgAdmin ? 'roles' : 'permissions'}
          </Title>
          <MuaBundleRoute />
        </GridItem>
      </Grid>
    </OrgAdminContext.Provider>
  );
};

MUAContent.propTypes = {
  entitlements: PropTypes.object,
  isOrgAdmin: PropTypes.bool,
};

export default MUAContent;
