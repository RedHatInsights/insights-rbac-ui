import React, { Fragment, Suspense, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useSearchParams } from 'react-router-dom';
import { SkeletonTableBody, SkeletonTableHead, WarningModal } from '@patternfly/react-component-groups';
import {
  DataViewState,
  DataViewTextFilter,
  DataViewTh,
  EventTypes,
  useDataViewEventsContext,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSelection,
  useDataViewSort,
} from '@patternfly/react-data-view';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { ResponsiveAction } from '@patternfly/react-component-groups/dist/dynamic/ResponsiveAction';
import { ResponsiveActions } from '@patternfly/react-component-groups/dist/dynamic/ResponsiveActions';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import {
  ButtonVariant,
  Dropdown,
  DropdownItem,
  DropdownList,
  EmptyState,
  EmptyStateBody,
  EmptyStateHeader,
  EmptyStateIcon,
  List,
  ListItem,
  MenuToggle,
  MenuToggleElement,
  Pagination,
  Split,
  SplitItem,
  Switch,
} from '@patternfly/react-core';
import { ActionsColumn, ThProps } from '@patternfly/react-table';
import { SearchIcon } from '@patternfly/react-icons';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import { changeUsersStatus, fetchUsers } from '../../../../redux/actions/user-actions';
import { mappedProps } from '../../../../helpers/shared/helpers';
import { RBACStore } from '../../../../redux/store';
import { User } from '../../../../redux/reducers/user-reducer';
import { PER_PAGE_OPTIONS } from '../../../../helpers/shared/pagination';
import messages from '../../../../Messages';
import paths from '../../../../utilities/pathnames';
import PermissionsContext from '../../../../utilities/permissions-context';
import OrgAdminDropdown from '../../../user/OrgAdminDropdown';
import { useFlag } from '@unleash/proxy-client-react';

interface UsersFilters {
  username: string;
  email: string;
}

const EmptyTable: React.FC<{ titleText: string }> = ({ titleText }) => (
  <EmptyState>
    <EmptyStateHeader titleText={titleText} headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
    <EmptyStateBody>
      <FormattedMessage {...messages['usersEmptyStateSubtitle']} values={{ br: <br /> }} />
    </EmptyStateBody>
  </EmptyState>
);

interface UsersTableProps {
  onAddUserClick: (selected: User[]) => void;
  focusedUser?: User;
  defaultPerPage?: number;
  ouiaId?: string;
}

