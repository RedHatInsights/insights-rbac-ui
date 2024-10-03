import React, { useEffect, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useDataViewSelection, useDataViewPagination } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { Pagination, Tooltip } from '@patternfly/react-core';
import { ActionsColumn } from '@patternfly/react-table';
import { mappedProps } from '../../helpers/shared/helpers';
import { RBACStore } from '../../redux/store';
import { useSearchParams } from 'react-router-dom';
import { fetchGroups } from '../../redux/actions/group-actions';
import { formatDistanceToNow } from 'date-fns';

const COLUMNS: string[] = ['User group name', 'Description', 'Users', 'Service accounts', 'Roles', 'Workspaces', 'Last modified'];

const ROW_ACTIONS = [
  { title: 'Edit user group', onClick: () => console.log('EDIT USER GROUP') },
  { title: 'Delete user group', onClick: () => console.log('DELETE USER GROUP') },
];

const PER_PAGE_OPTIONS = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

const OUIA_ID = 'iam-user-groups-table';

const UserGroupsTable: React.FunctionComponent = () => {
  const dispatch = useDispatch();

  const { groups, totalCount } = useSelector((state: RBACStore) => ({
    groups: state.groupReducer?.groups?.data || [],
    totalCount: state.groupReducer?.groups?.meta.count || 0,
  }));

  const [searchParams, setSearchParams] = useSearchParams();
  const pagination = useDataViewPagination({ perPage: 20, searchParams, setSearchParams });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  const selection = useDataViewSelection({ matchOption: (a, b) => a[0] === b[0] });
  const { selected, onSelect, isSelected } = selection;

  const fetchData = useCallback(
    (apiProps: { count: number; limit: number; offset: number; orderBy: string }) => {
      const { count, limit, offset, orderBy } = apiProps;
      dispatch(fetchGroups({ ...mappedProps({ count, limit, offset, orderBy }), usesMetaInURL: true }));
    },
    [dispatch]
  );

  useEffect(() => {
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: 'name',
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

  const rows = groups.map((group: any) => [
    group.name,
    group.description && (
      <Tooltip isContentLeftAligned content={group.description}>
        <span>{group.description.length > 23 ? group.description.slice(0, 20) + '...' : group.description}</span>
      </Tooltip>
    ),
    group.principalCount,
    group.serviceAccounts || '?', // not currently in API
    group.roleCount,
    group.workspaces || '?', // not currently in API
    formatDistanceToNow(new Date(group.modified), { addSuffix: true }),
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
            isDataPaginated
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
      <DataViewTable aria-label="Users Table" ouiaId={`${OUIA_ID}-table`} columns={COLUMNS} rows={rows} />
      <DataViewToolbar ouiaId={`${OUIA_ID}-footer-toolbar`} pagination={paginationComponent} />
    </DataView>
  );
};

export default UserGroupsTable;
