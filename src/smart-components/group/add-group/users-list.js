import React, { useEffect, Fragment, useState, useContext, useRef, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { Link, useHistory, Route, Switch } from 'react-router-dom';
import { mappedProps } from '../../../helpers/shared/helpers';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import { fetchUsers, updateUsersFilters, updateUsers } from '../../../redux/actions/user-actions';
import { Button, MenuToggle, Switch as PF4Switch } from '@patternfly/react-core';
import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/next';
import { sortable, nowrap } from '@patternfly/react-table';
import UsersRow from '../../../presentational-components/shared/UsersRow';
import {
  defaultSettings,
  defaultAdminSettings,
  syncDefaultPaginationWithUrl,
  applyPaginationToUrl,
  isPaginationPresentInUrl,
} from '../../../helpers/shared/pagination';
import { syncDefaultFiltersWithUrl, applyFiltersToUrl, areFiltersPresentInUrl } from '../../../helpers/shared/filters';
import { CheckIcon, CloseIcon } from '@patternfly/react-icons';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import PermissionsContext from '../../../utilities/permissions-context';
import InviteUsersModal from '../../user/invite-users/invite-users-modal';
import { useScreenSize, isSmallScreen } from '@redhat-cloud-services/frontend-components/useScreenSize';
import paths from '../../../utilities/pathnames';

const UsersList = ({ selectedUsers, setSelectedUsers, userLinks, inModal, props }) => {
  const intl = useIntl();
  const history = useHistory();
  const dispatch = useDispatch();
  const [selectedRows, setSelectedRows] = useState(selectedUsers);
  const [isToolbarDropdownOpen, setIsToolbarDropdownOpen] = useState(false);
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);
  const screenSize = useScreenSize();
  // use for text filter to focus
  const innerRef = useRef(null);
  const defaultPagination = useSelector(({ userReducer: { users } }) => ({
    limit: inModal ? users.meta.limit : users.pagination.limit || (orgAdmin ? defaultAdminSettings : defaultSettings).limit,
    offset: inModal ? users.meta.offset : users.pagination.offset || (orgAdmin ? defaultAdminSettings : defaultSettings).offset,
    count: inModal ? users.meta.count : users.pagination.count,
    redirected: !inModal && users.pagination.redirected,
  }));

  const routes = () => (
    <Switch>
      <Route path={paths['invite-users'].path}>
        <InviteUsersModal />
      </Route>
    </Switch>
  );

  const toolbarDropdowns = () =>
    orgAdmin || userAccessAdministrator ? (
      <Dropdown
        isOpen={isToolbarDropdownOpen}
        onSelect={onToolbarDropdownSelect}
        onOpenChange={(isToolbarDropdownOpen) => setIsToolbarDropdownOpen(isToolbarDropdownOpen)}
        toggle={(toggleRef) => (
          <MenuToggle
            ref={toggleRef}
            onClick={onToolbarDropdownToggleClick}
            isExpanded={isToolbarDropdownOpen}
            id="toolbar-dropdown-toggle"
            isDisabled={selectedRows.length === 0}
          >
            {intl.formatMessage(messages.activateUsersButton)}
          </MenuToggle>
        )}
      >
        <DropdownList>
          <DropdownItem itemId="activate" key="activate-users-dropdown-item">
            {intl.formatMessage(messages.activateUsersButton)}
          </DropdownItem>
          <DropdownItem itemId="deactivate" key="deactivate-users-dropdown-item">
            {intl.formatMessage(messages.deactivateUsersButton)}
          </DropdownItem>
        </DropdownList>
      </Dropdown>
    ) : null;

  const toolbarButtons = () =>
    orgAdmin || userAccessAdministrator
      ? [
          <Link to={paths['invite-users'].path} key="invite-users" className="rbac-m-hide-on-sm">
            <Button ouiaId="invite-users-button" variant="primary" aria-label="Invite users">
              {intl.formatMessage(messages.inviteUsers)}
            </Button>
          </Link>,
          ...(isSmallScreen(screenSize)
            ? [
                {
                  label: intl.formatMessage(messages.inviteUsers),
                  onClick: () => {
                    history.push(paths['invite-users'].path);
                  },
                },
              ]
            : []),
        ]
      : [];

  const toggleUserActivationStatus = (isActivated, _event, users = []) => {
    const pagination = inModal ? defaultSettings : syncDefaultPaginationWithUrl(history, defaultPagination);
    const newFilters = inModal ? { status: filters.status } : syncDefaultFiltersWithUrl(history, ['username', 'email', 'status'], filters);
    const newUserList = users.map((user) => {
      return { id: user?.uuid || user?.external_source_id, is_active: isActivated };
    });
    dispatch(updateUsers(newUserList))
      .then((res) => {
        setFilters(newFilters);
        if (props.setSelectedUsers) {
          setSelectedUsers([]);
        } else {
          setSelectedRows([]);
        }
        fetchData({ ...mappedProps({ ...pagination, filters: newFilters }), inModal });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const onToolbarDropdownToggleClick = () => {
    setIsToolbarDropdownOpen(!isToolbarDropdownOpen);
  };
  const onToolbarDropdownSelect = async (_event, itemId) => {
    console.log('selected', itemId);
    const userActivationStatusMap = { activate: true, deactivate: false };

    toggleUserActivationStatus(userActivationStatusMap[itemId], null, selectedRows);
    setIsToolbarDropdownOpen(false);
  };

  const createRows = (userLinks, data, checkedRows = []) =>
    data
      ? data.reduce(
          (
            acc,
            {external_source_id, username, is_active: is_active, email, first_name: firstName, last_name: lastName, is_org_admin: isOrgAdmin }
          ) => [
            ...acc,
            {
              uuid: external_source_id,
              cells: [
                isOrgAdmin ? (
                  <Fragment>
                    <CheckIcon key="yes-icon" className="pf-u-mr-sm" />
                    <span key="yes">{intl.formatMessage(messages.yes)}</span>
                  </Fragment>
                ) : (
                  <Fragment>
                    <CloseIcon key="no-icon" className="pf-u-mr-sm" />
                    <span key="no">{intl.formatMessage(messages.no)}</span>
                  </Fragment>
                ),
                { title: userLinks ? <Link to={`/users/detail/${username}`}>{username.toString()}</Link> : username.toString() },
                email,
                firstName,
                lastName,
                {
                  title: (
                    <PF4Switch
                      key="status"
                      isDisabled={!(orgAdmin || userAccessAdministrator)}
                      label={intl.formatMessage(messages.active)}
                      labelOff={intl.formatMessage(messages.inactive)}
                      isChecked={is_active}
                      onChange={(checked, _event) => {
                        toggleUserActivationStatus(checked, _event, [
                          {
                            external_source_id,
                            is_active: is_active,
                          },
                        ]);
                      }}
                    />
                  ),
                  props: {
                    'data-is-active': is_active,
                  },
                },
              ],
              selected: Boolean(checkedRows?.find?.(({ uuid }) => uuid === external_source_id)),
            },
          ],
          []
        )
      : [];

  const users = useSelector(({ userReducer: { users } }) => users?.data?.map?.((data) => ({ ...data, uuid: data.external_source_id })));

  const pagination = useSelector(
    ({
      userReducer: {
        users: { meta },
      },
    }) => meta
  );
  const isLoading = useSelector(({ userReducer: { isUserDataLoading } }) => isUserDataLoading);

  const stateFilters = useSelector(
    ({
      userReducer: {
        users: { filters },
      },
    }) => (history.location.search.length > 0 || Object.keys(filters).length > 0 ? filters : { status: ['Active'] })
  );

  const fetchData = useCallback(
    (apiProps) => {
      return dispatch(fetchUsers(apiProps));
    },
    [dispatch]
  );

  const fetchUsersFilters = useCallback(
    (filters) => {
      return dispatch(updateUsersFilters(filters));
    },
    [dispatch]
  );

  const rows = createRows(userLinks, users, selectedRows);
  const columns = [
    { title: intl.formatMessage(messages.orgAdministrator), key: 'org-admin', transforms: [nowrap] },
    { title: intl.formatMessage(messages.username), key: 'username', transforms: [sortable] },
    { title: intl.formatMessage(messages.email) },
    { title: intl.formatMessage(messages.firstName), transforms: [nowrap] },
    { title: intl.formatMessage(messages.lastName), transforms: [nowrap] },
    { title: intl.formatMessage(messages.status), transforms: [nowrap] },
  ];
  const [sortByState, setSortByState] = useState({ index: 1, direction: 'asc' });

  const [filters, setFilters] = useState(
    inModal
      ? {
          username: '',
          email: '',
          status: [intl.formatMessage(messages.active)],
        }
      : stateFilters
  );

  useEffect(() => {
    inModal || (defaultPagination.redirected && applyPaginationToUrl(history, defaultPagination.limit, defaultPagination.offset));
  }, [defaultPagination.redirected]);

  useEffect(() => {
    const pagination = inModal ? defaultSettings : syncDefaultPaginationWithUrl(history, defaultPagination);
    const newFilters = inModal ? { status: filters.status } : syncDefaultFiltersWithUrl(history, ['username', 'email', 'status'], filters);
    setFilters(newFilters);
    fetchData({ ...mappedProps({ ...pagination, filters: newFilters }), inModal });
  }, []);

  useEffect(() => {
    if (!inModal) {
      isPaginationPresentInUrl(history) || applyPaginationToUrl(history, pagination.limit, pagination.offset);
      Object.values(filters).some((filter) => filter?.length > 0) &&
        !areFiltersPresentInUrl(history, Object.keys(filters)) &&
        syncDefaultFiltersWithUrl(history, Object.keys(filters), filters);
    }
  });

  const setCheckedItems = (newSelection) => {
    if (props.setSelectedUsers) {
      setSelectedUsers((users) => {
        return newSelection(users).map(({ uuid, username }) => ({ uuid, label: username || uuid }));
      });
    } else {
      setSelectedRows((users) => {
        return newSelection(users).map(({ uuid, username }) => ({ uuid, label: username || uuid }));
      });
    }
  };

  const updateFilters = (payload) => {
    inModal || fetchUsersFilters(payload);
    setFilters({ username: '', ...payload });
  };

  return (
    <TableToolbarView
      toolbarChildren={toolbarDropdowns}
      toolbarButtons={toolbarButtons}
      isCompact
      isSelectable
      borders={false}
      columns={columns}
      rows={rows}
      routes={routes}
      sortBy={sortByState}
      onSort={(e, index, direction) => {
        const orderBy = `${direction === 'desc' ? '-' : ''}${columns[index].key}`;
        setSortByState({ index, direction });
        fetchData({ ...pagination, filters, inModal, orderBy });
      }}
      data={users}
      ouiaId="users-table"
      fetchData={(config) => {
        const status = Object.prototype.hasOwnProperty.call(config, 'status') ? config.status : filters.status;
        const { username, email, count, limit, offset, orderBy } = config;

        fetchData({ ...mappedProps({ count, limit, offset, orderBy, filters: { username, email, status } }), inModal }).then(() => {
          innerRef?.current?.focus();
        });
        inModal || applyPaginationToUrl(history, limit, offset);
        inModal || applyFiltersToUrl(history, { username, email, status });
      }}
      emptyFilters={{ username: '', email: '', status: '' }}
      setFilterValue={({ username, email, status }) => {
        updateFilters({
          username: typeof username === 'undefined' ? filters.username : username,
          email: typeof email === 'undefined' ? filters.email : email,
          status: typeof status === 'undefined' || status === filters.status ? filters.status : status,
        });
      }}
      isLoading={isLoading}
      pagination={pagination}
      checkedRows={selectedRows}
      setCheckedItems={setCheckedItems}
      rowWrapper={UsersRow}
      titlePlural={intl.formatMessage(messages.users).toLowerCase()}
      titleSingular={intl.formatMessage(messages.user)}
      filters={[
        {
          key: 'username',
          value: filters.username,
          placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.username).toLowerCase() }),
          innerRef,
        },
        {
          key: 'email',
          value: filters.email,
          placeholder: intl.formatMessage(messages.filterByKey, { key: intl.formatMessage(messages.email).toLowerCase() }),
          innerRef,
        },
        {
          key: 'status',
          value: filters.status,
          label: intl.formatMessage(messages.status),
          type: 'checkbox',
          items: [
            { label: intl.formatMessage(messages.active), value: 'Active' },
            { label: intl.formatMessage(messages.inactive), value: 'Inactive' },
          ],
        },
      ]}
      tableId="users-list"
      {...props}
    />
  );
};

UsersList.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired,
  }),
  users: PropTypes.array,
  searchFilter: PropTypes.string,
  setSelectedUsers: PropTypes.func.isRequired,
  selectedUsers: PropTypes.array,
  userLinks: PropTypes.bool,
  props: PropTypes.object,
  inModal: PropTypes.bool,
};

UsersList.defaultProps = {
  users: [],
  selectedUsers: [],
  setSelectedUsers: () => undefined,
  userLinks: false,
  inModal: false,
};

export default UsersList;