const UsersTable: React.FC<UsersTableProps> = ({ onAddUserClick, focusedUser, defaultPerPage = 20, ouiaId = 'iam-users-table' }) => {
  const authModel = useFlag('platform.rbac.common-auth-model');
  const { getBundle, getApp } = useChrome();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [activeState, setActiveState] = useState<DataViewState | undefined>(DataViewState.loading);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const dispatch = useDispatch();
  const intl = useIntl();
  const { trigger } = useDataViewEventsContext();
  const [searchParams, setSearchParams] = useSearchParams();
  const appNavigate = useAppNavigate(`/${getBundle()}/${getApp()}`);

  const { users, totalCount, isLoading } = useSelector((state: RBACStore) => ({
    users: state.userReducer.users.data || [],
    totalCount: state.userReducer.users.meta.count,
    isLoading: state.userReducer.isUserDataLoading,
  }));

  // activate/deactivate
  const [accountId, setAccountId] = useState<number | undefined>();
  const { orgAdmin } = useContext(PermissionsContext);
  const { auth, isProd } = useChrome();
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const getToken = async () => {
      setToken((await auth.getToken()) as string);
      setAccountId((await auth.getUser())?.identity.org_id as unknown as number);
    };
    getToken();
  }, [auth]);

  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [checkedStates, setCheckedStates] = useState<Record<string, boolean>>({});
  const [isOpen, setIsOpen] = useState(false);
  const onToggleClick = () => {
    setIsOpen(!isOpen);
  };
  const onStatusSelect = () => {
    setIsStatusModalOpen(!isStatusModalOpen);
    setIsOpen(false);
  };

  useEffect(() => {
    if (users?.length) {
      const initialCheckedStates = users.reduce(
        (acc, user) => {
          acc[user.external_source_id] = user.is_active;
          return acc;
        },
        {} as Record<string, boolean>,
      );
      setCheckedStates(initialCheckedStates);
    }
  }, [users]);

  const handleToggle = (_ev: unknown, isActive: boolean, updatedUser: User) => {
    try {
      dispatch(
        changeUsersStatus(
          [
            {
              ...updatedUser,
              id: updatedUser.external_source_id,
              is_active: isActive,
            },
          ],
          { isProd: isProd(), token, accountId },
        ),
      );

      setCheckedStates((prevState) => ({
        ...prevState,
        [updatedUser.external_source_id]: isActive,
      }));
    } catch (error) {
      console.error('Failed to update status:', error);
    }

    setToken(token);
  };

  const handleBulkDeactivate = () => {
    selected.forEach((user) => {
      handleToggle(null, false, user);
    });

    setIsStatusModalOpen(false);
  };

  const handleModalToggle = (_event: KeyboardEvent | React.MouseEvent, user: User) => {
    setCurrentUser(user);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  // Define columns based on authModel flag
  const columns = useMemo(() => {
    if (authModel) {
      return [
        { label: intl.formatMessage(messages.orgAdmin), key: 'is_org_admin', index: 0, sort: false },
        { label: intl.formatMessage(messages.username), key: 'username', index: 1, sort: true },
        { label: intl.formatMessage(messages.email), key: 'email', index: 2, sort: false },
        { label: intl.formatMessage(messages.firstName), key: 'first_name', index: 3, sort: false },
        { label: intl.formatMessage(messages.lastName), key: 'last_name', index: 4, sort: false },
        { label: intl.formatMessage(messages.status), key: 'is_active', index: 5, sort: false },
      ];
    } else {
      return [
        { label: intl.formatMessage(messages.username), key: 'username', index: 0, sort: true },
        { label: intl.formatMessage(messages.email), key: 'email', index: 1, sort: false },
        { label: intl.formatMessage(messages.firstName), key: 'first_name', index: 2, sort: false },
        { label: intl.formatMessage(messages.lastName), key: 'last_name', index: 3, sort: false },
        { label: intl.formatMessage(messages.status), key: 'is_active', index: 4, sort: false },
        { label: intl.formatMessage(messages.orgAdmin), key: 'is_org_admin', index: 5, sort: false },
      ];
    }
  }, [authModel, intl]);

  const { sortBy, direction, onSort } = useDataViewSort({
    searchParams,
    setSearchParams,
    initialSort: {
      sortBy: 'username',
      direction: 'asc',
    },
  });

  const sortByIndex = useMemo(() => columns.findIndex((column) => column.key === sortBy), [sortBy, columns]);

  const getSortParams = (columnIndex: number): ThProps['sort'] => ({
    sortBy: {
      index: sortByIndex,
      direction,
      defaultDirection: 'asc',
    },
    onSort: (_event, index, direction) => onSort(_event, columns[index].key, direction),
    columnIndex,
  });

  const sortableColumns: DataViewTh[] = columns.map((column, index) => ({
    cell: column.label,
    props: column.sort ? { sort: getSortParams(index) } : {},
  }));

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<UsersFilters>({
    initialFilters: { username: '', email: '' },
    searchParams,
    setSearchParams,
  });

  const pagination = useDataViewPagination({
    perPage: defaultPerPage,
    searchParams,
    setSearchParams,
  });

  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });
  const { selected, onSelect, isSelected } = selection;

  const loadingHeader = <SkeletonTableHead columns={columns.map((col) => col.label)} />;
  const loadingBody = <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />;

  const fetchData = useCallback(
    (apiProps: { count: number; limit: number; offset: number; orderBy: string; filters?: UsersFilters }) => {
      const { count, limit, offset, orderBy, filters } = apiProps;
      const orderDirection = direction === 'desc' ? '-' : '';
      dispatch(
        fetchUsers({
          ...mappedProps({ count, limit, offset, orderBy: `${orderDirection}${orderBy}`, filters }),
          usesMetaInURL: true,
        }),
      );
    },
    [dispatch, direction],
  );

  useEffect(() => {
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: sortBy || 'username',
      count: totalCount || 0,
      filters,
    });
  }, [fetchData, page, perPage, sortBy, direction, filters, totalCount]);

  useEffect(() => {
    if (isLoading) {
      setActiveState(DataViewState.loading);
    } else {
      setActiveState(totalCount === 0 ? DataViewState.empty : undefined);
    }
  }, [totalCount, isLoading]);

  const handleBulkSelect = (value: BulkSelectValue) => {
    if (value === BulkSelectValue.none) {
      onSelect(false);
    } else if (value === BulkSelectValue.page) {
      onSelect(true, rows);
    } else if (value === BulkSelectValue.nonePage) {
      onSelect(false, rows);
    }
  };

  const rows = useMemo(() => {
    const handleRowClick = (event: any, user: User | undefined) => {
      if (event.target.matches('td') || event.target.matches('tr')) {
        trigger(EventTypes.rowClick, user);
      }
    };

    return users.map((user: User) => ({
      id: user.username,
      is_active: user.is_active,
      row: [
        authModel && orgAdmin ? (
          <OrgAdminDropdown
            key={`dropdown-${user.username}`}
            isOrgAdmin={user.is_org_admin}
            username={user.username}
            intl={intl}
            userId={user.uuid}
            fetchData={() => {
              fetchData({
                limit: perPage,
                offset: (page - 1) * perPage,
                orderBy: 'username',
                count: totalCount || 0,
                filters,
              });
            }}
          />
        ) : user.is_org_admin ? (
          intl.formatMessage(messages['usersAndUserGroupsYes'])
        ) : (
          intl.formatMessage(messages['usersAndUserGroupsNo'])
        ),
        user.username,
        user.email,
        user.first_name,
        user.last_name,
        [
          <Switch
            id={user.username}
            key={user.uuid}
            isDisabled={!orgAdmin}
            isChecked={checkedStates[user.external_source_id]}
            onChange={(e, value) => handleToggle(e, value, user)}
            label={intl.formatMessage(messages['usersAndUserGroupsActive'])}
            labelOff={intl.formatMessage(messages['usersAndUserGroupsInactive'])}
          ></Switch>,
        ],
        !authModel &&
          (user.is_org_admin ? intl.formatMessage(messages['usersAndUserGroupsYes']) : intl.formatMessage(messages['usersAndUserGroupsNo'])),
        {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: intl.formatMessage(messages['addToUserGroup']),
                  onClick: () => onAddUserClick([user]),
                },
                {
                  title: intl.formatMessage(messages['usersAndUserGroupsRemoveFromGroup']),
                  onClick: (event: KeyboardEvent | React.MouseEvent, rowId: number, rowData: any) => handleModalToggle(event, rowData),
                },
              ]}
              rowData={user}
            />
          ),
          props: { isActionCell: true },
        },
      ],
      props: {
        isClickable: Boolean(user.is_active),
        onRowClick: (event: any) => user.is_active && handleRowClick(event, focusedUser?.username === user.username ? undefined : user),
        isRowSelected: focusedUser?.username === user.username,
      },
    }));
  }, [users, intl, onAddUserClick, handleModalToggle, trigger, focusedUser?.username, filters]);

  const pageSelected = rows.length > 0 && rows.every(isSelected);
  const pagePartiallySelected = !pageSelected && rows.some(isSelected);

  const paginationComponent = (
    <Pagination
      perPageOptions={PER_PAGE_OPTIONS}
      itemCount={totalCount}
      page={page}
      perPage={perPage}
      onSetPage={onSetPage}
      onPerPageSelect={onPerPageSelect}
    />
  );

  return (
    <Fragment>
      {isDeleteModalOpen && (
        <WarningModal
          ouiaId={`${ouiaId}-remove-user-modal`}
          isOpen={isDeleteModalOpen}
          title={intl.formatMessage(messages.deleteUserModalTitle)}
          confirmButtonLabel={intl.formatMessage(messages.remove)}
          confirmButtonVariant={ButtonVariant.danger}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => {
            console.log(`Deleting ${currentUser?.username} from user groups`);
            //add delete user api call here when v2 is ready
            setIsDeleteModalOpen(false);
          }}
        >
          {`${currentUser?.username} ${intl.formatMessage(messages.deleteUserModalBody)}`}
        </WarningModal>
      )}
      {isStatusModalOpen && (
        <WarningModal
          ouiaId={`${ouiaId}-deactivate-status-modal`}
          isOpen={isStatusModalOpen}
          title={intl.formatMessage(messages.deactivateUsersConfirmationModalTitle)}
          confirmButtonLabel={intl.formatMessage(messages.deactivateUsersConfirmationButton)}
          confirmButtonVariant={ButtonVariant.danger}
          onClose={() => setIsStatusModalOpen(false)}
          onConfirm={handleBulkDeactivate}
          withCheckbox
          checkboxLabel={intl.formatMessage(messages.deactivateUsersConfirmationModalCheckboxText)}
        >
          {intl.formatMessage(messages.deactivateUsersConfirmationModalDescription)}

          <List isPlain isBordered className="pf-u-p-md">
            {selected.map((user) => (
              <ListItem key={user.id}>{user.id}</ListItem>
            ))}
          </List>
        </WarningModal>
      )}
      <DataView ouiaId={ouiaId} selection={{ ...selection, isSelectDisabled: (row) => !row.is_active }} activeState={activeState}>
        <DataViewToolbar
          ouiaId={`${ouiaId}-header-toolbar`}
          bulkSelect={
            <BulkSelect
              isDataPaginated
              pageCount={users.length}
              selectedCount={selected.length}
              totalCount={totalCount}
              pageSelected={pageSelected}
              pagePartiallySelected={pagePartiallySelected}
              onSelect={handleBulkSelect}
            />
          }
          pagination={React.cloneElement(paginationComponent, { isCompact: true })}
          filters={
            <DataViewFilters ouiaId={`${ouiaId}-filters`} onChange={(_e, values) => onSetFilters(values)} values={filters}>
              <DataViewTextFilter
                filterId="username"
                title={intl.formatMessage(messages.username)}
                placeholder={intl.formatMessage(messages.filterByUsername)}
                ouiaId={`${ouiaId}-username-filter`}
              />
              <DataViewTextFilter
                filterId="email"
                title={intl.formatMessage(messages.email)}
                placeholder={intl.formatMessage(messages.filterByUsername)}
                ouiaId={`${ouiaId}-email-filter`}
              />
            </DataViewFilters>
          }
          clearAllFilters={clearAllFilters}
          actions={
            <>
              <Split hasGutter>
                <SplitItem>
                  <Dropdown
                    isOpen={isOpen}
                    onSelect={onStatusSelect}
                    onOpenChange={(isOpen: boolean) => setIsOpen(isOpen)}
                    toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
                      <MenuToggle isDisabled={selected.length === 0} ref={toggleRef} onClick={onToggleClick} isExpanded={isOpen}>
                        {intl.formatMessage(messages.activateUsersButton)}
                      </MenuToggle>
                    )}
                    ouiaId={`${ouiaId}-status-dropdown`}
                    shouldFocusToggleOnSelect
                  >
                    <DropdownList>
                      <DropdownItem> {intl.formatMessage(messages.activateUsersButton)}</DropdownItem>
                      <DropdownItem> {intl.formatMessage(messages.deactivateUsersButton)}</DropdownItem>
                    </DropdownList>
                  </Dropdown>
                </SplitItem>
                <ResponsiveActions breakpoint="lg" ouiaId={`${ouiaId}-table-actions`}>
                  <ResponsiveAction
                    isPersistent
                    onClick={() => {
                      onAddUserClick(selected);
                    }}
                    variant="primary"
                    isDisabled={selected.length === 0}
                    ouiaId={`${ouiaId}-add-user-button`}
                  >
                    {intl.formatMessage(messages['addToUserGroup'])}
                  </ResponsiveAction>
                  <ResponsiveAction
                    variant="primary"
                    onClick={() => {
                      appNavigate(paths['invite-group-users'].link);
                    }}
                  >
                    {intl.formatMessage(messages.inviteUsers)}
                  </ResponsiveAction>
                </ResponsiveActions>
              </Split>
            </>
          }
        />
        <DataViewTable
          variant="compact"
          aria-label="Users Table"
          ouiaId={`${ouiaId}-table`}
          columns={sortableColumns}
          rows={rows}
          headStates={{ loading: loadingHeader }}
          bodyStates={{ loading: loadingBody, empty: <EmptyTable titleText={intl.formatMessage(messages.usersEmptyStateTitle)} /> }}
        />
        <DataViewToolbar ouiaId={`${ouiaId}-footer-toolbar`} pagination={paginationComponent} />
      </DataView>
      <Suspense>
        <Outlet
          context={{
            bar: 'foo',
            fetchData: () => {
              appNavigate(paths['users-and-user-groups'].link);
            },
          }}
        />
      </Suspense>
    </Fragment>
  );
};

export default UsersTable;
