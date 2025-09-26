import React from 'react';
import { Grid } from '@patternfly/react-core';
import { GridItem } from '@patternfly/react-core';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { BundleCard, type Entitlements } from './BundleCard';
import './UserAccessLayout.scss';

interface UserAccessLayoutProps {
  entitledBundles: Entitlements;
  title: string;
  currentBundle: string;
  children: React.ReactNode;
}

export const UserAccessLayout: React.FC<UserAccessLayoutProps> = ({ entitledBundles, title, currentBundle, children }) => {
  return (
    <Grid>
      <GridItem className="pf-m-3-col-on-lg rbac-l-myUserAccess-section__cards">
        <Stack>
          <StackItem data-testid="entitle-section" className="rbac-l-myUserAccess-section__cards--entitled">
            <BundleCard entitlements={entitledBundles} currentBundle={currentBundle} />
          </StackItem>
        </Stack>
      </GridItem>
      <GridItem className="pf-m-12-col pf-m-9-col-on-xl rbac-l-myUserAccess-section__table">
        <Title headingLevel="h3" size="xl">
          {title}
        </Title>
        {children}
      </GridItem>
    </Grid>
  );
};

export default UserAccessLayout;

// Re-export types for convenience
export type { Entitlements };
