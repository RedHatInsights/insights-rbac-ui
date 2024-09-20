import React, { useState, useEffect } from 'react';
import { useDataViewSelection, useDataViewPagination } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { Pagination } from '@patternfly/react-core';
import { ActionsColumn } from '@patternfly/react-table';
import { fetchGroups } from '../../helpers/group/group-helper';

const COLUMNS = ['User group name', 'Description', 'Users', 'Service accounts', 'Roles', 'Workspaces', 'Last modified'];

const ROW_ACTIONS = [
  { title: 'Edit User Group', onClick: () => console.log('EDIT USER GROUP') },
  { title: 'Delete User Group', onClick: () => console.log('DELETE USER GROUP') },
];

const PER_PAGE_OPTIONS = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

const OUIA_ID = 'iam-user-groups-table';

const UserGroupsTable = () => {
  const [groups, setGroups] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pagination = useDataViewPagination({ perPage: 20 });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  const selection = useDataViewSelection({ matchOption: (a, b) => a.uuid === b.uuid });
  const { selected, onSelect, isSelected } = selection;

  useEffect(() => {
    const loadUserGroups = async () => {
      setLoading(true);
      try {
        const result = await fetchGroups({
          limit: perPage,
          offset: (page - 1) * perPage,
          orderBy: 'principalCount',
        });
        setGroups(result.data);
        setTotalCount(result.meta.count);
      } catch (err) {
        setError('Failed to load user groups');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    loadUserGroups();
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

  const rows = groups.map((group) => [
    group.name,
    group.description,
    group.principalCount,
    group.serviceAccountCount, // not available in the API
    group.roleCount,
    group.workspaceCount, // not available in the API
    group.modified,
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
            pageCount={groups.length}
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

export default UserGroupsTable;
