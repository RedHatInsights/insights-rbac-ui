import React, { useCallback, useEffect, useState } from 'react';
import { PageHeader } from '@patternfly/react-component-groups';
import { PageSection } from '@patternfly/react-core/dist/dynamic/components/Page';
import { Flex } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import { FlexItem } from '@patternfly/react-core/dist/dynamic/layouts/Flex';
import messages from '../../Messages';
import { useIntl } from 'react-intl';
import { RoleAssignmentsTable } from '../workspaces/workspace-detail/components/RoleAssignmentsTable';
import { workspacesApi } from '../../data/api/workspaces';
import { Group } from '../../data/queries/groups';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

export const OrganizationManagement = () => {
  const intl = useIntl();
  const chrome = useChrome();

  // User/organization data from chrome.auth.getUser()
  const [organizationName, setOrganizationName] = useState('Red Hat Organization'); // Will need separate API for actual name
  const [accountNumber, setAccountNumber] = useState('');
  const [organizationId, setOrganizationId] = useState('');

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
    setRoleBindingsIsLoading(true);
    try {
      // For organization-wide access, we fetch role bindings for the organization
      // This would need to be adjusted based on the actual API for organization-level bindings
      const result = await workspacesApi.roleBindingsListBySubject({
        limit: perPage,
        subjectType: 'group',
        resourceType: 'workspace',
        resourceId: 'organization', // Placeholder for organization-level access
      });

      // Transform role bindings data to match the expected Group structure
      const transformedData: Group[] =
        result.data?.data?.map(
          (binding: any): Group => ({
            uuid: binding.subject?.id || '',
            name: binding.subject?.group?.name || binding.subject?.user?.username || 'Unknown',
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
      setRoleBindings([]);
      setRoleBindingsTotalCount(0);
    } finally {
      setRoleBindingsIsLoading(false);
    }
  }, [perPage, sortBy, direction, filters]);

  // Fetch user/organization data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = await chrome.auth.getUser();

        // Set organization ID and account number from user identity
        const orgId = user?.identity?.org_id || '';
        const accountNum = user?.identity?.account_number || user?.identity?.internal?.account_id || '';

        setOrganizationId(orgId);
        setAccountNumber(accountNum);

        // Organization name is not available in user identity - would need separate API call
        // For now, keeping the placeholder until proper org name API is implemented
      } catch (error) {
        console.error('Error fetching user data:', error);
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
          <FlexItem>
            <p>
              <strong>Organization name: </strong>
              {organizationName}
            </p>
          </FlexItem>
          <FlexItem>
            <p>
              <strong>Account number: </strong>
              {accountNumber}
            </p>
          </FlexItem>
          <FlexItem>
            <p>
              <strong>Organization ID: </strong>
              {organizationId}
            </p>
          </FlexItem>
        </Flex>
      </PageHeader>
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
    </>
  );
};

export default OrganizationManagement;
