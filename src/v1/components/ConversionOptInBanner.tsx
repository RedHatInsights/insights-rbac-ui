import React from 'react';
import { Alert, AlertActionLink } from '@patternfly/react-core/dist/dynamic/components/Alert';
import ExternalLinkAltIcon from '@patternfly/react-icons/dist/js/icons/external-link-alt-icon';
import { useIntl } from 'react-intl';

const LEARN_MORE_URL =
  'https://access.redhat.com/system/files/private_announcement_files/Hybrid-Cloud-Console-Access-Management-with-Workspaces.pdf#page=6';

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
      title={intl.formatMessage({
        id: 'conversionBannerAdminTitle',
        defaultMessage: 'Elevate your infrastructure with workspace-based access management',
        description: 'Title for workspace v2 conversion opt-in banner shown to org admins',
      })}
      actionLinks={
        <>
          <AlertActionLink onClick={onGetStarted}>
            {intl.formatMessage({
              id: 'conversionBannerAdminGetStarted',
              defaultMessage: 'Get started now',
              description: 'Get started button text for admin conversion banner',
            })}
          </AlertActionLink>
          <AlertActionLink component="a" href={LEARN_MORE_URL} target="_blank" rel="noopener noreferrer">
            {intl.formatMessage({
              id: 'conversionBannerAdminLearnMore',
              defaultMessage: 'Learn more about the benefits',
              description: 'Learn more link text for admin conversion banner',
            })}{' '}
            <ExternalLinkAltIcon />
          </AlertActionLink>
        </>
      }
    >
      {intl.formatMessage({
        id: 'conversionBannerNonAdminBody',
        defaultMessage:
          'Your organization is eligible for new workspace-based access management. Organize your RHEL systems into workspaces with hierarchical permission control. The new access management model introduces workspace organization, permission inheritance, and improved collaboration, all while preserving your existing permissions and access.',
        description: 'Body text for workspace v2 conversion opt-in banner shown to non-admin users',
      })}
    </Alert>
  );
};
