import React, { useEffect, useState } from 'react';
import { PageHeader } from '@patternfly/react-component-groups';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { type UserIdentity, usePlatformAuth } from '../../hooks/usePlatformAuth';
import messages from '../../Messages';
import { useIntl } from 'react-intl';
import { RoleAssignmentsTable } from '../workspaces/workspace-detail/components/RoleAssignmentsTable';
import { useRoleBindingsQuery } from '../../data/queries/workspaces';
import { mapRoleBindingsToGroups } from '../../helpers/dataUtilities';

interface OrganizationData {
  account_number?: string;
  org_id?: string;
  organization_name?: string;
}

export const OrganizationManagement = () => {
  const intl = useIntl();
  const { getUser } = usePlatformAuth();
  const [organizationData, setOrganizationData] = useState<OrganizationData>({});
  const [error, setError] = useState<string | null>(null);

  // State for RoleAssignmentsTable
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [sortBy, setSortBy] = useState('name');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState({ name: '' });

  // Derive values for display
  const organizationId = organizationData.org_id || '';
  const organizationName = organizationData.organization_name || '';
  const accountNumber = organizationData.account_number || '';

  // Role bindings query
  const roleBindingsQuery = useRoleBindingsQuery(
    {
      resourceId: organizationId,
      resourceType: 'organization',
      subjectType: 'group',
      limit: perPage,
      orderBy: direction === 'desc' ? `-${sortBy === 'name' ? 'subject.group.name' : sortBy}` : sortBy === 'name' ? 'subject.group.name' : sortBy,
      parentRoleBindings: false,
    },
    { enabled: !!organizationId },
  );

  // Handlers for RoleAssignmentsTable
  const handleSetPage = (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPage: number) => {
    setPage(newPage);
  };

  const handlePerPageSelect = (event: React.MouseEvent | React.KeyboardEvent | MouseEvent, newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
  };

  const handleSort = (event: React.MouseEvent | React.KeyboardEvent, key: string, newDirection: 'asc' | 'desc') => {
    setSortBy(key);
    setDirection(newDirection);
  };

  const handleSetFilters = (newFilters: Partial<{ name: string; inheritedFrom?: string }>) => {
    setFilters({ ...filters, ...newFilters });
    setPage(1);
  };

  const clearAllFilters = () => {
    setFilters({ name: '' });
    setPage(1);
  };

  // Derive data from role bindings query
  const roleBindings = roleBindingsQuery.data?.data ? mapRoleBindingsToGroups(roleBindingsQuery.data.data, intl) : [];
  const roleBindingsTotalCount = roleBindingsQuery.data?.data?.length ?? 0;
  const roleBindingsIsLoading = roleBindingsQuery.isLoading;

  // Fetch user/organization data using semantic hook
  useEffect(() => {
    getUser()
      .then((user: UserIdentity) => {
        const { identity } = user;
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
  }, [getUser]);

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
          {!error && organizationName && (
            <FlexItem>
              <p>
                <strong>{intl.formatMessage(messages.organizationNameLabel)} </strong>
                {organizationName}
              </p>
            </FlexItem>
          )}
          {!error && accountNumber && (
            <FlexItem>
              <p>
                <strong>{intl.formatMessage(messages.accountNumberLabel)} </strong>
                {accountNumber}
              </p>
            </FlexItem>
          )}
          {!error && organizationId && (
            <FlexItem>
              <p>
                <strong>{intl.formatMessage(messages.organizationIdLabel)} </strong>
                {organizationId}
              </p>
            </FlexItem>
          )}
        </Flex>
      </PageHeader>
      {!error && (
        <PageSection>
          <RoleAssignmentsTable
            groups={roleBindings}
            totalCount={roleBindingsTotalCount}
            isLoading={roleBindingsIsLoading}
            page={page}
            perPage={perPage}
            onSetPage={handleSetPage}
            onPerPageSelect={handlePerPageSelect}
            sortBy={sortBy}
            direction={direction}
            onSort={handleSort}
            filters={filters}
            onSetFilters={handleSetFilters}
            clearAllFilters={clearAllFilters}
            ouiaId="organization-role-assignments-table"
          />
        </PageSection>
      )}
    </>
  );
};

export default OrganizationManagement;
