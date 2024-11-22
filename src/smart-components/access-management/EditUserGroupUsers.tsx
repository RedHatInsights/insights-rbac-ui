import { Pagination } from '@patternfly/react-core';
import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import { DataView, DataViewTable, DataViewToolbar, useDataViewPagination, useDataViewSelection } from '@patternfly/react-data-view';
import { useDispatch, useSelector } from 'react-redux';
import { RBACStore } from '../../redux/store';
import { fetchUsers } from '../../redux/actions/user-actions';
import { mappedProps } from '../../helpers/shared/helpers';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups';
import { Diff } from './EditUserGroupUsersAndServiceAccounts';

interface EditGroupUsersTableUsersTableProps {
  onChange: (userDiff: Diff) => void;
  groupId: string;
}

const PER_PAGE_OPTIONS = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

const EditGroupUsersTable: React.FunctionComponent<EditGroupUsersTableUsersTableProps> = ({ onChange, groupId }) => {
  const dispatch = useDispatch();
  const pagination = useDataViewPagination({ perPage: 20 });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;
  const initialUserIds = useRef<string[]>([]);

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
  });
  const { selected, onSelect, isSelected } = selection;

  useEffect(() => {
    return () => {
      onSelect(false);
      initialUserIds.current = [];
    };
  }, []);

  const { users, groupUsers, totalCount } = useSelector((state: RBACStore) => ({
    users: state.userReducer?.users?.data || [],
    groupUsers: state.groupReducer?.selectedGroup?.members?.data || [],
    totalCount: state.userReducer?.users?.meta?.count,
  }));

  const rows = useMemo(
    () =>
      users.map((user) => ({
        id: user.username,
        row: [user.is_org_admin ? 'Yes' : 'No', user.username, user.email, user.first_name, user.last_name, user.is_active ? 'Active' : 'Inactive'],
      })),
    [users, groupId]
  );

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

  useEffect(() => {
    onSelect(false);
    initialUserIds.current = [];
    const initialSelectedUsers = groupUsers.map((user) => ({ id: user.username }));
    onSelect(true, initialSelectedUsers);
    initialUserIds.current = initialSelectedUsers.map((user) => user.id);
  }, [groupUsers]);

  useEffect(() => {
    const selectedUserIds = selection.selected.map((user) => user.id);
    const added = selectedUserIds.filter((id) => !initialUserIds.current.includes(id));
    const removed = initialUserIds.current.filter((id) => !selectedUserIds.includes(id));
    onChange({ added, removed });
  }, [selection.selected]);

  const pageSelected = rows.length > 0 && rows.every(isSelected);
  const pagePartiallySelected = !pageSelected && rows.some(isSelected);
  const handleBulkSelect = (value: BulkSelectValue) => {
    if (value === BulkSelectValue.none) {
      onSelect(false);
    } else if (value === BulkSelectValue.page) {
      onSelect(true, rows);
    } else if (value === BulkSelectValue.nonePage) {
      onSelect(false, rows);
    }
  };

  return (
    <DataView selection={{ ...selection }}>
      <DataViewToolbar
        pagination={
          <Pagination
            perPageOptions={PER_PAGE_OPTIONS}
            itemCount={totalCount}
            page={page}
            perPage={perPage}
            onSetPage={onSetPage}
            onPerPageSelect={onPerPageSelect}
          />
        }
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
      />
      <DataViewTable variant="compact" columns={['Org Admin', 'Username', 'Email', 'First name', 'Last name', 'Status']} rows={rows} />
    </DataView>
  );
};

export default EditGroupUsersTable;
