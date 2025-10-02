import React, { Fragment, Suspense, useContext, useEffect, useState } from 'react';
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
import { TableVariant } from '@patternfly/react-table';
import { compoundExpand } from '@patternfly/react-table';
import { Table, TableBody, TableHeader } from '@patternfly/react-table/deprecated';
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon';
import CloseIcon from '@patternfly/react-icons/dist/js/icons/close-icon';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import SkeletonTable from '@patternfly/react-component-groups/dist/dynamic/SkeletonTable';
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
import { TableToolbarView } from '../../components/tables/TableToolbarView';
import { PageLayout, PageTitle } from '../../components/layout/PageLayout';
import { fetchRoleForUser, fetchRoles } from '../../redux/roles/actions';
import { fetchUsers } from '../../redux/users/actions';
import { BAD_UUID } from '../../helpers/dataUtilities';
import { getDateFormat } from '../../helpers/stringUtilities';
import { addRolesToGroup, fetchAdminGroup } from '../../redux/groups/actions';
import { defaultSettings } from '../../helpers/pagination';
import './user.scss';

let debouncedFetch;

const User = () => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const navigationType = useNavigationType();
  const dispatch = useDispatch();
  const { username } = useParams();
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState({});
  const [loadingRolesTemp, setLoadingRolesTemp] = useState(false);
  const [selectedAddRoles, setSelectedAddRoles] = useState([]);
  const chrome = useChrome();
  const toAppLink = useAppLink();

  const selector = ({
    roleReducer: { error, roles, isLoading: isLoadingRoles, rolesWithAccess },
    userReducer: {
      users: { data },
      isUserDataLoading: isLoadingUsers,
    },
    groupReducer: { adminGroup },
  }) => ({
    adminGroup,
    roles,
    isLoadingRoles,
    rolesWithAccess,
    user: data && data.filter((user) => user.username === username)[0],
    isLoadingUsers,
    userExists: error !== BAD_UUID,
  });

  const { roles, isLoadingRoles, rolesWithAccess, user, isLoadingUsers, userExists, adminGroup } = useSelector(selector);
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const isAdmin = orgAdmin || userAccessAdministrator;

  const fetchRolesData = (apiProps) => dispatch(fetchRoles(apiProps));

  useEffect(() => {
    chrome.appObjectId(username);
    dispatch(fetchAdminGroup({ chrome }));
    dispatch(fetchUsers({ ...defaultSettings, limit: 0, filters: { username } }));
    fetchRolesData({ limit: 20, offset: 0, username });
    setLoadingRolesTemp(true);
    fetchRolesData({ limit: 20, offset: 0, addFields: ['groups_in'], username }).then(() => setLoadingRolesTemp(false));
    debouncedFetch = debounce((limit, offset, name, addFields, username) =>
      fetchRolesData({ limit, offset, displayName: name, addFields, username }),
    );
    return () => chrome.appObjectId(undefined);
  }, []);

  const columns = [
    {
      title: intl.formatMessage(messages.roles),
    },
    {
      title: intl.formatMessage(messages.groups),
      cellTransforms: [compoundExpand],
    },
    {
      title: intl.formatMessage(messages.permissions),
      cellTransforms: [compoundExpand],
    },
    {
      title: intl.formatMessage(messages.lastModified),
    },
  ];

  const nestedPermissionsCells = [
    intl.formatMessage(messages.application),
    intl.formatMessage(messages.resourceType),
    intl.formatMessage(messages.operation),
  ];

  const createRows = (data, username, adminGroup) =>
    data
      ? data.reduce(
          (acc, { uuid, display_name, groups_in = [], modified, accessCount }, i) => [
            ...acc,
            {
              uuid,
              cells: [
                { title: display_name, props: { component: 'th', isOpen: false } },
                { title: loadingRolesTemp ? <Skeleton size={SkeletonSize.xs} /> : groups_in.length, props: { isOpen: expanded[uuid] === 1 } },
                { title: accessCount, props: { isOpen: expanded[uuid] === 2 } },
                { title: <DateFormat type={getDateFormat(modified)} date={modified} /> },
              ],
            },
            {
              uuid: `${uuid}-groups`,
              parent: 3 * i,
              compoundParent: 1,
              cells: [
                {
                  props: { colSpan: 4, className: 'pf-m-no-padding' },
                  title:
                    groups_in?.length > 0 ? (
                      <Table
                        ouiaId="groups-in-role-nested-table"
                        aria-label="Simple Table"
                        variant={TableVariant.compact}
                        cells={[intl.formatMessage(messages.name), intl.formatMessage(messages.description), ' ']}
                        rows={groups_in.map((group) => {
                          if (!group) return null;

                          return {
                            cells: [
                              { title: <AppLink to={pathnames['group-detail'].link.replace(':groupId', group.uuid)}>{group.name}</AppLink> },
                              group.description,
                              {
                                title:
                                  !adminGroup || !group.uuid || adminGroup.uuid === group.uuid ? null : (
                                    <AppLink
                                      to={pathnames['user-add-group-roles'].link.replace(':username', username).replace(':groupId', group.uuid)}
                                      state={{ name: group.name }}
                                    >
                                      {intl.formatMessage(messages.addRoleToThisGroup)}
                                    </AppLink>
                                  ),
                                props: { className: 'pf-v5-u-text-align-right' },
                              },
                            ],
                          };
                        })}
                      >
                        <TableHeader />
                        <TableBody />
                      </Table>
                    ) : (
                      <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">
                        {loadingRolesTemp ? intl.formatMessage(messages.loading) : intl.formatMessage(messages.noGroups)}
                      </Text>
                    ),
                },
              ],
            },
            {
              uuid: `${uuid}-permissions`,
              parent: 3 * i,
              compoundParent: 2,
              cells: [
                {
                  props: { colSpan: 4, className: 'pf-m-no-padding' },
                  title:
                    rolesWithAccess && rolesWithAccess[uuid] ? (
                      rolesWithAccess[uuid].access?.length > 0 ? (
                        <Table
                          aria-label="Simple Table"
                          ouiaId="permissions-in-role-nested-table"
                          variant={TableVariant.compact}
                          cells={nestedPermissionsCells}
                          rows={rolesWithAccess[uuid].access.map((access) => ({ cells: access.permission.split(':') }))}
                        >
                          <TableHeader />
                          <TableBody />
                        </Table>
                      ) : (
                        <Text className="pf-v5-u-mx-lg pf-v5-u-my-sm">{intl.formatMessage(messages.noPermissions)}</Text>
                      )
                    ) : (
                      <SkeletonTable rows={accessCount} columns={nestedPermissionsCells} variant={TableVariant.compact} />
                    ),
                },
              ],
            },
          ],
          [],
        )
      : [];

  const onExpand = (_event, _rowIndex, colIndex, isOpen, rowData) => {
    if (!isOpen) {
      setExpanded({ ...expanded, [rowData.uuid]: colIndex });
      // Permissions
      if (colIndex === 2) {
        dispatch(fetchRoleForUser(rowData.uuid));
      }
    } else {
      setExpanded({ ...expanded, [rowData.uuid]: -1 });
    }
  };

  const breadcrumbsList = [
    { title: intl.formatMessage(messages.users), to: toAppLink(pathnames.users.link) },
    { title: userExists ? username : intl.formatMessage(messages.invalidUser), isActive: true },
  ];

  const toolbarButtons = () => [
    ...(isAdmin
      ? [
          <AppLink to={pathnames['add-user-to-group'].link.replace(':username', username)} key="add-user-to-group" className="rbac-m-hide-on-sm">
            <Button ouiaId="add-user-to-group-button" variant="primary" aria-label="Add user to a group">
              {intl.formatMessage(messages.addUserToGroup)}
            </Button>
          </AppLink>,
          {
            label: intl.formatMessage(messages.addUserToGroup),
            onClick: () => {
              navigate(pathnames['add-user-to-group'].link.replace(':username', username));
            },
          },
        ]
      : []),
  ];

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
                    <Label color={user?.is_active && 'green'}>{intl.formatMessage(user?.is_active ? messages.active : messages.inactive)}</Label>
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
              <TableToolbarView
                columns={columns}
                isExpandable
                onExpand={onExpand}
                rows={createRows(roles.data, username, adminGroup)}
                data={roles.data}
                filterValue={filter}
                ouiaId="user-details-table"
                fetchData={({ limit, offset, name }) => {
                  debouncedFetch(limit, offset, name, ['groups_in'], username);
                }}
                setFilterValue={({ name }) => setFilter(name)}
                isLoading={isLoadingRoles}
                toolbarButtons={toolbarButtons}
                pagination={roles.meta}
                filterPlaceholder={intl.formatMessage(messages.roleName).toLowerCase()}
                titlePlural={intl.formatMessage(messages.roles).toLowerCase()}
                titleSingular={intl.formatMessage(messages.role).toLowerCase()}
                tableId="user"
              />
              <Suspense>
                <Outlet
                  context={{
                    // add user to group:
                    username,
                    // add group roles:
                    selectedRoles: selectedAddRoles,
                    setSelectedRoles: setSelectedAddRoles,
                    closeUrl: pathnames['user-detail'].link.replace(':username', username),
                    addRolesToGroup: (groupId, roles) => dispatch(addRolesToGroup(groupId, roles)),
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
                onClick={() => navigate(navigationType !== 'POP' ? -1 : pathnames.users.link)}
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

export default User;
