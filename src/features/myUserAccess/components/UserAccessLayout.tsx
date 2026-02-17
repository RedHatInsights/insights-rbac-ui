import React from 'react';
import { Grid, GridItem, Title } from '@patternfly/react-core';
import { BundleCard, type Entitlements } from './BundleCard';

interface UserAccessLayoutProps {
  entitledBundles: Entitlements;
  title: string;
  currentBundle: string;
  /** When set, bundle switch uses callback instead of NavLink (avoids navigation-triggered freeze) */
  onBundleSelect?: (bundle: string) => void;
  children: React.ReactNode;
}

export const UserAccessLayout: React.FC<UserAccessLayoutProps> = ({ entitledBundles, title, currentBundle, onBundleSelect, children }) => {
  return (
    <Grid hasGutter>
      <GridItem lg={3} className="pf-v6-u-display-none pf-v6-u-display-block-on-lg" data-testid="entitle-section">
        <BundleCard entitlements={entitledBundles} currentBundle={currentBundle} onBundleSelect={onBundleSelect} />
      </GridItem>
      <GridItem lg={9} md={12}>
        <Title headingLevel="h2" size="lg" className="pf-v6-u-mb-md">
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
