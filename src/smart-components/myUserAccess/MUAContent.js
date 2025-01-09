import React from 'react';
import PropTypes from 'prop-types';

import { Grid, GridItem, Stack, StackItem, Title } from '@patternfly/react-core';

import MUACard from '../../presentational-components/myUserAccess/MUACard';

import './MUAContent.scss';
import MuaBundleRoute from './MUABundleRoute';
import OrgAdminContext from '../../utilities/org-admin-context';
import useSearchParams from '../../hooks/useSearchParams';
import { bundleData } from '../../presentational-components/myUserAccess/bundles';
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
        <GridItem className="pf-m-3-col-on-md rbac-l-myUserAccess-section__cards rbac-m-hide-on-sm">
          <Stack>
            <StackItem data-testid="entitle-section" className="rbac-l-myUserAccess-section__cards--entitled">
              <MUACard entitlements={entitledBundles} />
            </StackItem>
          </Stack>
        </GridItem>
        <GridItem className="pf-m-9-col-on-md rbac-l-myUserAccess-section__table">
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
