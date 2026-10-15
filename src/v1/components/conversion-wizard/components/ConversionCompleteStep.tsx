import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { useIntl } from 'react-intl';
import CheckCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/check-circle-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';
import messages from '../../../../Messages';

export interface ConversionCompleteStepProps {
  /** Whether the API call is still in progress */
  isLoading?: boolean;
  /**
   * Called when the user clicks the dashboard button. Leaving the page is the caller's job:
   * conversion changes which version of the app the shell renders, so the caller has to decide
   * where to send the user, not this screen.
   */
  onComplete?: () => void;
}

/**
 * Conversion complete step component
 * Shows a loading spinner while the API call is in progress,
 * then displays a success message with navigation options
 */
export const ConversionCompleteStep: React.FC<ConversionCompleteStepProps> = ({ isLoading = false, onComplete }) => {
  const intl = useIntl();

  if (isLoading) {
    return (
      <div className="pf-v6-u-text-align-center pf-v6-u-p-xl">
        <Spinner size="xl" aria-label={intl.formatMessage(messages.conversionWizardConvertingLabel)} />
        <Content component="p" className="pf-v6-u-mt-md">
          {intl.formatMessage(messages.conversionWizardConvertingMessage)}
        </Content>
      </div>
    );
  }

  const handleNavigateToDashboard = () => {
    onComplete?.();
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
