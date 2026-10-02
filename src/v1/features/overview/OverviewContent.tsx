import React, { useState } from 'react';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import PageHeader from '@patternfly/react-component-groups/dist/dynamic/PageHeader';
import { useIntl } from 'react-intl';
import { useIdentity } from '../../../shared/hooks/useIdentity';
import { useConversionOptIn } from '../../../capabilities/useConversionOptIn';
import { useWorkspacesEligibility, useWorkspacesFlag } from '../../../capabilities/useWorkspacesFlag';

import { EnableWorkspacesAlert } from '../../../shared/components/workspaces/EnableWorkspacesAlert';
import { ConversionOptInBanner } from '../../components/ConversionOptInBanner';
import { ConversionWizard } from '../../components/conversion-wizard/ConversionWizard';
import { GetStartedCard } from './components/GetStartedCard';
import { SupportingFeaturesSection } from './components/SupportingFeaturesSection';
import { RecommendedContentTable } from './components/RecommendedContentTable';

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
        title={intl.formatMessage({ id: 'overview', defaultMessage: 'User Access', description: 'Overview label' })}
        subtitle={intl.formatMessage({
          id: 'overviewSubtitle',
          defaultMessage:
            'Streamline access management for your organization’s users and resources with the User Access to ensure secure and efficient control over permissions and authorization.',
          description: 'Overview subtitle',
        })}
        icon={<img src="/apps/frontend-assets/technology-icons/iam.svg" className="rbac-overview-icon" alt="RBAC landing page icon" />}
        linkProps={{
          label: intl.formatMessage({ id: 'learnMore', defaultMessage: 'Learn more', description: 'learn more link' }),
          href: 'https://docs.redhat.com/en/documentation/red_hat_hybrid_cloud_console/1-latest/administer-manage_user_permissions_rbac_models',
        }}
      />
      {isConversionOptInEnabled && orgAdmin && (
        <PageSection hasBodyWrapper={false}>
          <ConversionOptInBanner isOrgAdmin={orgAdmin} onGetStarted={() => setIsWizardOpen(true)} />
        </PageSection>
      )}
      {isWizardOpen && <ConversionWizard onCancel={() => setIsWizardOpen(false)} onSuccess={() => setIsWizardOpen(false)} />}
      <PageSection hasBodyWrapper={false}>
        <GetStartedCard className="pf-v6-u-mb-lg" groupsLink={links.groups} rolesLink={links.roles} />
        <SupportingFeaturesSection className="pf-v6-u-mb-lg" groupsLink={links.groups} />
        <RecommendedContentTable className="pf-v6-u-mb-lg" />
        <a
          href="https://console.redhat.com/iam/learning-resources"
          className="pf-v6-u-mb-lg"
          data-ouia-component-id="overview-view-all-resources-button"
        >
          {intl.formatMessage({
            id: 'iamLearningResourcesLink',
            defaultMessage: 'View all Identity and Access Management Learning Resources.',
            description: 'Identity and Access Management Learning Resources link',
          })}
        </a>
      </PageSection>
    </React.Fragment>
  );
};

export { Overview };
export default Overview;
