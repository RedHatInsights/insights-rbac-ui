import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import { useIntl } from 'react-intl';
import CheckCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/check-circle-icon';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/dynamic/icons/external-link-alt-icon';
import { mergeToBasename } from '../../../../shared/hooks/useAppLink';
import messages from '../../../../Messages';

/**
 * Where the user lands after converting. V2 serves its overview from `/overview`, while the V1
 * page this wizard is launched from lives at `/user-access/overview`; this screen only renders
 * after a successful conversion, so V2's path is the correct target.
 */
const POST_CONVERSION_OVERVIEW = mergeToBasename('/overview') as string;

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
    // Call the onComplete callback to close the wizard
    if (onComplete) {
      onComplete();
    }
    // A full page load rather than a client-side navigation. Conversion decides which version
    // of the app the shell renders, and both sides of that decision are cached for the lifetime
    // of the page: the opt-in query here, and Chrome's memoized `isKesselOrgOnboarded` behind
    // the navigation. Reloading re-runs both, so the user gets V2 pages and V2 nav together.
    window.location.assign(POST_CONVERSION_OVERVIEW);
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
