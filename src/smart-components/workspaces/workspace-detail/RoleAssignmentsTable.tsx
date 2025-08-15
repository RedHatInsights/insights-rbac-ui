import { SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { BulkSelect, BulkSelectValue } from '@patternfly/react-component-groups/dist/dynamic/BulkSelect';
import { EmptyState, EmptyStateBody, EmptyStateHeader, EmptyStateIcon, Pagination, Tooltip } from '@patternfly/react-core';
import { DataViewState } from '@patternfly/react-data-view';
import { DataView } from '@patternfly/react-data-view/dist/dynamic/DataView';
import { DataViewTable } from '@patternfly/react-data-view/dist/dynamic/DataViewTable';
import { DataViewToolbar } from '@patternfly/react-data-view/dist/dynamic/DataViewToolbar';
import { useDataViewPagination, useDataViewSelection } from '@patternfly/react-data-view/dist/dynamic/Hooks';
import { SearchIcon } from '@patternfly/react-icons';
import { formatDistanceToNow } from 'date-fns';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { mappedProps } from '../../../helpers/shared/helpers';
import { PER_PAGE_OPTIONS } from '../../../helpers/shared/pagination';
import messages from '../../../Messages';
import { fetchGroups } from '../../../redux/actions/group-actions';
import { Group } from '../../../redux/reducers/group-reducer';
import { RBACStore } from '../../../redux/store';

const EmptyTable: React.FunctionComponent<{ titleText: string }> = ({ titleText }) => {
  return (
    <EmptyState>
      <EmptyStateHeader titleText={titleText} headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
      <EmptyStateBody>
        <FormattedMessage
          {...messages['roleAssignmentsEmptyStateSubtitle']}
          values={{
            br: <br />,
          }}
        />
      </EmptyStateBody>
    </EmptyState>
  );
};

interface RoleAssignmentsTableProps {
  defaultPerPage?: number;
  useUrlParams?: boolean;
  enableActions?: boolean;
  ouiaId?: string;
  onChange?: (selectedGroups: unknown[]) => void;
  focusedGroup?: Group;
}

const RoleAssignmentsTable: React.FunctionComponent<RoleAssignmentsTableProps> = ({
  defaultPerPage = 20,
  ouiaId = 'iam-role-assignments-table',
  onChange,
}) => {
  const dispatch = useDispatch();
  const [activeState, setActiveState] = useState<DataViewState | undefined>(DataViewState.loading);
  const intl = useIntl();

  const COLUMNS: string[] = [
    intl.formatMessage(messages['userGroup']),
    intl.formatMessage(messages['description']),
    intl.formatMessage(messages['users']),
    intl.formatMessage(messages['roles']),
    intl.formatMessage(messages['accessOrigin']),
    intl.formatMessage(messages['lastModified']),
  ];

  const { groups, totalCount, isLoading } = useSelector((state: RBACStore) => ({
    groups: state.groupReducer?.groups?.data || [],
    totalCount: state.groupReducer?.groups?.meta.count || 0,
    isLoading: state.groupReducer?.isLoading,
  }));

  const [searchParams, setSearchParams] = useSearchParams();
  const pagination = useDataViewPagination({
    perPage: defaultPerPage,
    searchParams: searchParams,
    setSearchParams: setSearchParams,
  });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;

  const selection = useDataViewSelection({ matchOption: (a, b) => a.id === b.id });
  const { selected, onSelect, isSelected } = selection;

  const fetchData = useCallback(
    (apiProps: { count: number; limit: number; offset: number; orderBy: string }) => {
      const { count, limit, offset, orderBy } = apiProps;
      dispatch(fetchGroups({ ...mappedProps({ count, limit, offset, orderBy }), usesMetaInURL: true, system: false }));
    },
    [dispatch],
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

  const rows = useMemo(
    () =>
      groups.map((group: Group) => ({
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
          group.roleCount,
          '?', // not currently in API
          group.modified ? formatDistanceToNow(new Date(group.modified), { addSuffix: true }) : '',
        ],
      })),
    [groups],
  );
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
        pagination={React.cloneElement(paginationComponent, { isCompact: true })}
      />
      <DataViewTable
        variant="compact"
        aria-label="Role assignments table"
        ouiaId={`${ouiaId}-table`}
        columns={COLUMNS}
        rows={rows}
        headStates={{ loading: <SkeletonTableHead columns={COLUMNS} /> }}
        bodyStates={{
          loading: <SkeletonTableBody rowsCount={10} columnsCount={COLUMNS.length} />,
          empty: <EmptyTable titleText={intl.formatMessage(messages.userGroupsEmptyStateTitle)} />,
        }}
      />
      <DataViewToolbar ouiaId={`${ouiaId}-footer-toolbar`} pagination={paginationComponent} />
    </DataView>
  );
};

export default RoleAssignmentsTable;
