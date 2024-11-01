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
import { useIntl } from 'react-intl';
import messages from '../../Messages';
import { Group } from '../../redux/reducers/group-reducer';

const COLUMNS: string[] = ['User group name', 'Description', 'Users', 'Service accounts', 'Roles', 'Workspaces', 'Last modified'];

const PER_PAGE_OPTIONS = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

interface UserGroupsTableProps {
  defaultPerPage?: number;
  useUrlParams?: boolean;
  enableActions?: boolean;
  ouiaId?: string;
  onChange?: (selectedGroups: any[]) => void;
  onFocusGroup?: (group: Group) => void;
}

const UserGroupsTable: React.FunctionComponent<UserGroupsTableProps> = ({
  defaultPerPage = 20,
  useUrlParams = true,
  enableActions = true,
  ouiaId = 'iam-user-groups-table',
  onChange,
  onFocusGroup,
}) => {
  const dispatch = useDispatch();
  const intl = useIntl();

  const rowActions = [
    { title: intl.formatMessage(messages['usersAndUserGroupsEditUserGroup']), onClick: () => console.log('EDIT USER GROUP') },
    { title: intl.formatMessage(messages['usersAndUserGroupsDeleteUserGroup']), onClick: () => console.log('DELETE USER GROUP') },
  ];

  const { groups, totalCount } = useSelector((state: RBACStore) => ({
    groups: state.groupReducer?.groups?.data || [],
    totalCount: state.groupReducer?.groups?.meta.count || 0,
  }));

  let pagination;

  if (useUrlParams) {
    const [searchParams, setSearchParams] = useSearchParams();
    pagination = useDataViewPagination({
      perPage: defaultPerPage,
      searchParams: searchParams,
      setSearchParams: setSearchParams,
    });
  } else {
    const [perPage, setPerPage] = React.useState(defaultPerPage);
    const [page, setPage] = React.useState(1);
    pagination = {
      page,
      perPage,
      onSetPage: (_e: any, page: number) => setPage(page),
      onPerPageSelect: (_e: any, perPage: number) => setPerPage(perPage),
    };
  }
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });
  const { selected, onSelect, isSelected } = selection;

  const fetchData = useCallback(
    (apiProps: { count: number; limit: number; offset: number; orderBy: string }) => {
      const { count, limit, offset, orderBy } = apiProps;
      dispatch(fetchGroups({ ...mappedProps({ count, limit, offset, orderBy }), usesMetaInURL: true, system: false }));
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

  useEffect(() => {
    onChange?.(selected);
  }, [selected]);

  const handleBulkSelect = (value: BulkSelectValue) => {
    if (value === BulkSelectValue.none) {
      onSelect(false);
    } else if (value === BulkSelectValue.page) {
      onSelect(true, rows);
    } else if (value === BulkSelectValue.nonePage) {
      onSelect(false, rows);
    }
  };

  const rows = groups.map((group: any) => ({
    id: group.uuid,
    row: [
      group.name,
      group.description ? (
        <Tooltip isContentLeftAligned content={group.description}>
          <span>{group.description.length > 23 ? group.description.slice(0, 20) + '...' : group.description}</span>
        </Tooltip>
      ) : (
        <div className="pf-v5-u-color-400">{intl.formatMessage(messages['usersAndUserGroupsNoDescription'])}</div>
      ),
      group.principalCount,
      group.serviceAccounts || '?', // not currently in API
      group.roleCount,
      group.workspaces || '?', // not currently in API
      formatDistanceToNow(new Date(group.modified), { addSuffix: true }),
      enableActions && {
        cell: <ActionsColumn items={rowActions} />,
        props: { isActionCell: true },
      },
    ],
    props: {
      onClick: () => onFocusGroup?.(group),
    }
  }));

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
    <DataView ouiaId={ouiaId} selection={selection}>
      <DataViewToolbar
        ouiaId={`${ouiaId}-header-toolbar`}
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
      <DataViewTable variant="compact" aria-label="Users Table" ouiaId={`${ouiaId}-table`} columns={COLUMNS} rows={rows} />
      <DataViewToolbar ouiaId={`${ouiaId}-footer-toolbar`} pagination={paginationComponent} />
    </DataView>
  );
};

export default UserGroupsTable;
