import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@patternfly/react-component-groups';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import messages from '../../Messages';
import { useIntl } from 'react-intl';
import { RoleAssignmentsTable } from '../workspaces/workspace-detail/components/RoleAssignmentsTable';
import { workspacesApi } from '../../data/api/workspaces';
import { Group } from '../../data/queries/groups';

export const OrganizationManagement = () => {
  const intl = useIntl();
  const chrome = useChrome();

  // User/organization data from chrome.auth.getUser()
  const [organizationName] = useState(intl.formatMessage(messages.redHatOrganizationPlaceholder)); // Will need separate API for actual name
  const [accountNumber, setAccountNumber] = useState('');
  const [organizationId, setOrganizationId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // State for RoleAssignmentsTable
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const [sortBy, setSortBy] = useState('name');
  const [direction, setDirection] = useState<'asc' | 'desc'>('asc');
  const [filters, setFilters] = useState({ name: '' });

  // Data state for organization role assignments
  const [roleBindings, setRoleBindings] = useState<Group[]>([]);
  const [roleBindingsTotalCount, setRoleBindingsTotalCount] = useState(0);
  const [roleBindingsIsLoading, setRoleBindingsIsLoading] = useState(false);

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

  // Fetch organization-level role bindings
  const fetchRoleBindingsData = useCallback(async () => {
    if (!organizationId) {
      // Can't fetch data without organization ID
      setRoleBindingsIsLoading(false);
      return;
    }

    setRoleBindingsIsLoading(true);
    try {
      // For organization-wide access, we fetch role bindings for the organization
      // Using the organization ID as resource_id and 'organization' as resource_type
      const result = await workspacesApi.roleBindingsListBySubject({
        limit: perPage,
        subjectType: 'group', // Filter for group subjects
        resourceType: 'organization', // Organization-level access
        resourceId: organizationId, // Use actual organization ID
        orderBy: sortBy === 'name' ? 'subject.group.name' : sortBy,
        // Include parent role bindings if needed
        parentRoleBindings: false,
      });

      // Transform role bindings data to match the expected Group structure
      // The API returns RoleBindingBySubject objects grouped by subject
      const transformedData: Group[] =
        result.data?.data?.map(
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (binding: any): Group => ({
            uuid: binding.subject?.id || '',
            name: binding.subject?.group?.name || binding.subject?.user?.username || intl.formatMessage(messages.unknownSubjectName),
            description: binding.subject?.group?.description || '',
            principalCount: binding.subject?.group?.user_count || 0,
            roleCount: binding.roles?.length || 0,
            created: binding.last_modified || '',
            modified: binding.last_modified || '',
            platform_default: false,
            system: false,
            admin_default: false,
          }),
        ) || [];

      setRoleBindings(transformedData);
      setRoleBindingsTotalCount(result.data?.data?.length ?? 0);
    } catch (error) {
      console.error('Error fetching organization role bindings:', error);
      // If organization resource type is not supported, we'll show empty state
      setRoleBindings([]);
      setRoleBindingsTotalCount(0);
    } finally {
      setRoleBindingsIsLoading(false);
    }
  }, [organizationId, perPage, sortBy, direction, filters]);

  // Fetch user/organization data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await chrome.auth.getUser();

        if (!user) {
          console.warn('OrganizationManagement: No user data received from chrome.auth.getUser()');
          setError('User data not available');
          return;
        }

        const { identity } = user;
        if (!identity) {
          console.warn('OrganizationManagement: User identity not available');
          setError('User identity not available');
          return;
        }

        // Set organization ID and account number from user identity
        const orgId = identity.org_id || '';
        const accountNum = identity.account_number || identity.internal?.account_id || '';

        setOrganizationId(orgId);
        setAccountNumber(accountNum);
        setError(null);

        // Organization name is not available in user identity - would need separate API call
        // For now, keeping the placeholder until proper org name API is implemented
      } catch (error) {
        console.error('OrganizationManagement: Failed to fetch user data:', error);
        setError('Failed to load organization data');
      }
    };

    if (chrome) {
      fetchUserData();
    }
  }, [chrome]);

  // Fetch data on component mount and when dependencies change
  useEffect(() => {
    fetchRoleBindingsData();
  }, [fetchRoleBindingsData]);

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
