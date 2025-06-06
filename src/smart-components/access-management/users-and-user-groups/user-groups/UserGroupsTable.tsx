import React, { Fragment, Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { Outlet, useSearchParams } from 'react-router-dom';
import {
  DataViewState,
  DataViewTextFilter,
  DataViewTh,
  DataViewTrObject,
  EventTypes,
  useDataViewEventsContext,
  useDataViewFilters,
  useDataViewPagination,
  useDataViewSelection,
  useDataViewSort,
} from '@patternfly/react-data-view';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import DataViewFilters from '@patternfly/react-data-view/dist/cjs/DataViewFilters';
import { ButtonVariant, EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon, Pagination, Tooltip } from '@patternfly/react-core';
import { SearchIcon } from '@patternfly/react-icons';
import { ActionsColumn, ThProps } from '@patternfly/react-table';
import { ResponsiveAction, ResponsiveActions, SkeletonTableBody, SkeletonTableHead, WarningModal } from '@patternfly/react-component-groups';

import { mappedProps } from '../../../../helpers/shared/helpers';
import { RBACStore } from '../../../../redux/store';
import { fetchGroups, removeGroups } from '../../../../redux/actions/group-actions';
import { Group } from '../../../../redux/reducers/group-reducer';
import { PER_PAGE_OPTIONS } from '../../../../helpers/shared/pagination';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import pathnames from '../../../../utilities/pathnames';
import messages from '../../../../Messages';

const EmptyTable: React.FC<{ titleText: string }> = ({ titleText }) => (
  <EmptyState>
    <EmptyStateHeader titleText={titleText} headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
    <EmptyStateBody>
      <FormattedMessage {...messages['usersEmptyStateSubtitle']} values={{ br: <br /> }} />
    </EmptyStateBody>
  </EmptyState>
);

interface UserGroupsFilters {
  name: string;
}

interface UserGroupsTableProps {
  defaultPerPage?: number;
  useUrlParams?: boolean;
  enableActions?: boolean;
  ouiaId?: string;
  onChange?: (selectedGroups: any[]) => void;
  focusedGroup?: Group;
}

const UserGroupsTable: React.FC<UserGroupsTableProps> = ({
  defaultPerPage = 20,
  useUrlParams = true,
  enableActions = true,
  ouiaId = 'iam-user-groups-table',
  onChange,
  focusedGroup,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [currentGroups, setCurrentGroups] = useState<Group[]>([]);
  const [activeState, setActiveState] = useState<DataViewState | undefined>(DataViewState.loading);
  const dispatch = useDispatch();
  const intl = useIntl();
  const navigate = useAppNavigate();
  const { trigger } = useDataViewEventsContext();
  const [searchParams, setSearchParams] = useSearchParams();

  const { groups, totalCount, isLoading } = useSelector((state: RBACStore) => ({
    groups: state.groupReducer?.groups?.data || [],
    totalCount: state.groupReducer?.groups?.meta.count || 0,
    isLoading: state.groupReducer?.isLoading,
  }));

  const columns = [
    { label: intl.formatMessage(messages.name), key: 'name', index: 0, sort: true },
    { label: intl.formatMessage(messages.description), key: 'description', index: 1, sort: false },
    { label: intl.formatMessage(messages.users), key: 'principalCount', index: 2, sort: true },
    { label: intl.formatMessage(messages.serviceAccounts), key: 'serviceAccountCount', index: 3, sort: false },
    { label: intl.formatMessage(messages.roles), key: 'roleCount', index: 4, sort: false },
    { label: intl.formatMessage(messages.workspaces), key: 'workspaceCount', index: 5, sort: false },
    { label: intl.formatMessage(messages.lastModified), key: 'modified', index: 6, sort: true },
  ];

  const { sortBy, direction, onSort } = useDataViewSort({
    searchParams,
    setSearchParams,
    initialSort: {
      sortBy: 'name',
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

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<UserGroupsFilters>({
    initialFilters: { name: '' },
    searchParams,
    setSearchParams,
  });

  let pagination;
  if (useUrlParams) {
    pagination = useDataViewPagination({
      perPage: defaultPerPage,
      searchParams,
      setSearchParams,
    });
  } else {
    const [perPage, setPerPage] = useState(defaultPerPage);
    const [page, setPage] = useState(1);
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

  const loadingHeader = <SkeletonTableHead columns={columns.map((group) => group.label)} />;
  const loadingBody = <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />;

  const fetchData = useCallback(
    (apiProps: { count: number; limit: number; offset: number; orderBy: string; filters: UserGroupsFilters }) => {
      const { count, limit, offset, orderBy, filters } = apiProps;
      const orderDirection = direction === 'desc' ? '-' : '';
      dispatch(
        fetchGroups({
          ...mappedProps({ count, limit, offset, orderBy: `${orderDirection}${orderBy}`, filters }),
          usesMetaInURL: true,
          system: false,
        }),
      );
    },
    [dispatch, direction],
  );

  useEffect(() => {
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: sortBy || 'name',
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

  useEffect(() => {
    onChange?.(selected);
  }, [selected, onChange]);

  const handleBulkSelect = (value: BulkSelectValue) => {
    if (value === BulkSelectValue.none) {
      onSelect(false);
    } else if (value === BulkSelectValue.page) {
      onSelect(true, rows);
    } else if (value === BulkSelectValue.nonePage) {
      onSelect(false, rows);
    }
  };

  const handleDeleteModalToggle = (groups: Group[]) => {
    setCurrentGroups(groups);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const handleDeleteGroups = async (groupsToDelete: Group[]) => {
    await dispatch(removeGroups(groupsToDelete.map((group) => group.uuid)));
    setIsDeleteModalOpen(false);
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: sortBy || 'name',
      count: totalCount || 0,
      filters,
    });
  };

  const rows = useMemo(() => {
    const handleRowClick = (event: any, group: Group | undefined) => {
      if (event.target.matches('td') || event.target.matches('tr')) {
        trigger(EventTypes.rowClick, group);
      }
    };

    return groups.map((group: Group) => ({
      id: group.uuid,
      row: [
        group.name,
        group.description ? (
          <Tooltip isContentLeftAligned content={group.description}>
            <span>{group.description.length > 23 ? `${group.description.slice(0, 20)}...` : group.description}</span>
          </Tooltip>
        ) : (
          <div className="pf-v5-u-color-400">{intl.formatMessage(messages['usersAndUserGroupsNoDescription'])}</div>
        ),
        group.principalCount,
        '?', // not currently in API
        group.roleCount,
        '?', // not currently in API
        group.modified ? formatDistanceToNow(new Date(group.modified), { addSuffix: true }) : '',
        enableActions && {
          cell: (
            <ActionsColumn
              items={[
                {
                  title: intl.formatMessage(messages['usersAndUserGroupsEditUserGroup']),
                  onClick: () => navigate(pathnames['users-and-user-groups-edit-group'].link.replace(':groupId', group.uuid)),
                },
                {
                  title: intl.formatMessage(messages['usersAndUserGroupsDeleteUserGroup']),
                  onClick: () => handleDeleteModalToggle([group]),
                },
              ]}
              rowData={group}
              isDisabled={group.platform_default || group.system}
            />
          ),
          props: { isActionCell: true },
        },
      ],
      props: {
        isClickable: true,
        onRowClick: (event: any) => handleRowClick(event, focusedGroup?.uuid === group.uuid ? undefined : group),
        isRowSelected: focusedGroup?.uuid === group.uuid,
      },
    }));
  }, [groups, focusedGroup, intl, navigate, trigger, enableActions]);

  const pageSelected = rows.length > 0 && rows.every(isSelected);
  const pagePartiallySelected = !pageSelected && rows.some(isSelected);
  const isRowSystemOrPlatformDefault = (selectedRow: any) => {
    const group = groups.find((group) => group.uuid === selectedRow.id);
    return group?.platform_default || group?.system;
  };

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
          title={intl.formatMessage(messages.deleteUserGroupModalTitle, { count: currentGroups.length })}
          withCheckbox
          checkboxLabel={intl.formatMessage(messages.understandActionIrreversible)}
          confirmButtonLabel={intl.formatMessage(messages.remove)}
          confirmButtonVariant={ButtonVariant.danger}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={() => handleDeleteGroups(currentGroups)}
        >
          <FormattedMessage
            {...messages.deleteUserGroupModalBody}
            values={{
              b: (text) => <b>{text}</b>,
              count: currentGroups.length,
              plural: currentGroups.length > 1 ? intl.formatMessage(messages.groups) : intl.formatMessage(messages.group),
              name: currentGroups[0]?.name,
            }}
          />
        </WarningModal>
      )}
      <DataView ouiaId={ouiaId} selection={selection} activeState={activeState}>
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
          actions={
            <ResponsiveActions breakpoint="lg" ouiaId={`${ouiaId}-actions-dropdown`}>
              <ResponsiveAction isPinned isPersistent onClick={() => navigate(pathnames['users-and-user-groups-create-group'].link)}>
                {intl.formatMessage(messages.createUserGroup)}
              </ResponsiveAction>
              <ResponsiveAction
                isDisabled={selected.length === 0 || selected.some(isRowSystemOrPlatformDefault)}
                onClick={() => console.log('EDIT USER GROUP')}
              >
                {intl.formatMessage(messages.usersAndUserGroupsEditUserGroup)}
              </ResponsiveAction>
              <ResponsiveAction
                isDisabled={selected.length === 0 || selected.some(isRowSystemOrPlatformDefault)}
                onClick={() => {
                  const selectedGroups = groups.filter((group) => selected.some((selectedRow: DataViewTrObject) => selectedRow.id === group.uuid));
                  handleDeleteModalToggle(selectedGroups);
                }}
              >
                {intl.formatMessage(messages.usersAndUserGroupsDeleteUserGroup)}
              </ResponsiveAction>
            </ResponsiveActions>
          }
          pagination={React.cloneElement(paginationComponent, { isCompact: true })}
          filters={
            <DataViewFilters onChange={(_e, values) => onSetFilters(values)} values={filters}>
              <DataViewTextFilter filterId="name" title="Name" placeholder="Filter by name" />
            </DataViewFilters>
          }
          clearAllFilters={clearAllFilters}
        />
        <DataViewTable
          variant="compact"
          aria-label="Users Table"
          ouiaId={`${ouiaId}-table`}
          columns={sortableColumns}
          rows={rows}
          headStates={{ loading: loadingHeader }}
          bodyStates={{
            loading: loadingBody,
            empty: <EmptyTable titleText={intl.formatMessage(messages.userGroupsEmptyStateTitle)} />,
          }}
        />
        <DataViewToolbar ouiaId={`${ouiaId}-footer-toolbar`} pagination={paginationComponent} />
      </DataView>
      <Suspense>
        <Outlet
          context={{
            [pathnames['create-user-group'].path]: {
              afterSubmit: () => {
                navigate({ pathname: pathnames['user-groups'].link });
              },
              onCancel: () =>
                navigate({
                  pathname: pathnames['user-groups'].link,
                  searchParams: searchParams.toString(),
                }),
              enableRoles: false,
              pagination: { limit: perPage },
              filters: {},
              postMethod: fetchData,
            },
          }}
        />
      </Suspense>
    </Fragment>
  );
};

export default UserGroupsTable;
