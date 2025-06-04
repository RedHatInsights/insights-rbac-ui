import React, { useEffect, Fragment, useState, useContext, useRef, useCallback, Suspense } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import truncate from 'lodash/truncate';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useLocation, useNavigate, Outlet } from 'react-router-dom';
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';
import AppLink, { mergeToBasename } from '../../../presentational-components/shared/AppLink';
import { fetchUsers, updateUsersFilters, changeUsersStatus, updateUserIsOrgAdminStatus } from '../../../redux/actions/user-actions';
import { Button, Switch as PF4Switch, Label, Modal, ModalVariant, List, ListItem, Checkbox, Stack, StackItem } from '@patternfly/react-core';
import { Dropdown, DropdownItem, DropdownToggle } from '@patternfly/react-core/deprecated';
import { sortable, nowrap } from '@patternfly/react-table';
import { CheckIcon, CloseIcon } from '@patternfly/react-icons';
import { mappedProps, isExternalIdp } from '../../../helpers/shared/helpers';
import UsersRow from '../../../presentational-components/shared/UsersRow';
import {
  defaultSettings,
  defaultAdminSettings,
  syncDefaultPaginationWithUrl,
  applyPaginationToUrl,
  isPaginationPresentInUrl,
} from '../../../helpers/shared/pagination';
import { syncDefaultFiltersWithUrl, applyFiltersToUrl, areFiltersPresentInUrl } from '../../../helpers/shared/filters';
import messages from '../../../Messages';
import PermissionsContext from '../../../utilities/permissions-context';
import { useScreenSize, isSmallScreen } from '@redhat-cloud-services/frontend-components/useScreenSize';
import paths from '../../../utilities/pathnames';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

const IsAdminCellTextContent = ({ isOrgAdmin }) => {
  const intl = useIntl();

  return isOrgAdmin ? (
    <Fragment>
      <CheckIcon key="yes-icon" className="pf-v5-u-mr-sm" />
      <span key="yes">{intl.formatMessage(messages.yes)}</span>
    </Fragment>
  ) : (
    <Fragment>
      <CloseIcon key="no-icon" className="pf-v5-u-mr-sm" />
      <span key="no">{intl.formatMessage(messages.no)}</span>
    </Fragment>
  );
};

IsAdminCellTextContent.propTypes = {
  isOrgAdmin: PropTypes.bool,
};

const IsAdminCellDropdownContent = ({ isOrgAdmin, userId, isDisabled, toggleUserIsOrgAdminStatus }) => {
  const [isAdminDropdownOpen, setIsAdminDropdownOpen] = useState(false);
  const intl = useIntl();

  const onIsAdminDropdownToggle = (isOpen) => {
    setIsAdminDropdownOpen(isOpen);
  };

  const onIsAdminDropdownSelect = (_event) => {
    const isAdminStatusMap = { yes: true, no: false };

    toggleUserIsOrgAdminStatus(isAdminStatusMap[_event?.target?.id], null, { userId });
    setIsAdminDropdownOpen(false);
  };

  const dropdownItems = [
    <DropdownItem key={`is-admin-dropdown-item-${userId}`} componentID="yes">
      {intl.formatMessage(messages.yes)}
    </DropdownItem>,
    <DropdownItem key={`is-not-admin-dropdown-item-${userId}`} componentID="no">
      {intl.formatMessage(messages.no)}
    </DropdownItem>,
  ];
  return (
    <Dropdown
      id={`is-admin-dropdown-${userId}`}
      key={`is-admin-dropdown-${userId}`}
      onSelect={onIsAdminDropdownSelect}
      toggle={
        <DropdownToggle
          id={`is-admin-dropdown-toggle-${userId}`}
          key={`is-admin-dropdown-toggle-${userId}`}
          isDisabled={isDisabled}
          onToggle={onIsAdminDropdownToggle}
        >
          {isOrgAdmin ? intl.formatMessage(messages.yes) : intl.formatMessage(messages.no)}
        </DropdownToggle>
      }
      isOpen={isAdminDropdownOpen}
      dropdownItems={dropdownItems}
    />
  );
};

