import React, { useEffect, useState, useContext, Fragment } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Link, useHistory, Route, Switch, useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Button, Label, Stack, StackItem, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { Table, TableHeader, TableBody, TableVariant, compoundExpand } from '@patternfly/react-table';
import { CheckIcon, CloseIcon } from '@patternfly/react-icons';
import debounce from 'lodash/debounce';
import Section from '@redhat-cloud-services/frontend-components/Section';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import Skeleton from '@redhat-cloud-services/frontend-components/Skeleton';
import AddGroupRoles from '../group/role/add-group-roles';
import AddUserToGroup from './add-user-to-group/add-user-to-group';
import Breadcrumbs from '../../presentational-components/shared/breadcrumbs';
import EmptyWithAction from '../../presentational-components/shared/empty-state';
import PermissionsContext from '../../utilities/permissions-context';
import messages from '../../Messages';
import pathnames from '../../utilities/pathnames';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';
import { TableToolbarView } from '../../presentational-components/shared/table-toolbar-view';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { fetchRoles, fetchRoleForUser } from '../../redux/actions/role-actions';
import { fetchUsers } from '../../redux/actions/user-actions';
import { BAD_UUID, getDateFormat } from '../../helpers/shared/helpers';
import { addRolesToGroup } from '../../redux/actions/group-actions';
import { defaultSettings } from '../../helpers/shared/pagination';
import './user.scss';

let debouncedFetch;

const selector = ({
  roleReducer: { error, roles, isLoading: isLoadingRoles, rolesWithAccess },
  userReducer: {
    users: { data },
    isUserDataLoading: isLoadingUsers,
  },
}) => ({
  roles,
  isLoadingRoles,
  rolesWithAccess,
  users: data,
  isLoadingUsers,
  userExists: error !== BAD_UUID,
});

const User = () => {
  const intl = useIntl();
  const history = useHistory();
  const dispatch = useDispatch();
  const [filter, setFilter] = useState('');
  const [user, setUser] = useState();
  const [expanded, setExpanded] = useState({});
  const [selectedAddRoles, setSelectedAddRoles] = useState([]);

  const { roles, isLoadingRoles, rolesWithAccess, users, isLoadingUsers, userExists } = useSelector(selector);
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const { username } = useParams();
  const isAdmin = orgAdmin || userAccessAdministrator;

  const fetchRolesData = (apiProps) => dispatch(fetchRoles(apiProps));

  useEffect(() => {
    insights.chrome.appObjectId(username);
    dispatch(fetchUsers({ ...defaultSettings, limit: 0, filters: { username }, inModal: true }));
    fetchRolesData({ limit: 20, offset: 0, addFields: ['groups_in'], username });
    debouncedFetch = debounce(
      (limit, offset, name, addFields, username) => fetchRolesData({ limit, offset, displayName: name, addFields, username }),
      500
    );
    return () => insights.chrome.appObjectId(undefined);
  }, []);

  useEffect(() => {
    setUser(users?.find((user) => user.username === username));
  }, [users]);

  const columns = [
    intl.formatMessage(messages.roles),
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

  const createRows = (data, username) =>
    data
      ? data.reduce(
          (acc, { uuid, display_name, groups_in = [], modified, accessCount }, i) => [
            ...acc,
            {
              uuid,
              cells: [
                { title: display_name, props: { component: 'th', isOpen: false } },
                { title: `${groups_in.length}`, props: { isOpen: expanded[uuid] === 1 } },
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
                        rows={groups_in.map((g) => ({
                          cells: [
                            { title: <Link to={`/groups/detail/${g.uuid}`}>{g.name}</Link> },
                            g.description,
                            {
                              title: (
                                <Link
                                  to={pathnames['user-add-group-roles'].path.replace(':username', username).replace(':uuid', g.uuid)}
                                  state={{ name: g.name }}
                                >
                                  {intl.formatMessage(messages.addRoleToThisGroup)}
                                </Link>
                              ),
                              props: { className: 'pf-u-text-align-right' },
                            },
                          ],
                        }))}
                      >
                        <TableHeader />
                        <TableBody />
                      </Table>
                    ) : (
                      <Text className="pf-u-mx-lg pf-u-my-sm">{intl.formatMessage(messages.noGroups)}</Text>
                    ),
                },
              ],
            },
            {
              uuid: `${uuid}-groups`,
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
                          cells={[
                            intl.formatMessage(messages.application),
                            intl.formatMessage(messages.resourceType),
                            intl.formatMessage(messages.operation),
                          ]}
                          rows={rolesWithAccess[uuid].access.map((access) => ({ cells: access.permission.split(':') }))}
                        >
                          <TableHeader />
                          <TableBody />
                        </Table>
                      ) : (
                        <Text className="pf-u-mx-lg pf-u-my-sm">{intl.formatMessage(messages.noPermissions)}</Text>
                      )
                    ) : (
                      <ListLoader items={3} isCompact />
                    ),
                },
              ],
            },
          ],
          []
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
    { title: intl.formatMessage(messages.users), to: '/users' },
    { title: userExists ? username : intl.formatMessage(messages.invalidUser), isActive: true },
  ];

  const routes = () => (
    <Switch>
      <Route path={pathnames['add-user-to-group'].path.replace(':username', username)}>
        <AddUserToGroup username={username} />
      </Route>
      <Route
        path={pathnames['user-add-group-roles'].path.replace(':username', username)}
        render={(args) => (
          <AddGroupRoles
            selectedRoles={selectedAddRoles}
            setSelectedRoles={setSelectedAddRoles}
            closeUrl={`/users/detail/${username}`}
            addRolesToGroup={(groupId, roles) => dispatch(addRolesToGroup(groupId, roles))}
            {...args}
          />
        )}
      />
    </Switch>
  );

  const toolbarButtons = () => [
    ...(isAdmin
      ? [
          <Link to={pathnames['add-user-to-group'].path.replace(':username', username)} key="add-user-to-group" className="rbac-m-hide-on-sm">
            <Button ouiaId="add-user-to-group-button" variant="primary" aria-label="Add user to a group">
              {intl.formatMessage(messages.addUserToGroup)}
            </Button>
          </Link>,
          {
            label: intl.formatMessage(messages.addUserToGroup),
            onClick: () => {
              history.push(pathnames['add-user-to-group'].path);
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
            <TopToolbar breadcrumbs={breadcrumbsList}>
              <TopToolbarTitle
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
                      {user?.is_org_admin ? <CheckIcon key="yes-icon" className="pf-u-mx-sm" /> : <CloseIcon key="no-icon" className="pf-u-mx-sm" />}
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
              </TopToolbarTitle>
            </TopToolbar>
          </StackItem>
          <StackItem>
            <Section type="content" className="rbac-c-user-roles">
              <TableToolbarView
                columns={columns}
                isExpandable
                onExpand={onExpand}
                rows={createRows(roles.data, username)}
                routes={routes}
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
            </Section>
          </StackItem>
        </Stack>
      ) : (
        <Fragment>
          <section className="pf-c-page__main-breadcrumb pf-u-pb-md">
            <Breadcrumbs {...breadcrumbsList} />
          </section>
          <EmptyWithAction
            title={intl.formatMessage(messages.userNotFound)}
            description={[intl.formatMessage(messages.userNotFoundDescription, { username })]}
            actions={[
              <Button
                key="back-button"
                className="pf-u-mt-xl"
                ouiaId="back-button"
                variant="primary"
                aria-label="Back to previous page"
                onClick={() => history.goBack()}
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
