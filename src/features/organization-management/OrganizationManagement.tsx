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

  useEffect(() => {
    if (chrome) {
      chrome.auth.getUser().then((chromeUser: ChromeUser | void) => {
        const { identity } = chromeUser || {};
        setOrganizationData({
          account_number: identity?.account_number,
          org_id: identity?.org_id,
          organization_name: identity?.organization?.name,
        });
      });
    }
  }, [chrome]);

  return (
    <PageHeader
      title={intl.formatMessage(messages.organizationWideAccessTitle)}
      subtitle={intl.formatMessage(messages.organizationWideAccessSubtitle)}
    >
      <Flex spaceItems={{ default: 'spaceItemsLg' }} className="pf-v5-u-mt-md">
        {organizationData.organization_name && (
          <FlexItem>
            <p>
              <strong>Organization name: </strong>
              {organizationData.organization_name}
            </p>
          </FlexItem>
        )}
        {organizationData.account_number && (
          <FlexItem>
            <p>
              <strong>Account number: </strong>
              {organizationData.account_number}
            </p>
          </FlexItem>
        )}
        {organizationData.org_id && (
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
