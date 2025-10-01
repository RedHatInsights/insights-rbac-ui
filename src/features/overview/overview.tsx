import React from 'react';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import ContentHeader from '@patternfly/react-component-groups/dist/dynamic/ContentHeader';
import { useIntl } from 'react-intl';
import { useFlag } from '@unleash/proxy-client-react';
import messages from '../../Messages';
import { EnableWorkspacesAlert } from '../workspaces/overview/components/EnableWorkspacesAlert';
import { GetStartedCard } from './components/GetStartedCard';
import { SupportingFeaturesSection } from './components/SupportingFeaturesSection';
import { RecommendedContentTable } from './components/RecommendedContentTable';
import './overview.scss';

const Overview: React.FC = () => {
  const intl = useIntl();
  const isWorkspacesFlag = useFlag('platform.rbac.workspaces');
  const isWorkspacesEligible = useFlag('platform.rbac.workspaces-eligible');

  return (
    <React.Fragment>
      {isWorkspacesEligible && !isWorkspacesFlag && <EnableWorkspacesAlert />}
      <ContentHeader
        title={intl.formatMessage(messages.overview)}
        subtitle={intl.formatMessage(messages.overviewSubtitle)}
        icon={<img src="/apps/frontend-assets/technology-icons/iam.svg" className="rbac-overview-icon" alt="RBAC landing page icon" />}
        linkProps={{
          label: intl.formatMessage(messages.learnMore),
          isExternal: true,
          href: 'https://access.redhat.com/documentation/en-us/red_hat_hybrid_cloud_console/2023/html/user_access_configuration_guide_for_role-based_access_control_rbac/index',
        }}
      />
      <PageSection>
        <GetStartedCard className="pf-v5-u-mb-lg" />
        <SupportingFeaturesSection className="pf-v5-u-mb-lg" />
        <RecommendedContentTable className="pf-v5-u-mb-lg" />
        <a
          href="https://console.redhat.com/settings/learning-resources?quickstart=rbac-admin-vuln-permissions"
          className="pf-v5-u-mb-lg"
          data-ouia-component-id="overview-view-all-resources-button"
        >
          {intl.formatMessage(messages.iamLearningResourcesLink)}
        </a>
      </PageSection>
    </React.Fragment>
  );
};

export default Overview;
