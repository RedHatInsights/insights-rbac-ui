import React, { useState } from 'react';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import PageHeader from '@patternfly/react-component-groups/dist/dynamic/PageHeader';
import { useIntl } from 'react-intl';
import { useIdentity } from '../../../shared/hooks/useIdentity';
import { useConversionOptIn } from '../../../capabilities/useConversionOptIn';
import { useWorkspacesEligibility, useWorkspacesFlag } from '../../../capabilities/useWorkspacesFlag';
import messages from '../../../Messages';
import { EnableWorkspacesAlert } from '../../../shared/components/workspaces/EnableWorkspacesAlert';
import { ConversionOptInBanner } from '../../components/ConversionOptInBanner';
import { ConversionWizard } from '../../components/conversion-wizard/ConversionWizard';
import { GetStartedCard } from './components/GetStartedCard';
import { SupportingFeaturesSection } from './components/SupportingFeaturesSection';
import { RecommendedContentTable } from './components/RecommendedContentTable';

/**
 * Where a converted tenant lands. V2 serves its overview from `/overview`; this V1 page lives at
 * `/user-access/overview`, which the tenant no longer has any business being on.
 *
 * A full page load rather than a client-side navigation: conversion changes which version of the
 * app the shell renders, and both sides of that decision are cached for the lifetime of the page
 * — the tenant opt-in query here, and Chrome's memoized `isKesselOrgOnboarded` behind the nav.
 * Reloading re-runs both, so the user gets V2 pages and V2 nav together.
 */
const leaveForV2Overview = () => window.location.assign('/iam/overview');

export interface OverviewLinks {
  groups: string;
  roles: string;
}

interface OverviewProps {
  links: OverviewLinks;
}

const Overview: React.FC<OverviewProps> = ({ links }) => {
  const intl = useIntl();
  const isWorkspacesFlag = useWorkspacesFlag('m5');
  const isConversionOptInEnabled = useConversionOptIn();
  const { orgAdmin } = useIdentity();
  const isWorkspacesEligible = useWorkspacesEligibility();
  const [isWizardOpen, setIsWizardOpen] = useState(false);

  return (
    <React.Fragment>
      {isWorkspacesEligible && !isWorkspacesFlag && <EnableWorkspacesAlert />}
      <PageHeader
        title={intl.formatMessage(messages.overview)}
        subtitle={intl.formatMessage(messages.overviewSubtitle)}
        icon={<img src="/apps/frontend-assets/technology-icons/iam.svg" className="rbac-overview-icon" alt="RBAC landing page icon" />}
        linkProps={{
          label: intl.formatMessage(messages.learnMore),
          href: 'https://docs.redhat.com/en/documentation/red_hat_hybrid_cloud_console/1-latest/administer-manage_user_permissions_rbac_models',
        }}
      />
      {isConversionOptInEnabled && orgAdmin && (
        <PageSection hasBodyWrapper={false}>
          <ConversionOptInBanner isOrgAdmin={orgAdmin} onGetStarted={() => setIsWizardOpen(true)} />
        </PageSection>
      )}
      {isWizardOpen && <ConversionWizard onCancel={() => setIsWizardOpen(false)} onSuccess={leaveForV2Overview} />}
      <PageSection hasBodyWrapper={false}>
        <GetStartedCard className="pf-v6-u-mb-lg" groupsLink={links.groups} rolesLink={links.roles} />
        <SupportingFeaturesSection className="pf-v6-u-mb-lg" groupsLink={links.groups} />
        <RecommendedContentTable className="pf-v6-u-mb-lg" />
        <a
          href="https://console.redhat.com/iam/learning-resources"
          className="pf-v6-u-mb-lg"
          data-ouia-component-id="overview-view-all-resources-button"
        >
          {intl.formatMessage(messages.iamLearningResourcesLink)}
        </a>
      </PageSection>
    </React.Fragment>
  );
};

export { Overview };
export default Overview;