IsAdminCellDropdownContent.propTypes = {
  isOrgAdmin: PropTypes.bool,
  userId: PropTypes.string,
  isDisabled: PropTypes.bool,
  toggleUserIsOrgAdminStatus: PropTypes.func,
};

const UsersListItless = ({ selectedUsers, setSelectedUsers, userLinks, usesMetaInURL, displayNarrow, props }) => {
  const intl = useIntl();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const [selectedRows, setSelectedRows] = useState([]);
  const [isDeactivateConfirmationModalOpen, setIsDeactivateConfirmationModalOpen] = useState(false);
  const [isDeactivateConfirmationChecked, setIsDeactivateConfirmationChecked] = useState(false);
  const [isToolbarDropdownOpen, setIsToolbarDropdownOpen] = useState(false);
  const { orgAdmin } = useContext(PermissionsContext);
  const screenSize = useScreenSize();
  // use for text filter to focus
  const innerRef = useRef(null);
  const isAdmin = orgAdmin;
  const chrome = useChrome();
  const [currentUser, setCurrentUser] = useState({});
  const [userToken, setUserToken] = useState('');

  // for usesMetaInURL (Users page) store pagination settings in Redux, otherwise use results from meta
  let pagination = useSelector(({ userReducer: { users } }) => ({
    limit: (usesMetaInURL ? users.pagination.limit : users.meta.limit) ?? (orgAdmin ? defaultAdminSettings : defaultSettings).limit,
    offset: (usesMetaInURL ? users.pagination.offset : users.meta.offset) ?? (orgAdmin ? defaultAdminSettings : defaultSettings).offset,
    count: usesMetaInURL ? users.pagination.count : users.meta.count,
    redirected: usesMetaInURL && users.pagination.redirected,
  }));

  const { users, isLoading, stateFilters } = useSelector(
    ({
      userReducer: {
        users: { data, filters = {} },
        isUserDataLoading,
      },
    }) => ({
      users: data?.map?.((data) => ({ ...data, uuid: data.external_source_id })),
      isLoading: isUserDataLoading,
      stateFilters: location.search.length > 0 || Object.keys(filters).length > 0 ? filters : { status: ['Active'] },
    })
  );

  const fetchData = useCallback((apiProps) => dispatch(fetchUsers(apiProps)), [dispatch]);

  const confirmDeactivateUsers = () => {
    toggleUserActivationStatus(false, selectedRows);
    setIsDeactivateConfirmationModalOpen(false);
    setIsDeactivateConfirmationChecked(false);
  };

  const toggleUserIsOrgAdminStatus = (isOrgAdmin, _event, user = {}) => {
    const { limit, offset } = syncDefaultPaginationWithUrl(location, navigate, pagination);
    const newFilters = usesMetaInURL
      ? syncDefaultFiltersWithUrl(location, navigate, ['username', 'email', 'status'], filters)
      : { status: filters.status };
    const newUserObj = { id: user.userId, is_org_admin: isOrgAdmin };
    dispatch(updateUserIsOrgAdminStatus(newUserObj))
      .then(() => {
        setFilters(newFilters);
        if (setSelectedUsers) {
          setSelectedUsers([]);
        } else {
          setSelectedRows([]);
        }
        fetchData({ ...mappedProps({ limit, offset, filters: newFilters }), usesMetaInURL });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  const toolbarDropdowns = () => {
    const onToggle = (isOpen) => {
      setIsToolbarDropdownOpen(isOpen);
    };
    const onToolbarDropdownSelect = async (_event) => {
      const userActivationStatusMap = { activate: true, deactivate: false };

      if (_event?.target?.id === 'deactivate') {
        setIsDeactivateConfirmationModalOpen(true);
      } else {
        toggleUserActivationStatus(userActivationStatusMap[_event?.target?.id], selectedRows);
      }
      setIsToolbarDropdownOpen(false);
    };
    const dropdownItems = [
      <DropdownItem key="activate-users-dropdown-item" componentID="activate">
        {intl.formatMessage(messages.activateUsersButton)}
      </DropdownItem>,
      <DropdownItem key="deactivate-users-dropdown-item" componentID="deactivate">
        {intl.formatMessage(messages.deactivateUsersButton)}
      </DropdownItem>,
    ];
    return (
      <Dropdown
        onSelect={onToolbarDropdownSelect}
        toggle={
          <DropdownToggle id="toolbar-dropdown-toggle" isDisabled={selectedRows.length === 0} onToggle={onToggle}>
            {intl.formatMessage(messages.activateUsersButton)}
          </DropdownToggle>
        }
        isOpen={isToolbarDropdownOpen}
        dropdownItems={dropdownItems}
      />
    );
  };
  const toolbarButtons = () => [
    <AppLink to={paths['invite-users'].link} key="invite-users" className="rbac-m-hide-on-sm">
      <Button ouiaId="invite-users-button" variant="primary" aria-label="Invite users">
        {intl.formatMessage(messages.inviteUsers)}
      </Button>
    </AppLink>,
    ...(isSmallScreen(screenSize)
      ? [
          {
            label: intl.formatMessage(messages.inviteUsers),
            onClick: () => {
              navigate(mergeToBasename(paths['invite-users'].link));
            },
          },
        ]
      : []),
  ];
  const toggleUserActivationStatus = (isActivated, users = []) => {
    const { limit, offset } = syncDefaultPaginationWithUrl(location, navigate, pagination);
    const newFilters = usesMetaInURL
      ? syncDefaultFiltersWithUrl(location, navigate, ['username', 'email', 'status'], filters)
      : { status: filters.status };
    const newUserList = users.map((user) => {
      return { id: user?.uuid || user?.external_source_id, is_active: isActivated };
    });
    dispatch(changeUsersStatus(newUserList))
      .then(() => {
        setFilters(newFilters);
        if (setSelectedUsers) {
          setSelectedUsers([]);
        } else {
          setSelectedRows([]);
        }
        fetchData({ ...mappedProps({ limit, offset, filters: newFilters }), usesMetaInURL });
      })
      .catch((err) => {
        console.error(err);
      });
  };

  useEffect(() => {
    chrome.auth.getUser().then((user) => setCurrentUser(user));
    chrome.auth.getToken().then((token) => setUserToken(token));
  }, []);

  const isUserSelectable = (external_source_id) => external_source_id != currentUser?.identity?.internal?.account_id;

  const createITLessRows = (userLinks, data, checkedRows = []) => {
    const maxLength = 25;
    return data
      ? data.reduce(
          (
            acc,
            { external_source_id, username, is_active: is_active, email, first_name: firstName, last_name: lastName, is_org_admin: isOrgAdmin }
          ) => [
            ...acc,
            {
              uuid: external_source_id,
              cells: [
                {
                  title:
                    isAdmin && !displayNarrow ? (
                      <IsAdminCellDropdownContent
                        isOrgAdmin={isOrgAdmin}
                        userId={external_source_id}
                        isDisabled={!isAdmin || currentUser?.identity?.internal?.account_id == external_source_id}
                        toggleUserIsOrgAdminStatus={toggleUserIsOrgAdminStatus}
                      />
                    ) : (
                      <IsAdminCellTextContent isOrgAdmin={isOrgAdmin} />
                    ),
                  props: {
                    'data-is-active': isOrgAdmin,
                  },
                },
                {
                  title: userLinks ? (
                    <AppLink to={paths['user-detail'].link.replace(':username', username)}>{username.toString()}</AppLink>
                  ) : displayNarrow ? (
                    <span title={username}>{truncate(username, { length: maxLength })}</span>
                  ) : (
                    username
                  ),
                },
                {
                  title: displayNarrow ? <span title={email}>{truncate(email, { length: maxLength })}</span> : email,
                },
                firstName,
                lastName,
                {
                  title:
                    isAdmin && !displayNarrow ? (
                      <PF4Switch
                        key="status"
                        isDisabled={!isAdmin || currentUser?.identity?.internal?.account_id == external_source_id}
                        label={intl.formatMessage(messages.active)}
                        labelOff={intl.formatMessage(messages.inactive)}
                        isChecked={is_active}
                        onChange={(checked, _event) => {
                          toggleUserActivationStatus(checked, [
                            {
                              external_source_id,
                              is_active: is_active,
                            },
                          ]);
                        }}
                      />
                    ) : (
                      <Label key="status" color={is_active ? 'green' : 'grey'}>
                        {intl.formatMessage(is_active ? messages.active : messages.inactive)}
                      </Label>
                    ),
                  props: {
                    'data-is-active': is_active,
                  },
                },
              ],
              selected: Boolean(checkedRows?.find?.(({ uuid }) => uuid === external_source_id)),
              disableSelection: displayNarrow ? undefined : !isUserSelectable(external_source_id),
            },
          ],
          []
        )
      : [];
  };

  const updateStateFilters = useCallback((filters) => dispatch(updateUsersFilters(filters)), [dispatch]);
  const columns = [
    { title: intl.formatMessage(displayNarrow ? messages.orgAdmin : messages.orgAdministrator), key: 'org-admin', transforms: [nowrap] },
    { title: intl.formatMessage(messages.username), key: 'username', transforms: [sortable] },
    { title: intl.formatMessage(messages.email) },
    { title: intl.formatMessage(messages.firstName), transforms: [nowrap] },
    { title: intl.formatMessage(messages.lastName), transforms: [nowrap] },
    { title: intl.formatMessage(messages.status), transforms: [nowrap] },
  ];
  const [sortByState, setSortByState] = useState({ index: 1, direction: 'asc' });

  const [filters, setFilters] = useState(
    usesMetaInURL
      ? stateFilters
      : {
          username: '',
          email: '',
          status: [intl.formatMessage(messages.active)],
        }
  );

  useEffect(() => {
    usesMetaInURL && applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
  }, [pagination.offset, pagination.limit, pagination.count, pagination.redirected]);

  useEffect(() => {
    const { limit, offset } = usesMetaInURL ? syncDefaultPaginationWithUrl(location, navigate, pagination) : pagination;
    const newFilters = usesMetaInURL
      ? syncDefaultFiltersWithUrl(location, navigate, ['username', 'email', 'status'], filters)
      : { status: filters.status };
    setFilters(newFilters);
    fetchData({ ...mappedProps({ limit, offset, filters: newFilters }), usesMetaInURL });
  }, []);

  useEffect(() => {
    if (usesMetaInURL) {
      isPaginationPresentInUrl(location) || applyPaginationToUrl(location, navigate, pagination.limit, pagination.offset);
      Object.values(filters).some((filter) => filter?.length > 0) &&
        !areFiltersPresentInUrl(location, Object.keys(filters)) &&
        syncDefaultFiltersWithUrl(location, navigate, Object.keys(filters), filters);
    }
  });

  const setCheckedItems = (newSelection) => {
    if (setSelectedUsers) {
      setSelectedUsers((users) => {
        return newSelection(users)
          .filter((user) => (displayNarrow ? user : user?.uuid != currentUser?.identity?.internal?.account_id))
          .map(({ uuid, username }) => ({ uuid, label: username || uuid }));
      });
    } else {
      setSelectedRows((users) => {
        return newSelection(users)
          .filter((user) => (displayNarrow ? user : user?.uuid != currentUser?.identity?.internal?.account_id))
          .map(({ uuid, username }) => ({ uuid, label: username || uuid }));
      });
    }
  };

  const updateFilters = (payload) => {
    usesMetaInURL && updateStateFilters(payload);
    setFilters({ username: '', ...payload });
  };
  return (
    <>
      <Modal
        title={intl.formatMessage(messages.deactivateUsersConfirmationModalTitle)}
        titleIconVariant="warning"
        description={intl.formatMessage(messages.deactivateUsersConfirmationModalDescription)}
        variant={ModalVariant.medium}
        isOpen={isDeactivateConfirmationModalOpen}
        footer={
          <Stack hasGutter>
            <StackItem>
              <Checkbox
                label={intl.formatMessage(messages.deactivateUsersConfirmationModalCheckboxText)}
                isChecked={isDeactivateConfirmationChecked}
                onChange={(checked) => {
                  setIsDeactivateConfirmationChecked(checked);
                }}
                id="deactivateUsersConfirmationCheckbox"
                name="deactivate-users-confirmation-checkbox"
              />
            </StackItem>
            <StackItem>
              <Button
                key="confirm-deactivate-users"
                ouiaId="danger-confirm-deactivate-users-button"
                isDisabled={selectedRows.length === 0 || !isDeactivateConfirmationChecked}
                variant="danger"
                onClick={() => {
                  confirmDeactivateUsers();
                }}
              >
                {intl.formatMessage(messages.deactivateUsersConfirmationButton)}
              </Button>
              <Button
                id="deactivate-users-confirmation-cancel"
                ouiaId="secondary-cancel-button"
                key="cancel"
                variant="link"
                onClick={() => {
                  setIsDeactivateConfirmationModalOpen(false);
                }}
              >
                {intl.formatMessage(messages.cancel)}
              </Button>
            </StackItem>
          </Stack>
        }
        onClose={() => {
          setIsDeactivateConfirmationModalOpen(false);
        }}
      >
        <List isPlain isBordered>
          {selectedRows.map((user) => (
            <ListItem key={user.uuid}>{user.label}</ListItem>
          ))}
        </List>
      </Modal>
      <TableToolbarView
        toolbarChildren={isAdmin && !displayNarrow ? toolbarDropdowns : () => null}
        toolbarButtons={isAdmin && !displayNarrow && !isExternalIdp(userToken) ? toolbarButtons : () => []}
        isCompact
        isSelectable
        borders={false}
        columns={columns}
        rows={createITLessRows(userLinks, users, selectedUsers ? selectedUsers : selectedRows)}
        sortBy={sortByState}
        onSort={(e, index, direction) => {
          const orderBy = `${direction === 'desc' ? '-' : ''}${columns[index - 1].key}`;
          setSortByState({ index, direction });
          fetchData({ ...pagination, filters, usesMetaInURL, orderBy });
        }}
        data={users}
        ouiaId="users-table"
        fetchData={(config) => {
          const status = Object.prototype.hasOwnProperty.call(config, 'status') ? config.status : filters.status;
          const { username, email, count, limit, offset, orderBy } = config;

          fetchData({ ...mappedProps({ count, limit, offset, orderBy, filters: { username, email, status } }), usesMetaInURL }).then(() => {
            innerRef?.current?.focus();
          });
          usesMetaInURL && applyFiltersToUrl(location, navigate, { username, email, status });
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
        checkedRows={selectedUsers ? selectedUsers : selectedRows}
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
      <Suspense>
        <Outlet
          context={{
            [paths['invite-users'].path]: {
              fetchData: () => fetchData({ ...pagination, filters, usesMetaInURL }),
            },
          }}
        />
      </Suspense>
    </>
  );
};

UsersListItless.propTypes = {
  displayNarrow: PropTypes.bool,
  users: PropTypes.array,
  searchFilter: PropTypes.string,
  setSelectedUsers: PropTypes.func,
  selectedUsers: PropTypes.array,
  userLinks: PropTypes.bool,
  props: PropTypes.object,
  usesMetaInURL: PropTypes.bool,
};

UsersListItless.defaultProps = {
  displayNarrow: false,
  users: [],
  userLinks: false,
  usesMetaInURL: false,
};

export default UsersListItless;
