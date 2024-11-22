import React, { useEffect, useCallback, useMemo, useState, Fragment, Suspense } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSelector, useDispatch } from 'react-redux';
import { Outlet, useSearchParams } from 'react-router-dom';
import { useDataViewSelection, useDataViewPagination } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { ButtonVariant, EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon, Pagination, Tooltip } from '@patternfly/react-core';
import { DataViewTrObject, DataViewState, EventTypes, useDataViewEventsContext } from '@patternfly/react-data-view';
import { SearchIcon } from '@patternfly/react-icons';
import { ActionsColumn } from '@patternfly/react-table';
import { ResponsiveAction, ResponsiveActions, SkeletonTableBody, SkeletonTableHead, WarningModal } from '@patternfly/react-component-groups';
import { mappedProps } from '../../../../helpers/shared/helpers';
import { RBACStore } from '../../../../redux/store';
import { fetchGroups, removeGroups } from '../../../../redux/actions/group-actions';
import { Group } from '../../../../redux/reducers/group-reducer';
import useAppNavigate from '../../../../hooks/useAppNavigate';
import pathnames from '../../../../utilities/pathnames';
import messages from '../../../../Messages';

const COLUMNS: string[] = ['User group name', 'Description', 'Users', 'Service accounts', 'Roles', 'Workspaces', 'Last modified'];

const PER_PAGE_OPTIONS = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

const EmptyTable: React.FunctionComponent<{ titleText: string }> = ({ titleText }) => {
  return (
    <EmptyState>
      <EmptyStateHeader titleText={titleText} headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
      <EmptyStateBody>
        <FormattedMessage
          {...messages['usersEmptyStateSubtitle']}
          values={{
            br: <br />,
          }}
        />
      </EmptyStateBody>
    </EmptyState>
  );
};

const loadingHeader = <SkeletonTableHead columns={COLUMNS} />;
const loadingBody = <SkeletonTableBody rowsCount={10} columnsCount={COLUMNS.length} />;

interface UserGroupsTableProps {
  defaultPerPage?: number;
  useUrlParams?: boolean;
  enableActions?: boolean;
  ouiaId?: string;
  onChange?: (selectedGroups: any[]) => void;
  focusedGroup?: Group;
}

const UserGroupsTable: React.FunctionComponent<UserGroupsTableProps> = ({
  defaultPerPage = 20,
  useUrlParams = true,
  enableActions = true,
  ouiaId = 'iam-user-groups-table',
  onChange,
  focusedGroup,
}) => {
  const [isDeleteModalOpen, setIsDeleteModalOpen] = React.useState(false);
  const [currentGroups, setCurrentGroups] = React.useState<Group[]>([]);
  const dispatch = useDispatch();
  const [activeState, setActiveState] = useState<DataViewState | undefined>(DataViewState.loading);
  const intl = useIntl();
  const navigate = useAppNavigate();
  const search = useSearchParams();
  const { trigger } = useDataViewEventsContext();

  const handleDeleteModalToggle = (groups: Group[]) => {
    setCurrentGroups(groups);
    setIsDeleteModalOpen(!isDeleteModalOpen);
  };

  const { groups, totalCount, isLoading } = useSelector((state: RBACStore) => ({
    groups: state.groupReducer?.groups?.data || [],
    totalCount: state.groupReducer?.groups?.meta.count || 0,
    isLoading: state.groupReducer?.isLoading,
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
    if (isLoading) {
      setActiveState(DataViewState.loading);
    } else {
      totalCount === 0 ? setActiveState(DataViewState.empty) : setActiveState(undefined);
    }
  }, [totalCount, isLoading]);

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

  const rows = useMemo(() => {
    const handleRowClick = (event: any, group: Group | undefined) => {
      (event.target.matches('td') || event.target.matches('tr')) && trigger(EventTypes.rowClick, group);
    };

    return groups.map((group: Group) => ({
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
  }, [groups, focusedGroup]);

  const pageSelected = rows.length > 0 && rows.every(isSelected);
  const pagePartiallySelected = !pageSelected && rows.some(isSelected);
  const isRowSystemOrPlatformDefault = (selectedRow: any) => {
    const group = groups.find((group) => group.uuid === selectedRow.id);
    return group?.platform_default || group?.system;
  };

  const handleDeleteGroups = async (groupsToDelete: Group[]) => {
    await dispatch(removeGroups(groupsToDelete.map((group) => group.uuid)));
    setIsDeleteModalOpen(false);
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: 'name',
      count: totalCount || 0,
    });
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
          onConfirm={() => {
            handleDeleteGroups(currentGroups);
          }}
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
              <ResponsiveAction isPinned isPersistent onClick={() => navigate(pathnames['create-user-group'].link)}>
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
                  handleDeleteModalToggle(groups.filter((group) => selected.some((selectedRow: DataViewTrObject) => selectedRow.id === group.uuid)));
                }}
              >
                {intl.formatMessage(messages.usersAndUserGroupsDeleteUserGroup)}
              </ResponsiveAction>
            </ResponsiveActions>
          }
          pagination={React.cloneElement(paginationComponent, { isCompact: true })}
        />
        <DataViewTable
          variant="compact"
          aria-label="Users Table"
          ouiaId={`${ouiaId}-table`}
          columns={COLUMNS}
          rows={rows}
          headStates={{ loading: loadingHeader }}
          bodyStates={{ loading: loadingBody, empty: <EmptyTable titleText={intl.formatMessage(messages.userGroupsEmptyStateTitle)} /> }}
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
                  search: search.toString(),
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
