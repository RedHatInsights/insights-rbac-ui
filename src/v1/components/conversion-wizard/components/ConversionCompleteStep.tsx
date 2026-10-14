import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { useIntl } from 'react-intl';
import CheckCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/check-circle-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import messages from '../../../../Messages';
import pathnames from '../../../utilities/pathnames';

export interface ConversionCompleteStepProps {
  /** Whether the API call is still in progress */
  isLoading?: boolean;
  /** Callback to call when user completes the success flow (clicks dashboard button) */
  onComplete?: () => void;
}

/**
 * Conversion complete step component
 * Shows a loading spinner while the API call is in progress,
 * then displays a success message with navigation options
 */
export const ConversionCompleteStep: React.FC<ConversionCompleteStepProps> = ({ isLoading = false, onComplete }) => {
  const intl = useIntl();
  const navigate = useAppNavigate();

  if (isLoading) {
    return (
      <div className="pf-v6-u-text-align-center pf-v6-u-p-xl">
        <Spinner size="xl" aria-label="Converting organization" />
        <Content component="p" className="pf-v6-u-mt-md">
          Converting your organization...
        </Content>
      </div>
    );
  }

  const handleNavigateToDashboard = () => {
    // Call the onComplete callback to close the wizard
    if (onComplete) {
      onComplete();
    }
    // Navigate to the overview page
    navigate(pathnames.overview.link());
  };

  return (
    <div className="pf-v6-u-text-align-center pf-v6-u-p-xl">
      <CheckCircleIcon style={{ fontSize: '4rem' }} color="var(--pf-t--global--icon--color--status--success--default)" className="pf-v6-u-mb-md" />

      <Title headingLevel="h2" size="xl">
        {intl.formatMessage(messages.conversionWizardCompleteTitle)}
      </Title>

      <Content component="p" className="pf-v6-u-mt-md pf-v6-u-mb-lg">
        {intl.formatMessage(messages.conversionWizardCompleteMessage)}
      </Content>

      <div className="pf-v6-u-mb-md">
        <Button variant="primary" onClick={handleNavigateToDashboard}>
          {intl.formatMessage(messages.conversionWizardCompleteButton)}
        </Button>
      </div>

      <div>
        <a
          href="https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf"
          target="_blank"
          rel="noopener noreferrer"
          className="pf-v6-c-button pf-m-link"
        >
          {intl.formatMessage(messages.conversionWizardCompleteLink)}
          <ExternalLinkAltIcon className="pf-v6-u-ml-sm" />
        </a>
      </div>
    </div>
  );
};
