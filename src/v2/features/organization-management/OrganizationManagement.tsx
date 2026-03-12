import React from 'react';
import { PageHeader } from '@patternfly/react-component-groups';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { useOrganizationData } from '../../hooks/useOrganizationData';
import messages from '../../../Messages';
import { useIntl } from 'react-intl';
import { useOrgGroups } from '../../data/queries/groupAssignments';
import { BaseGroupAssignmentsTable } from '../workspaces/workspace-detail/components';

export const OrganizationManagement = () => {
  const intl = useIntl();
  const { accountNumber, organizationId, organizationName, isLoading } = useOrganizationData();

  const { data: roleBindings, isLoading: roleBindingsIsLoading } = useOrgGroups(organizationId!, {
    enabled: !isLoading && !!organizationId,
  });

  return (
    <>
      <PageHeader
        title={intl.formatMessage(messages.organizationWideAccessTitle)}
        subtitle={intl.formatMessage(messages.organizationWideAccessSubtitle)}
      >
        <Flex spaceItems={{ default: 'spaceItemsLg' }} className="pf-v5-u-mt-md">
          {organizationName && (
            <FlexItem>
              <p>
                <strong>{intl.formatMessage(messages.organizationNameLabel)} </strong>
                {organizationName}
              </p>
            </FlexItem>
          )}
          {accountNumber && (
            <FlexItem>
              <p>
                <strong>{intl.formatMessage(messages.accountNumberLabel)} </strong>
                {accountNumber}
              </p>
            </FlexItem>
          )}
          {organizationId && (
            <FlexItem>
              <p>
                <strong>{intl.formatMessage(messages.organizationIdLabel)} </strong>
                {organizationId}
              </p>
            </FlexItem>
          )}
        </Flex>
      </PageHeader>
      <PageSection>
        <BaseGroupAssignmentsTable groups={roleBindings} isLoading={roleBindingsIsLoading} ouiaId="organization-role-assignments-table" />
      </PageSection>
    </>
  );
};

export default OrganizationManagement;
