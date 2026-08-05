import React from 'react';
import { Alert, AlertActionLink } from '@patternfly/react-core';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

export interface ConversionOptInBannerProps {
  /** Whether the current user is an org admin */
  isOrgAdmin: boolean;
  /** Callback when "Get started now" is clicked (admin only) */
  onGetStarted?: () => void;
  /** URL for "Learn more about the benefits" link (admin only). Defaults to "#" */
  learnMoreUrl?: string;
}

export const ConversionOptInBanner: React.FC<ConversionOptInBannerProps> = ({ isOrgAdmin, onGetStarted, learnMoreUrl = '#' }) => {
  const intl = useIntl();

  if (!isOrgAdmin) {
    return null;
  }

  return (
    <Alert
      variant="custom"
      isInline
      title={intl.formatMessage(messages.conversionBannerAdminTitle)}
      actionLinks={
        <>
          <AlertActionLink onClick={onGetStarted}>{intl.formatMessage(messages.conversionBannerAdminGetStarted)}</AlertActionLink>
          <AlertActionLink component="a" href={learnMoreUrl} target="_blank" rel="noopener noreferrer">
            {intl.formatMessage(messages.conversionBannerAdminLearnMore)} <ExternalLinkAltIcon />
          </AlertActionLink>
        </>
      }
    >
      {intl.formatMessage(messages.conversionBannerNonAdminBody)}
    </Alert>
  );
};
