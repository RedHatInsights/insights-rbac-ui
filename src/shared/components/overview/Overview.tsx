import React from 'react';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import PageHeader from '@patternfly/react-component-groups/dist/dynamic/PageHeader';
import { useIntl } from 'react-intl';
import { useFlag } from '@unleash/proxy-client-react';
import { useWorkspacesFlag } from '../../hooks/useWorkspacesFlag';
import messages from '../../../Messages';
import { EnableWorkspacesAlert } from '../workspaces/EnableWorkspacesAlert';
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
  const isWorkspacesEligible = useFlag('platform.rbac.workspaces-eligible');

  return (
    <React.Fragment>
      {isWorkspacesEligible && !isWorkspacesFlag && <EnableWorkspacesAlert />}
      <PageHeader
        title={intl.formatMessage(messages.overview)}
        subtitle={intl.formatMessage(messages.overviewSubtitle)}
        icon={<img src="/apps/frontend-assets/technology-icons/iam.svg" className="rbac-overview-icon" alt="RBAC landing page icon" />}
        linkProps={{
          label: intl.formatMessage(messages.learnMore),
          href: 'https://access.redhat.com/documentation/en-us/red_hat_hybrid_cloud_console/2023/html/user_access_configuration_guide_for_role-based_access_control_rbac/index',
        }}
      />
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
