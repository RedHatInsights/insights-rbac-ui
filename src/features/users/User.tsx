import React, { Fragment, Suspense, useCallback, useContext, useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useNavigationType, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon';
import CloseIcon from '@patternfly/react-icons/dist/js/icons/close-icon';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { debounce } from '../../utilities/debounce';
import Section from '@redhat-cloud-services/frontend-components/Section';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import Skeleton, { SkeletonSize } from '@redhat-cloud-services/frontend-components/Skeleton';
import useAppNavigate from '../../hooks/useAppNavigate';
import { AppLink } from '../../components/navigation/AppLink';
import { useAppLink } from '../../hooks/useAppLink';
import { RbacBreadcrumbs } from '../../components/navigation/Breadcrumbs';
import { EmptyWithAction } from '../../components/ui-states/EmptyState';
import PermissionsContext from '../../utilities/permissionsContext';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import { TableView } from '../../components/table-view/TableView';
import { DefaultEmptyStateNoData, DefaultEmptyStateNoResults } from '../../components/table-view/components/TableViewEmptyState';
import type { ColumnConfigMap, ExpandedCell, ExpansionRendererMap, FilterConfig } from '../../components/table-view/types';
import { PageLayout, PageTitle } from '../../components/layout/PageLayout';
import { fetchRoleForUser, fetchRoles } from '../../redux/roles/actions';
import { fetchUsers } from '../../redux/users/actions';
import { BAD_UUID } from '../../helpers/dataUtilities';
import { getDateFormat } from '../../helpers/stringUtilities';
import { addRolesToGroup, fetchAdminGroup } from '../../redux/groups/actions';
import { defaultSettings } from '../../helpers/pagination';
import { GroupsNestedTable } from './components/GroupsNestedTable';
import { PermissionsNestedTable } from './components/PermissionsNestedTable';
import type { RBACStore } from '../../redux/store.d';
import type { Access, RoleOutDynamic } from '@redhat-cloud-services/rbac-client/types';
import './user.scss';

interface GroupIn {
  uuid: string;
  name: string;
  description?: string;
}

interface RoleWithGroupsIn extends Omit<RoleOutDynamic, 'accessCount'> {
  groups_in?: GroupIn[];
  accessCount?: number;
}

interface AdminGroup {
  uuid: string;
  name: string;
  description?: string;
}

interface UserData {
  username: string;
  email?: string;
  is_active?: boolean;
  is_org_admin?: boolean;
}

interface RolesWithAccess {
  [key: string]: {
    access?: Access[];
  };
}

type DebouncedFetchFn = (limit: number, offset: number, name: string, addFields: string[], username: string) => void;

let debouncedFetch: DebouncedFetchFn;

// Column definition for the user roles table
const columns = ['role', 'groups', 'permissions', 'lastModified'] as const;
type CompoundColumnId = 'groups' | 'permissions';

const User: React.FC = () => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const navigationType = useNavigationType();
  const dispatch = useDispatch();
  const { username } = useParams<{ username: string }>();
  const [filter, setFilter] = useState('');
  const [expandedCell, setExpandedCell] = useState<ExpandedCell<CompoundColumnId> | null>(null);
  const [loadingRolesTemp, setLoadingRolesTemp] = useState(false);
  const [selectedAddRoles, setSelectedAddRoles] = useState<string[]>([]);
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(20);
  const chrome = useChrome();
  const toAppLink = useAppLink();

  const selector = ({
    roleReducer: { error, roles, isLoading: isLoadingRoles, rolesWithAccess },
    userReducer: {
      users: { data },
      isUserDataLoading: isLoadingUsers,
    },
    groupReducer: { adminGroup },
  }: RBACStore) => ({
    adminGroup: adminGroup as AdminGroup | undefined,
    roles: roles as { data?: RoleWithGroupsIn[]; meta?: { count?: number; limit?: number; offset?: number } },
    isLoadingRoles: isLoadingRoles as boolean,
    rolesWithAccess: rolesWithAccess as RolesWithAccess | undefined,
    user: data && (data as UserData[]).filter((user) => user.username === username)[0],
    isLoadingUsers: isLoadingUsers as boolean,
    userExists: error !== BAD_UUID,
  });

  const { roles, isLoadingRoles, rolesWithAccess, user, isLoadingUsers, userExists, adminGroup } = useSelector(selector);
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;

  const fetchRolesData = (apiProps: Record<string, unknown>) => dispatch(fetchRoles(apiProps) as unknown as { type: string });

  useEffect(() => {
    chrome.appObjectId(username as string);
    dispatch(fetchAdminGroup({ chrome }) as unknown as { type: string });
    dispatch(fetchUsers({ ...defaultSettings, limit: 0, filters: { username } }) as unknown as { type: string });
    fetchRolesData({ limit: 20, offset: 0, username });
    setLoadingRolesTemp(true);
    (fetchRolesData({ limit: 20, offset: 0, addFields: ['groups_in'], username }) as unknown as Promise<void>).then(() => setLoadingRolesTemp(false));
    debouncedFetch = debounce((limit: number, offset: number, name: string, addFields: string[], usernameArg: string) =>
      fetchRolesData({ limit, offset, displayName: name, addFields, username: usernameArg }),
    );
    return () => chrome.appObjectId(undefined as unknown as string);
  }, []);

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
    groups: (row: RoleWithGroupsIn) => (loadingRolesTemp ? <Skeleton size={SkeletonSize.xs} /> : (row.groups_in?.length ?? 0)),
    permissions: (row: RoleWithGroupsIn) => row.accessCount ?? 0,
    lastModified: (row: RoleWithGroupsIn) => <DateFormat type={getDateFormat(row.modified)} date={row.modified} />,
  };

  // Expansion renderers for compound expandable columns
  const expansionRenderers: ExpansionRendererMap<CompoundColumnId, RoleWithGroupsIn> = {
    groups: (row) => <GroupsNestedTable groups={row.groups_in || []} username={username!} adminGroup={adminGroup} isLoading={loadingRolesTemp} />,
    permissions: (row) => (
      <PermissionsNestedTable access={rolesWithAccess?.[row.uuid!]?.access} accessCount={row.accessCount} isLoading={!rolesWithAccess?.[row.uuid!]} />
    ),
  };

  const handleToggleExpand = (rowId: string, column: CompoundColumnId) => {
    const isCurrentlyExpanded = expandedCell?.rowId === rowId && expandedCell?.column === column;

    if (isCurrentlyExpanded) {
      setExpandedCell(null);
    } else {
      setExpandedCell({ rowId, column });

      // Fetch permissions data when expanding the permissions column
      if (column === 'permissions' && !rolesWithAccess?.[rowId]) {
        dispatch(fetchRoleForUser(rowId) as unknown as { type: string });
      }
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    const offset = (newPage - 1) * perPage;
    debouncedFetch(perPage, offset, filter, ['groups_in'], username!);
  };

  const handlePerPageChange = (newPerPage: number) => {
    setPerPage(newPerPage);
    setPage(1);
    debouncedFetch(newPerPage, 0, filter, ['groups_in'], username!);
  };

  const breadcrumbsList = [
    { title: intl.formatMessage(messages.users), to: toAppLink(pathnames.users.link) as string },
    { title: userExists ? username : intl.formatMessage(messages.invalidUser), isActive: true },
  ];

  // Memoize fetchData to prevent debounce cancellation on re-renders
  const handleFilterChange = useCallback(
    (filters: Record<string, string | string[]>) => {
      const nameFilter = typeof filters.name === 'string' ? filters.name : '';
      setFilter(nameFilter);
      setPage(1);
      debouncedFetch(perPage, 0, nameFilter, ['groups_in'], username!);
    },
    [username, perPage],
  );

  const filterConfig: FilterConfig[] = [
    {
      type: 'search',
      id: 'name',
      placeholder: intl.formatMessage(messages.roleName).toLowerCase(),
    },
  ];

  const toolbarActions = isAdmin ? (
    <AppLink to={pathnames['add-user-to-group'].link.replace(':username', username!)} key="add-user-to-group">
      <Button ouiaId="add-user-to-group-button" variant="primary" aria-label="Add user to a group">
        {intl.formatMessage(messages.addUserToGroup)}
      </Button>
    </AppLink>
  ) : undefined;

  return (
    <Fragment>
      {userExists ? (
        <Stack>
          <StackItem>
            <PageLayout breadcrumbs={breadcrumbsList}>
              <PageTitle
                title={username}
                renderTitleTag={() =>
                  isLoadingUsers ? (
                    <Skeleton size="xs" className="rbac-c-user__label-skeleton"></Skeleton>
                  ) : (
                    <Label color={user?.is_active ? 'green' : undefined}>
                      {intl.formatMessage(user?.is_active ? messages.active : messages.inactive)}
                    </Label>
                  )
                }
              >
                {!isLoadingUsers && user ? (
                  <Fragment>
                    <TextContent>
                      {`${intl.formatMessage(messages.orgAdministrator)}: `}
                      {user?.is_org_admin ? (
                        <CheckIcon key="yes-icon" className="pf-v5-u-mx-sm" />
                      ) : (
                        <CloseIcon key="no-icon" className="pf-v5-u-mx-sm" />
                      )}
                      {intl.formatMessage(user?.is_org_admin ? messages.yes : messages.no)}
                    </TextContent>
                    {user?.email && <Text component={TextVariants.p}>{`${intl.formatMessage(messages.email)}: ${user.email}`}</Text>}
                    {user?.username && (
                      <TextContent>
                        <Text component={TextVariants.p}>{`${intl.formatMessage(messages.username)}: ${user.username}`}</Text>
                      </TextContent>
                    )}
                  </Fragment>
                ) : null}
              </PageTitle>
            </PageLayout>
          </StackItem>
          <StackItem>
            <Section type="content" className="rbac-c-user-roles">
              <TableView<typeof columns, RoleWithGroupsIn, never, CompoundColumnId>
                columns={columns}
                columnConfig={columnConfig}
                data={isLoadingRoles ? undefined : roles.data}
                totalCount={roles.meta?.count ?? 0}
                getRowId={(row) => row.uuid!}
                cellRenderers={cellRenderers}
                expansionRenderers={expansionRenderers}
                expandedCell={expandedCell}
                onToggleExpand={handleToggleExpand}
                page={page}
                perPage={perPage}
                onPageChange={handlePageChange}
                onPerPageChange={handlePerPageChange}
                filterConfig={filterConfig}
                filters={{ name: filter }}
                onFiltersChange={handleFilterChange}
                hasActiveFilters={filter.length > 0}
                clearAllFilters={() => handleFilterChange({ name: '' })}
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
                    closeUrl: pathnames['user-detail'].link.replace(':username', username!),
                    addRolesToGroup: (groupId: string, rolesArg: string[]) =>
                      dispatch(addRolesToGroup(groupId, rolesArg) as unknown as { type: string }),
                  }}
                />
              </Suspense>
            </Section>
          </StackItem>
        </Stack>
      ) : (
        <Fragment>
          <section className="pf-v5-c-page__main-breadcrumb pf-v5-u-pb-md">
            <RbacBreadcrumbs breadcrumbs={breadcrumbsList} />
          </section>
          <EmptyWithAction
            title={intl.formatMessage(messages.userNotFound)}
            description={[intl.formatMessage(messages.userNotFoundDescription, { username })]}
            actions={[
              <Button
                key="back-button"
                className="pf-v5-u-mt-xl"
                ouiaId="back-button"
                variant="primary"
                aria-label="Back to previous page"
                onClick={() => navigate(navigationType !== 'POP' ? (-1 as unknown as string) : pathnames.users.link)}
              >
                {intl.formatMessage(messages.backToPreviousPage)}
              </Button>,
            ]}
          />
        </Fragment>
      )}
    </Fragment>
  );
};

// Feature component (used by Routing.tsx) - both named and default exports
export { User };
export default User;
