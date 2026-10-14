import React from 'react';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { useIntl } from 'react-intl';
import ExclamationCircleIcon from '@patternfly/react-icons/dist/dynamic/icons/exclamation-circle-icon';
import messages from '../../../../Messages';

// TODO: no dedicated troubleshooting document exists yet, so this points at page 1 of the guide.
const TROUBLESHOOTING_LINK =
  'https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf#page=1';

export interface ConversionFailedStepProps {
  /** Error-specific explanation shown under the generic failure message. Omitted when the cause is unknown. */
  detail?: string;
}

/**
 * Conversion failed step component
 * Shown in place of the wizard when the conversion request fails, offering a link
 * to the troubleshooting documentation.
 */
export const ConversionFailedStep: React.FC<ConversionFailedStepProps> = ({ detail }) => {
  const intl = useIntl();

  return (
    <div className="pf-v6-u-text-align-center pf-v6-u-p-xl">
      <ExclamationCircleIcon
        style={{ fontSize: '4rem' }}
        color="var(--pf-t--global--icon--color--status--danger--default)"
        className="pf-v6-u-mb-md"
      />

      <Title headingLevel="h2" size="xl">
        {intl.formatMessage(messages.conversionWizardFailedTitle)}
      </Title>

      <div className="pf-v6-u-mt-md pf-v6-u-mb-lg">
        <Content component="p">{intl.formatMessage(messages.conversionWizardFailedMessage)}</Content>
        {/* `small` renders the subtler, smaller body style PatternFly reserves for supporting text. */}
        {detail && (
          <Content component="small" className="pf-v6-u-display-block pf-v6-u-mt-sm">
            {detail}
          </Content>
        )}
      </div>

      <Button variant="primary" component="a" href={TROUBLESHOOTING_LINK} target="_blank" rel="noopener noreferrer">
        {intl.formatMessage(messages.conversionWizardFailedButton)}
      </Button>
    </div>
  );
};
