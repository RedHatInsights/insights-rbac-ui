import React from 'react';
import { PageHeader } from '@patternfly/react-component-groups';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { useOrganizationData } from '../../hooks/useOrganizationData';
import messages from '../../Messages';
import { useIntl } from 'react-intl';
import { BaseGroupAssignmentsTable } from '../workspaces/workspace-detail/components/BaseGroupAssignmentsTable';
import { useRoleBindingsQuery } from '../../data/queries/workspaces';
import { mapRoleBindingsToGroups } from '../../helpers/dataUtilities';

export const OrganizationManagement = () => {
  const intl = useIntl();
  const { data: orgData, error } = useOrganizationData();

  // Role bindings query — fetch all bindings up front, paginate/sort/filter client-side.
  // The role bindings API uses cursor-based pagination (no offset), so true server-side
  // pagination would require cursor iteration — a separate feature.
  const ROLE_BINDINGS_LIMIT = 1000;

  const roleBindingsQuery = useRoleBindingsQuery(
    {
      resourceId: orgData?.organizationId || '',
      resourceType: 'organization',
      subjectType: 'group',
      limit: ROLE_BINDINGS_LIMIT,
      parentRoleBindings: false,
    },
    { enabled: !!orgData?.organizationId },
  );

  const roleBindings = roleBindingsQuery.data?.data ? mapRoleBindingsToGroups(roleBindingsQuery.data.data, intl) : [];
  const roleBindingsTotalCount = roleBindingsQuery.data?.data?.length ?? 0;
  const roleBindingsIsLoading = roleBindingsQuery.isLoading;

  if (roleBindingsTotalCount >= ROLE_BINDINGS_LIMIT) {
    console.warn(
      `[OrganizationManagement] Role bindings response returned ${roleBindingsTotalCount} items (limit: ${ROLE_BINDINGS_LIMIT}). ` +
        'Results may be truncated. Consider implementing cursor-based pagination.',
    );
  }

  return (
    <>
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
          {!error && orgData?.organizationName && (
            <FlexItem>
              <p>
                <strong>{intl.formatMessage(messages.organizationNameLabel)} </strong>
                {orgData.organizationName}
              </p>
            </FlexItem>
          )}
          {!error && orgData?.accountNumber && (
            <FlexItem>
              <p>
                <strong>{intl.formatMessage(messages.accountNumberLabel)} </strong>
                {orgData.accountNumber}
              </p>
            </FlexItem>
          )}
          {!error && orgData?.organizationId && (
            <FlexItem>
              <p>
                <strong>{intl.formatMessage(messages.organizationIdLabel)} </strong>
                {orgData.organizationId}
              </p>
            </FlexItem>
          )}
        </Flex>
      </PageHeader>
      {!error && (
        <PageSection>
          <BaseGroupAssignmentsTable
            groups={roleBindings}
            totalCount={roleBindingsTotalCount}
            isLoading={roleBindingsIsLoading}
            ouiaId="organization-role-assignments-table"
          />
        </PageSection>
      )}
    </>
  );
};

export default OrganizationManagement;
