import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { connect, useSelector } from 'react-redux';
import { Link, useHistory, withRouter } from 'react-router-dom';
import debounce from 'lodash/debounce';
import { Button, Label, Stack, StackItem } from '@patternfly/react-core';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { TableToolbarViewOld } from '../../presentational-components/shared/table-toolbar-view-old';
import Section from '@redhat-cloud-services/frontend-components/Section';
import DateFormat from '@redhat-cloud-services/frontend-components/DateFormat';
import Skeleton from '@redhat-cloud-services/frontend-components/Skeleton';
import { fetchRoles, fetchRoleForUser } from '../../redux/actions/role-actions';
import { CheckIcon, CloseIcon } from '@patternfly/react-icons';
import { Text, TextContent, TextVariants } from '@patternfly/react-core';
import { fetchUsers } from '../../redux/actions/user-actions';
import { ListLoader } from '../../presentational-components/shared/loader-placeholders';
import { defaultSettings } from '../../helpers/shared/pagination';
import { Table, TableHeader, TableBody, TableVariant, compoundExpand } from '@patternfly/react-table';
import { Fragment } from 'react';
import EmptyWithAction from '../../presentational-components/shared/empty-state';
import RbacBreadcrumbs from '../../presentational-components/shared/breadcrumbs';
import { BAD_UUID, getDateFormat } from '../../helpers/shared/helpers';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import './user.scss';

let debouncedFetch;

const UserDescription = ({ user }) => {
  const intl = useIntl();

  return (
    <Fragment>
      {user?.orgAdmin ? (
        <Fragment>
          <span key="yes">
            {intl.formatMessage(messages.orgAdministrator) + ': '}
            <CheckIcon key="yes-icon" className="pf-u-mx-sm" />
            {intl.formatMessage(messages.yes)}
          </span>
        </Fragment>
      ) : (
        <Fragment>
          <span key="no">
            {intl.formatMessage(messages.orgAdministrator) + ': '}
            <CloseIcon key="no-icon" className="pf-u-mx-sm" />
            {intl.formatMessage(messages.no)}
          </span>
        </Fragment>
      )}
      {user?.email && (
        <TextContent className="rbac-page-header__description">
          {typeof user?.email === 'string' ? (
            <Text component={TextVariants.p}>
              {intl.formatMessage(messages.email)}: {user?.email}
            </Text>
          ) : (
            user?.email
          )}
        </TextContent>
      )}
      {user?.username && (
        <TextContent className="rbac-page-header__description">
          {typeof user?.username === 'string' ? (
            <Text component={TextVariants.p}>
              {intl.formatMessage(messages.username)}: {user?.username}
            </Text>
          ) : (
            user?.username
          )}
        </TextContent>
      )}
    </Fragment>
  );
};
UserDescription.propTypes = {
  user: PropTypes.object,
};

const User = ({
  match: {
    params: { username },
  },
  fetchRoles,
  fetchRoleForUser,
  fetchUsers,
  roles,
  isLoading,
  rolesWithAccess,
  user,
}) => {
  const intl = useIntl();
  const [filter, setFilter] = useState('');
  const [expanded, setExpanded] = useState({});

  const userExists = useSelector((state) => {
    const {
      roleReducer: { error },
    } = state;
    return error !== BAD_UUID;
  });

  useEffect(() => {
    fetchUsers({ ...defaultSettings, limit: 0, filters: { username }, inModal: true });
    insights.chrome.appObjectId(username);
    return () => insights.chrome.appObjectId(undefined);
  }, []);

  const history = useHistory();

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

  const createRows = (data) =>
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
                  title: (
                    <Table
                      ouiaId="groups-in-role-nested-table"
                      aria-label="Simple Table"
                      variant={TableVariant.compact}
                      cells={[intl.formatMessage(messages.name), intl.formatMessage(messages.description)]}
                      rows={groups_in.map((g) => ({ cells: [{ title: <Link to={`/groups/detail/${g.uuid}`}>{g.name}</Link> }, g.description] }))}
                    >
                      <TableHeader />
                      <TableBody />
                    </Table>
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
                      <ListLoader />
                    ),
                },
              ],
            },
          ],
          []
        )
      : [];

  useEffect(() => {
    fetchRoles({ limit: 20, offset: 0, addFields: ['groups_in'], username });
    debouncedFetch = debounce(
      (limit, offset, name, addFields, username) => fetchRoles({ limit, offset, displayName: name, addFields, username }),
      500
    );
  }, []);

  const onExpand = (_event, _rowIndex, colIndex, isOpen, rowData) => {
    if (!isOpen) {
      setExpanded({ ...expanded, [rowData.uuid]: colIndex });
      // Permissions
      if (colIndex === 2) {
        fetchRoleForUser(rowData.uuid);
      }
    } else {
      setExpanded({ ...expanded, [rowData.uuid]: -1 });
    }
  };

  const breadcrumbsList = () => [
    { title: intl.formatMessage(messages.users), to: '/users' },
    { title: userExists ? username : intl.formatMessage(messages.invalidUser), isActive: true },
  ];

  return (
    <Fragment>
      {userExists ? (
        <Stack>
          <StackItem>
            <TopToolbar paddingBottm={false} breadcrumbs={breadcrumbsList()}>
              <TopToolbarTitle
                title={username}
                renderTitleTag={() =>
                  user && !isLoading ? (
                    <Label color={user?.is_active && 'green'}>{intl.formatMessage(user?.is_active ? messages.active : messages.inactive)}</Label>
                  ) : (
                    <Skeleton size="xs" className="rbac__user-label-skeleton"></Skeleton>
                  )
                }
              >
                <UserDescription user={user} />
              </TopToolbarTitle>
            </TopToolbar>
          </StackItem>
          <StackItem>
            <Section type="content" id={'user-detail'}>
              <TableToolbarViewOld
                columns={columns}
                isCompact={false}
                isExpandable={true}
                onExpand={onExpand}
                createRows={createRows}
                data={roles.data}
                filterValue={filter}
                ouiaId="user-details-table"
                fetchData={({ limit, offset, name }) => {
                  debouncedFetch(limit, offset, name, ['groups_in'], username);
                }}
                setFilterValue={({ name }) => setFilter(name)}
                isLoading={isLoading}
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
            <RbacBreadcrumbs {...breadcrumbsList()} />
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

User.propTypes = {
  match: PropTypes.object,
  fetchRoles: PropTypes.func,
  fetchRoleForUser: PropTypes.func,
  fetchUsers: PropTypes.func,
  roles: PropTypes.object,
  isLoading: PropTypes.bool,
  rolesWithAccess: PropTypes.object,
  user: PropTypes.object,
};

const mapStateToProps = (
  {
    roleReducer: { roles, isLoading, rolesWithAccess },
    userReducer: {
      users: { data },
    },
  },
  {
    match: {
      params: { username },
    },
  }
) => ({
  roles,
  isLoading,
  rolesWithAccess,
  user: data && data.filter((user) => user.username === username)[0],
});
const mapDispatchToProps = (dispatch) => ({
  fetchRoles: (apiProps) => dispatch(fetchRoles(apiProps)),
  fetchRoleForUser: (uuid) => dispatch(fetchRoleForUser(uuid)),
  fetchUsers: (apiProps) => dispatch(fetchUsers(apiProps)),
});

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(User));
