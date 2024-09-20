import React, { useState, useEffect } from 'react';
import { useDataViewSelection, useDataViewPagination } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { Pagination } from '@patternfly/react-core';
import { ActionsColumn } from '@patternfly/react-table';
import { fetchUsers } from '../../helpers/user/user-helper';

const COLUMNS = ['Username', 'Email', 'First name', 'Last name', 'Status', 'Org admin'];

const ROW_ACTIONS = [
  { title: 'Add to user group', onClick: () => console.log('ADD TO USER GROUP') },
  { title: 'Remove from user group', onClick: () => console.log('REMOVE FROM USER GROUP') },
];

const PER_PAGE_OPTIONS = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

const OUIA_ID = 'iam-users-table';

const UsersTable = () => {
  const [users, setUsers] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pagination = useDataViewPagination({ perPage: 20 });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  const selection = useDataViewSelection({ matchOption: (a, b) => a[0] === b[0] });
  const { selected, onSelect, isSelected } = selection;

  useEffect(() => {
    const loadUsers = async () => {
      setLoading(true);
      try {
        const result = await fetchUsers({
          limit: perPage,
          offset: (page - 1) * perPage,
          orderBy: 'username',
        });
        setUsers(result.data);
        setTotalCount(result.meta.count);
      } catch (err) {
        setError('Failed to load users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadUsers();
  }, [page, perPage]);

  const handleBulkSelect = (value) => {
    if (value === BulkSelectValue.none) {
      onSelect(false);
    } else if (value === BulkSelectValue.page) {
      onSelect(true, rows);
    } else if (value === BulkSelectValue.all) {
      onSelect(true);
    }
  };

  if (error) return <div>{error}</div>;

  const rows = users.map((user) => [
    user.username,
    user.email,
    user.first_name,
    user.last_name,
    user.is_active ? 'Active' : 'Inactive',
    user.is_org_admin ? 'Yes' : 'No',
    {
      cell: <ActionsColumn items={ROW_ACTIONS} />,
      props: { isActionCell: true },
    },
  ]);

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
    <DataView ouiaId={OUIA_ID} selection={selection}>
      <DataViewToolbar
        ouiaId={`${OUIA_ID}-header-toolbar`}
        bulkSelect={
          <BulkSelect
            isDataPaginated={true}
            pageCount={users.length}
            selectedCount={selected.length}
            totalCount={totalCount}
            pageSelected={pageSelected}
            pagePartiallySelected={pagePartiallySelected}
            onSelect={handleBulkSelect}
          />
        }
        pagination={React.cloneElement(paginationComponent, { isCompact: true })}
      />
      <DataViewTable aria-label="Users Table" ouiaId={`${OUIA_ID}-table`} columns={COLUMNS} rows={rows} isLoading={loading} />
      <DataViewToolbar ouiaId={`${OUIA_ID}-footer-toolbar`} pagination={paginationComponent} />
    </DataView>
  );
};

export default UsersTable;
