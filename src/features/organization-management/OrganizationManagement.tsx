import React from 'react';
import { PageHeader } from '@patternfly/react-component-groups';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import messages from '../../Messages';
import { useIntl } from 'react-intl';

export const OrganizationManagement = () => {
  const intl = useIntl();

  return (
    <PageHeader
      title={intl.formatMessage(messages.organizationWideAccessTitle)}
      subtitle={intl.formatMessage(messages.organizationWideAccessSubtitle)}
    >
      <Flex spaceItems={{ default: 'spaceItemsLg' }} className="pf-v5-u-mt-md">
        <FlexItem>
          <p>
            <strong>Organization name: </strong>
            N/A
          </p>
        </FlexItem>
        <FlexItem>
          <p>
            <strong>Account number: </strong>
            N/A
          </p>
        </FlexItem>
        <FlexItem>
          <p>
            <strong>Organization ID: </strong>
            N/A
          </p>
        </FlexItem>
      </Flex>
    </PageHeader>
  );
};

export default OrganizationManagement;
