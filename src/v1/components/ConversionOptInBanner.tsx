import React from 'react';
import { Alert, AlertActionLink } from '@patternfly/react-core';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import { useFlag } from '@unleash/proxy-client-react';
import { useIntl } from 'react-intl';
import { useIdentity } from '../../shared/hooks/useIdentity';
import messages from '../../Messages';

export interface ConversionOptInBannerProps {
  /** Callback when "Get started now" is clicked (admin only) */
  onGetStarted?: () => void;
  /** URL for "Learn more about the benefits" link (admin only). Defaults to "#" */
  learnMoreUrl?: string;
}

/**
 * Banner component that prompts users to opt-in to Workspace v2.
 * Shows different content based on user role:
 * - Admins: Can start the conversion wizard
 * - Non-admins: Can request their admin to convert
 *
 * Only shows in V1 routes when feature flag `platform-conversion.opt-in-banner` is enabled.
 */
export const ConversionOptInBanner: React.FC<ConversionOptInBannerProps> = ({ onGetStarted, learnMoreUrl = '#' }) => {
  const intl = useIntl();
  const isFeatureFlagEnabled = useFlag('platform-conversion.opt-in-banner');
  const { orgAdmin, ready } = useIdentity();

  // Don't render if feature flag is off
  if (!isFeatureFlagEnabled) {
    return null;
  }

  // Don't render while loading identity
  if (!ready) {
    return null;
  }

  // Only show banner for org admins (non-admin version not implemented yet)
  if (!orgAdmin) {
    return null;
  }

  // Admin version
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
