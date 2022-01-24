import React from 'react';
import PropTypes from 'prop-types';

import { Grid, GridItem, Stack, StackItem, Title } from '@patternfly/react-core';

import MUACard from '../../presentational-components/myUserAccess/MUACard';

import './MUAContent.scss';
import MuaBundleRoute from './MUABundleRoute';
import OrgAdminContext from '../../utilities/org-admin-context';
import useSearchParams from '../../hooks/useSearchParams';
import { bundleData } from '../../presentational-components/myUserAccess/bundles';

const MUAContent = ({ entitlements, isOrgAdmin }) => {
  const entitledBundles = Object.entries(entitlements).filter(([, { is_entitled }]) => is_entitled);
  const unEntitledBundles = Object.entries(entitlements).filter(([, { is_entitled }]) => !is_entitled);
  const { bundle } = useSearchParams('bundle');

  return (
    <OrgAdminContext.Provider value={isOrgAdmin}>
      <Grid>
        <GridItem className="pf-m-3-col-on-md rbac-l-myUserAccess-section__cards rbac-m-hide-on-sm">
          <Stack>
            <StackItem className="rbac-l-myUserAccess-section__cards--entitled">
              <MUACard entitlements={entitledBundles} />
            </StackItem>
            {unEntitledBundles.length > 0 && (
              <StackItem className="rbac-l-myUserAccess-section__cards--unentitled">
                <MUACard header="Not subscribed" entitlements={unEntitledBundles} isDisabled />
              </StackItem>
            )}
          </Stack>
        </GridItem>
        <GridItem className="pf-m-9-col-on-md rbac-l-myUserAccess-section__table">
          {bundle !== 'application_services' && (
            <Title headingLevel="h3" size="xl">
              {`Your ${bundleData.find(({ entitlement }) => entitlement === bundle)?.title} ${isOrgAdmin ? 'roles' : 'permissions'}`}
            </Title>
          )}
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
