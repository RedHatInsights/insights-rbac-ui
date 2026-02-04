import React, { useEffect, useState } from 'react';
import { PageHeader } from '@patternfly/react-component-groups';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { ChromeUser } from '@redhat-cloud-services/types';
import messages from '../../Messages';
import { useIntl } from 'react-intl';

interface OrganizationData {
  account_number?: string;
  org_id?: string;
  organization_name?: string;
}

export const OrganizationManagement = () => {
  const intl = useIntl();
  const chrome = useChrome();
  const [organizationData, setOrganizationData] = useState<OrganizationData>({});
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (chrome) {
      chrome.auth
        .getUser()
        .then((chromeUser: ChromeUser | void) => {
          if (!chromeUser) {
            console.warn('OrganizationManagement: No user data received from chrome.auth.getUser()');
            setError('User data not available');
            return;
          }

          const { identity } = chromeUser;
          if (!identity) {
            console.warn('OrganizationManagement: User identity not available');
            setError('User identity not available');
            return;
          }

          setOrganizationData({
            account_number: identity.account_number,
            org_id: identity.org_id,
            organization_name: identity.organization?.name,
          });
          setError(null);
        })
        .catch((err) => {
          console.error('OrganizationManagement: Failed to fetch user data:', err);
          setError('Failed to load organization data');
        });
    }
  }, [chrome]);

  return (
    <PageHeader
      title={intl.formatMessage(messages.organizationWideAccessTitle)}
      subtitle={intl.formatMessage(messages.organizationWideAccessSubtitle)}
    >
      <Flex spaceItems={{ default: 'spaceItemsLg' }} className="pf-v5-u-mt-md">
        {error && (
          <FlexItem>
            <p style={{ color: 'var(--pf-global--danger-color--100)' }}>
              <strong>Error: </strong>
              {error}
            </p>
          </FlexItem>
        )}
        {!error && organizationData.organization_name && (
          <FlexItem>
            <p>
              <strong>Organization name: </strong>
              {organizationData.organization_name}
            </p>
          </FlexItem>
        )}
        {!error && organizationData.account_number && (
          <FlexItem>
            <p>
              <strong>Account number: </strong>
              {organizationData.account_number}
            </p>
          </FlexItem>
        )}
        {!error && organizationData.org_id && (
          <FlexItem>
            <p>
              <strong>Organization ID: </strong>
              {organizationData.org_id}
            </p>
          </FlexItem>
        )}
      </Flex>
    </PageHeader>
  );
};

export default OrganizationManagement;
