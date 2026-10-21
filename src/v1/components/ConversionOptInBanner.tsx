import React from 'react';
import { Alert, AlertActionLink } from '@patternfly/react-core/dist/dynamic/components/Alert';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

const LEARN_MORE_URL =
  'https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf#page=6';

/**
 * Informational variant for users who cannot start a conversion themselves.
 *
 * Not shipped yet: the non-admin experience is out of scope for this release, so
 * `ConversionOptInBanner` renders nothing for non-admins rather than rendering this.
 * Kept here, with its messages and stories, so it is ready to wire up next release.
 */
export const ConversionOptInBannerNonAdmin: React.FC = () => {
  const intl = useIntl();

  return (
    <Alert variant="custom" isInline title={intl.formatMessage(messages.conversionBannerNonAdminTitle)}>
      {intl.formatMessage(messages.conversionBannerNonAdminBody)}
      {/*
        Deliberately not a link or a button: there is no request flow to send them to yet,
        so rendering it as text keeps it from looking clickable.
      */}
      <div className="pf-v6-u-mt-sm">{intl.formatMessage(messages.conversionBannerNonAdminRequest)}</div>
    </Alert>
  );
};

export interface ConversionOptInBannerProps {
  /** Whether the current user is an org admin */
  isOrgAdmin: boolean;
  /** Callback when "Get started now" is clicked (admin only) */
  onGetStarted?: () => void;
}

export const ConversionOptInBanner: React.FC<ConversionOptInBannerProps> = ({ isOrgAdmin, onGetStarted }) => {
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
          <AlertActionLink component="a" href={LEARN_MORE_URL} target="_blank" rel="noopener noreferrer">
            {intl.formatMessage(messages.conversionBannerAdminLearnMore)} <ExternalLinkAltIcon />
          </AlertActionLink>
        </>
      }
    >
      {intl.formatMessage(messages.conversionBannerAdminBody)}
    </Alert>
  );
};
