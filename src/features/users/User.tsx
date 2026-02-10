import React, { Fragment, Suspense, useContext, useState } from 'react';
import { Outlet, useNavigationType, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';

import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon';
import CloseIcon from '@patternfly/react-icons/dist/js/icons/close-icon';
import Section from '@redhat-cloud-services/frontend-components/Section';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import Skeleton, { SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import useAppNavigate from '../../hooks/useAppNavigate';
import { AppLink } from '../../components/navigation/AppLink';
import { useAppLink } from '../../hooks/useAppLink';
import { EmptyWithAction } from '../../components/ui-states/EmptyState';
import PermissionsContext from '../../utilities/permissionsContext';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import { TableView } from '../../components/table-view/TableView';
import { useTableState } from '../../components/table-view/hooks/useTableState';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../components/table-view/components/TableViewEmptyState';
import type { ColumnConfigMap, ExpansionRendererMap, FilterConfig } from '../../components/table-view/types';
import { PageLayout } from '../../components/layout/PageLayout';
import { getDateFormat } from '../../helpers/stringUtilities';
import { useAdminGroupQuery } from '../../data/queries/groups';
import { useRoleForPrincipalQuery, useRolesQuery } from '../../data/queries/roles';
import { useUsersQuery } from '../../data/queries/users';
import { useAddRolesToGroupMutation } from '../../data/queries/groups';
import { GroupsNestedTable } from './components/GroupsNestedTable';
import { PermissionsNestedTable } from './components/PermissionsNestedTable';
import type { Access, RoleOutDynamic } from '@redhat-cloud-services/rbac-client/types';

// RoleWithGroupsIn uses the RoleOutDynamic type from the API
type RoleWithGroupsIn = RoleOutDynamic;

interface AdminGroup {
  uuid: string;
  name: string;
  description?: string;
}

// Column definition for the user roles table
const columns = ['role', 'groups', 'permissions', 'lastModified'] as const;
type CompoundColumnId = 'groups' | 'permissions';

const User: React.FC = () => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const navigationType = useNavigationType();
  const { username } = useParams<{ username: string }>();
  const [selectedAddRoles, setSelectedAddRoles] = useState<string[]>([]);
  const [expandedRoleId, setExpandedRoleId] = useState<string | null>(null);
  const toAppLink = useAppLink();

  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;

  // Table state via useTableState
  const tableState = useTableState<typeof columns, RoleWithGroupsIn, never, CompoundColumnId>({
    columns,
    getRowId: (row: RoleWithGroupsIn) => row.uuid!,
    initialPerPage: 20,
    initialFilters: { name: '' },
  });

  // Fetch user data via React Query
  const { data: usersData, isLoading: isLoadingUsers } = useUsersQuery({ username, limit: 1 }, { enabled: !!username });
  const user = usersData?.users?.[0];
  const userExists = !!user || isLoadingUsers; // Assume exists while loading

  // Fetch roles for this user via React Query
  const { data: rolesData, isLoading: isLoadingRoles } = useRolesQuery(
    {
      limit: tableState.perPage,
      offset: (tableState.page - 1) * tableState.perPage,
      displayName: (tableState.filters.name as string) || undefined,
      username,
      addFields: ['groups_in'],
    },
    { enabled: !!username },
  );
  const roles = rolesData?.data ?? [];
  const totalCount = rolesData?.meta?.count ?? 0;

  // Fetch admin group via React Query
  const { data: adminGroup } = useAdminGroupQuery();

  // Fetch role with access for expanded permissions
  const { data: roleWithAccess, isLoading: isLoadingRoleAccess } = useRoleForPrincipalQuery(expandedRoleId ?? '', {
    enabled: !!expandedRoleId,
  });

  // Add roles to group mutation
  const addRolesToGroupMutation = useAddRolesToGroupMutation();

  // Column configuration
  const columnConfig: ColumnConfigMap<typeof columns> = {
    role: { label: intl.formatMessage(messages.roles) },
    groups: { label: intl.formatMessage(messages.groups), isCompound: true },
    permissions: { label: intl.formatMessage(messages.permissions), isCompound: true },
    lastModified: { label: intl.formatMessage(messages.lastModified) },
  };

  // Cell renderers for each column
  const cellRenderers = {
    role: (row: RoleWithGroupsIn) => row.display_name || row.name,
    groups: (row: RoleWithGroupsIn) => (isLoadingRoles ? <Skeleton size={SkeletonSize.xs} /> : (row.groups_in?.length ?? 0)),
    permissions: (row: RoleWithGroupsIn) => row.accessCount ?? 0,
    lastModified: (row: RoleWithGroupsIn) => <DateFormat type={getDateFormat(row.modified)} date={row.modified} />,
  };

  // Expansion renderers for compound expandable columns
  const expansionRenderers: ExpansionRendererMap<CompoundColumnId, RoleWithGroupsIn> = {
    groups: (row) => (
      <GroupsNestedTable
        groups={row.groups_in || []}
        username={username!}
        adminGroup={adminGroup as AdminGroup | undefined}
        isLoading={isLoadingRoles}
      />
    ),
    permissions: (row) => {
      const isThisRoleExpanded = expandedRoleId === row.uuid;
      const access = isThisRoleExpanded ? roleWithAccess?.access : undefined;
      const isLoading = isThisRoleExpanded ? isLoadingRoleAccess : true;
      return <PermissionsNestedTable access={access as Access[] | undefined} accessCount={row.accessCount} isLoading={isLoading} />;
    },
  };

  // Custom expansion handler — wraps useTableState's onToggleExpand with business logic
  // to trigger a separate permissions fetch when the permissions column is expanded
  const handleToggleExpand = (rowId: string, column: CompoundColumnId) => {
    const isCurrentlyExpanded = tableState.expandedCell?.rowId === rowId && tableState.expandedCell?.column === column;

    tableState.onToggleExpand(rowId, column);

    if (isCurrentlyExpanded) {
      setExpandedRoleId(null);
    } else {
      // Set the role ID to fetch permissions when expanding the permissions column
      if (column === 'permissions') {
        setExpandedRoleId(rowId);
      } else {
        setExpandedRoleId(null);
      }
    }
  };

  const breadcrumbsList = [
    { title: intl.formatMessage(messages.users), to: toAppLink(pathnames.users.link()) as string },
    { title: userExists ? username : intl.formatMessage(messages.invalidUser), isActive: true },
  ];

  const filterConfig: FilterConfig[] = [
    {
      type: 'search',
      id: 'name',
      placeholder: intl.formatMessage(messages.roleName).toLowerCase(),
    },
  ];

  const toolbarActions = isAdmin ? (
    <AppLink to={pathnames['add-user-to-group'].link(username!)} key="add-user-to-group">
      <Button ouiaId="add-user-to-group-button" variant="primary" aria-label="Add user to a group">
        {intl.formatMessage(messages.addUserToGroup)}
      </Button>
    </AppLink>
  ) : undefined;

  return (
    <Fragment>
      {userExists ? (
        <PageLayout
          breadcrumbs={breadcrumbsList}
          title={{
            title: username,
            label: isLoadingUsers ? (
              <Skeleton size="xs" className="rbac-c-user__label-skeleton"></Skeleton>
            ) : (
              <Label color={user?.is_active ? 'green' : undefined}>{intl.formatMessage(user?.is_active ? messages.active : messages.inactive)}</Label>
            ),
            description:
              !isLoadingUsers && user ? (
                <Fragment>
                  <span>
                    {`${intl.formatMessage(messages.orgAdministrator)}: `}
                    {user?.is_org_admin ? (
                      <CheckIcon key="yes-icon" className="pf-v6-u-mx-sm" />
                    ) : (
                      <CloseIcon key="no-icon" className="pf-v6-u-mx-sm" />
                    )}
                    {intl.formatMessage(user?.is_org_admin ? messages.yes : messages.no)}
                  </span>
                  {user?.email && <span>{` | ${intl.formatMessage(messages.email)}: ${user.email}`}</span>}
                  {user?.username && <span>{` | ${intl.formatMessage(messages.username)}: ${user.username}`}</span>}
                </Fragment>
              ) : undefined,
          }}
        >
          <Section type="content" className="rbac-c-user-roles">
            <TableView<typeof columns, RoleWithGroupsIn, never, CompoundColumnId>
              columns={columns}
              columnConfig={columnConfig}
              data={isLoadingRoles ? undefined : roles}
              totalCount={totalCount}
              getRowId={(row) => row.uuid!}
              cellRenderers={cellRenderers}
              expansionRenderers={expansionRenderers}
              // Expansion — custom handler wrapping useTableState
              expandedCell={tableState.expandedCell}
              onToggleExpand={handleToggleExpand}
              // Pagination — from useTableState
              page={tableState.page}
              perPage={tableState.perPage}
              onPageChange={tableState.onPageChange}
              onPerPageChange={tableState.onPerPageChange}
              // Filters — from useTableState
              filterConfig={filterConfig}
              filters={tableState.filters}
              onFiltersChange={tableState.onFiltersChange}
              clearAllFilters={tableState.clearAllFilters}
              toolbarActions={toolbarActions}
              ariaLabel={intl.formatMessage(messages.roles)}
              ouiaId="user-details-table"
              emptyStateNoData={
                <DefaultEmptyStateNoData
                  title={intl.formatMessage(messages.noRolesFound)}
                  body={intl.formatMessage(messages.noRolesFoundDescription)}
                />
              }
              emptyStateNoResults={
                <DefaultEmptyStateNoResults
                  title={intl.formatMessage(messages.noResultsFound)}
                  body={intl.formatMessage(messages.noRolesFoundDescription)}
                />
              }
            />
            <Suspense>
              <Outlet
                context={{
                  // add user to group:
                  username,
                  // add group roles:
                  selectedRoles: selectedAddRoles,
                  setSelectedRoles: setSelectedAddRoles,
                  closeUrl: pathnames['user-detail'].link(username!),
                  addRolesToGroup: async (groupId: string, rolesArg: string[]) => {
                    await addRolesToGroupMutation.mutateAsync({ groupId, roleUuids: rolesArg });
                  },
                }}
              />
            </Suspense>
          </Section>
        </PageLayout>
      ) : (
        <PageLayout breadcrumbs={breadcrumbsList}>
          <EmptyWithAction
            title={intl.formatMessage(messages.userNotFound)}
            description={[intl.formatMessage(messages.userNotFoundDescription, { username })]}
            actions={[
              <Button
                key="back-button"
                className="pf-v6-u-mt-xl"
                ouiaId="back-button"
                variant="primary"
                aria-label="Back to previous page"
                onClick={() => navigate(navigationType !== 'POP' ? (-1 as unknown as string) : pathnames.users.link())}
              >
                {intl.formatMessage(messages.backToPreviousPage)}
              </Button>,
            ]}
          />
        </PageLayout>
      )}
    </Fragment>
  );
};

// Feature component (used by Routing.tsx) - both named and default exports
export { User };
export default User;
