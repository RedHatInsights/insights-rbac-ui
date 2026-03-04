import React from 'react';
import { PageHeader } from '@patternfly/react-component-groups';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { useOrganizationData } from '../../hooks/useOrganizationData';
import messages from '../../Messages';
import { useIntl } from 'react-intl';
import { useRoleBindingsQuery } from '../../data/queries/workspaces';
import { mapRoleBindingsToGroups } from '../../helpers/dataUtilities';
import { BaseGroupAssignmentsTable } from '../workspaces/workspace-detail/components';

export const OrganizationManagement = () => {
  const intl = useIntl();
  const { accountNumber, organizationId, organizationName, isLoading } = useOrganizationData();

  // Role bindings query — fetch all bindings up front, paginate/sort/filter client-side.
  // The role bindings API uses cursor-based pagination (no offset), so true server-side
  // pagination would require cursor iteration — a separate feature.
  const ROLE_BINDINGS_LIMIT = 1000;

  const roleBindingsQuery = useRoleBindingsQuery(
    {
      resourceId: `redhat/${organizationId}`,
      resourceType: 'tenant',
      fields: 'subject(group.name,group.user_count,group.description),role(id,name)',
      limit: ROLE_BINDINGS_LIMIT,
    },
    { enabled: !isLoading },
  );

  const roleBindings = roleBindingsQuery.data?.data ? mapRoleBindingsToGroups(roleBindingsQuery.data.data, intl) : [];
  const roleBindingsIsLoading = roleBindingsQuery.isLoading;

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
