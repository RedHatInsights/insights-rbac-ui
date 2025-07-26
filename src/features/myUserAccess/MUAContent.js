import React from 'react';
import PropTypes from 'prop-types';

import { Grid, GridItem, Stack, StackItem, Title } from '@patternfly/react-core';

import MUACard from './components/MUACard';

import './MUAContent.scss';
import MuaBundleRoute from './MUABundleRoute';
import OrgAdminContext from '../../utilities/orgAdminContext';
import useSearchParams from '../../hooks/useSearchParams';
import { bundleData } from './components/bundles';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

const MUAContent = ({ entitlements, isOrgAdmin, isUserAccessAdmin }) => {
  const intl = useIntl();
  const entitledBundles = Object.entries(entitlements).filter(([, { is_entitled }]) => is_entitled);
  const { bundle } = useSearchParams('bundle');
  const hasAdminAccess = isOrgAdmin || isUserAccessAdmin;

  return (
    <OrgAdminContext.Provider value={hasAdminAccess}>
      <Grid>
        <GridItem className="pf-m-3-col-on-lg rbac-l-myUserAccess-section__cards">
          <Stack>
            <StackItem data-testid="entitle-section" className="rbac-l-myUserAccess-section__cards--entitled">
              <MUACard entitlements={entitledBundles} />
            </StackItem>
          </Stack>
        </GridItem>
        <GridItem className="pf-m-12-col pf-m-9-col-on-xl rbac-l-myUserAccess-section__table">
          <Title headingLevel="h3" size="xl">
            {intl.formatMessage(hasAdminAccess ? messages.yourRoles : messages.yourPermissions, {
              name: bundleData.find(({ entitlement }) => entitlement === bundle)?.title,
            })}
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
  isUserAccessAdmin: PropTypes.bool,
};

export default MUAContent;
