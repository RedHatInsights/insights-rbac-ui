import React, { useEffect, useCallback, useState, Fragment, useMemo, useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDataViewSelection, useDataViewPagination } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import {
  Button,
  Pagination,
  ButtonVariant,
  Switch,
  Dropdown,
  DropdownList,
  DropdownItem,
  MenuToggle,
  MenuToggleElement,
  Split,
  SplitItem,
  List,
  ListItem,
} from '@patternfly/react-core';
import { ActionsColumn } from '@patternfly/react-table';
import { changeUsersStatus, fetchUsers } from '../../redux/actions/user-actions';
import { mappedProps } from '../../helpers/shared/helpers';
import { RBACStore } from '../../redux/store';
import { User } from '../../redux/reducers/user-reducer';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import { useSearchParams } from 'react-router-dom';
import { WarningModal } from '@patternfly/react-component-groups';
import { EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';
import PermissionsContext from '../../utilities/permissions-context';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';

const COLUMNS: string[] = ['Username', 'Email', 'First name', 'Last name', 'Status', 'Org admin'];

const PER_PAGE_OPTIONS = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

const OUIA_ID = 'iam-users-table';

interface UsersTableProps {
  onAddUserClick: (selected: User[]) => void;
  focusedUser?: User;
}

const UsersTable: React.FunctionComponent<UsersTableProps> = ({ onAddUserClick, focusedUser }) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | undefined>();
  const [accountId, setAccountId] = useState<number | undefined>();
  const dispatch = useDispatch();
  const intl = useIntl();
  const { trigger } = useDataViewEventsContext();

  const { users, totalCount } = useSelector((state: RBACStore) => ({
    users: state.userReducer.users.data || [],
    totalCount: state.userReducer.users.meta.count,
  }));

  // activate/deactivate
  const { orgAdmin } = useContext(PermissionsContext);
  const { auth, isProd } = useChrome();
  const [token, setToken] = useState<string | null>(null);
  useEffect(() => {
    const getToken = async () => {
      setToken((await auth.getToken()) as string);
      setAccountId((await auth.getUser())?.identity.account_number as unknown as number);
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
      const initialCheckedStates = users.reduce((acc, user) => {
        acc[user.external_source_id] = user.is_active;
        return acc;
      }, {} as Record<string, boolean>);
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
          { isProd: isProd(), token, accountId }
        )
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

  const [searchParams, setSearchParams] = useSearchParams();
  const pagination = useDataViewPagination({ perPage: 20, searchParams, setSearchParams });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });
  const { selected, onSelect, isSelected } = selection;

  const fetchData = useCallback(
    (apiProps: { count: number; limit: number; offset: number; orderBy: string }) => {
      const { count, limit, offset, orderBy } = apiProps;
      dispatch(fetchUsers({ ...mappedProps({ count, limit, offset, orderBy }), usesMetaInURL: true }));
    },
    [dispatch]
  );

  useEffect(() => {
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: 'username',
      count: totalCount || 0,
    });
  }, [fetchData, page, perPage]);

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
      (event.target.matches('td') || event.target.matches('tr')) && trigger(EventTypes.rowClick, user);
    };

    return users.map((user: User) => ({
      id: user.username,
      is_active: user.is_active,
      row: [
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
        user.is_org_admin ? intl.formatMessage(messages['usersAndUserGroupsYes']) : intl.formatMessage(messages['usersAndUserGroupsNo']),
        {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: intl.formatMessage(messages['usersAndUserGroupsAddToGroup']),
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
  }, [users, intl, onAddUserClick, handleModalToggle, trigger, focusedUser?.username]);

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
          ouiaId={`${OUIA_ID}-remove-user-modal`}
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
          ouiaId={`${OUIA_ID}-update-status`}
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
              <>
                <ListItem key={user.id}>{user.id}</ListItem>
              </>
            ))}
          </List>
        </WarningModal>
      )}
      <DataView ouiaId={OUIA_ID} selection={{ ...selection, isSelectDisabled: (row) => !row.is_active }}>
        <DataViewToolbar
          ouiaId={`${OUIA_ID}-header-toolbar`}
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
          actions={
            <Split hasGutter>
              <SplitItem>
                <Button
                  variant="primary"
                  onClick={() => {
                    onAddUserClick(selected);
                  }}
                  isDisabled={selected.length === 0}
                  ouiaId={`${OUIA_ID}-add-user-button`}
                >
                  {intl.formatMessage(messages['usersAndUserGroupsAddToGroup'])}
                </Button>
              </SplitItem>
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
                  ouiaId="status-dropdown"
                  shouldFocusToggleOnSelect
                >
                  <DropdownList>
                    <DropdownItem> {intl.formatMessage(messages.activateUsersButton)}</DropdownItem>
                    <DropdownItem> {intl.formatMessage(messages.deactivateUsersButton)}</DropdownItem>
                  </DropdownList>
                </Dropdown>
              </SplitItem>
            </Split>
          }
        />
        <DataViewTable variant="compact" aria-label="Users Table" ouiaId={`${OUIA_ID}-table`} columns={COLUMNS} rows={rows} />
        <DataViewToolbar ouiaId={`${OUIA_ID}-footer-toolbar`} pagination={paginationComponent} />
      </DataView>
    </Fragment>
  );
};

export default UsersTable;
