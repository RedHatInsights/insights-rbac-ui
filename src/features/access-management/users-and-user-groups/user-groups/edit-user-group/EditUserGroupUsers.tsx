import { EmptyState } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateBody } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateHeader } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { EmptyStateIcon } from '@patternfly/react-core/dist/dynamic/components/EmptyState';
import { Pagination } from '@patternfly/react-core/dist/dynamic/components/Pagination';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { DataView, DataViewState, DataViewTable, DataViewToolbar, useDataViewPagination, useDataViewSelection } from '@patternfly/react-data-view';
import { useDispatch, useSelector } from 'react-redux';
import { RBACStore } from '../../../../../redux/store';
import { fetchUsers } from '../../../../../redux/users/actions';
import { ERROR } from '../../../../../redux/users/action-types';
import { mappedProps } from '../../../../../helpers/dataUtilities';
import { BulkSelect, BulkSelectValue, SkeletonTableBody, SkeletonTableHead } from '@patternfly/react-component-groups';
import { TableState } from './EditUserGroupUsersAndServiceAccounts';
import { FormattedMessage, useIntl } from 'react-intl';
import Messages from '../../../../../Messages';
import SearchIcon from '@patternfly/react-icons/dist/js/icons/search-icon';

const EmptyTable: React.FunctionComponent<{ titleText: string; subtitleText?: string }> = ({ titleText, subtitleText }) => {
  return (
    <tbody>
      <tr>
        <td colSpan={6}>
          <EmptyState>
            <EmptyStateHeader titleText={titleText} headingLevel="h4" icon={<EmptyStateIcon icon={SearchIcon} />} />
            <EmptyStateBody>
              {subtitleText ? (
                subtitleText
              ) : (
                <FormattedMessage
                  {...Messages['usersEmptyStateSubtitle']}
                  values={{
                    br: <br />,
                  }}
                />
              )}
            </EmptyStateBody>
          </EmptyState>
        </td>
      </tr>
    </tbody>
  );
};

interface EditGroupUsersTableProps {
  onChange: (userDiff: TableState) => void;
  groupId: string;
  initialUserIds: string[];
}

const PER_PAGE_OPTIONS = [
  { title: '5', value: 5 },
  { title: '10', value: 10 },
  { title: '20', value: 20 },
  { title: '50', value: 50 },
  { title: '100', value: 100 },
];

const EditGroupUsersTable: React.FunctionComponent<EditGroupUsersTableProps> = ({ onChange, groupId, initialUserIds }) => {
  const dispatch = useDispatch();
  const pagination = useDataViewPagination({ perPage: 20 });
  const { page, perPage, onSetPage, onPerPageSelect } = pagination;
  const [activeState, setActiveState] = useState<DataViewState | undefined>(DataViewState.loading);
  const intl = useIntl();

  const columns = useMemo(
    () => [
      intl.formatMessage(Messages.orgAdmin),
      intl.formatMessage(Messages.username),
      intl.formatMessage(Messages.email),
      intl.formatMessage(Messages.firstName),
      intl.formatMessage(Messages.lastName),
      intl.formatMessage(Messages.status),
    ],
    [intl],
  );

  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
  });
  const { selected, onSelect, isSelected } = selection;

  const { users, totalCount, isLoading, status } = useSelector((state: RBACStore) => ({
    users: state.userReducer?.users?.data || [],
    totalCount: state.userReducer?.users?.meta?.count,
    isLoading: state.userReducer?.isUserDataLoading,
    status: state.userReducer?.status,
  }));

  // Initialize selection when users are loaded
  useEffect(() => {
    if (users.length > 0 && initialUserIds.length > 0) {
      onSelect(false); // Clear any existing selections
      // Convert user IDs to usernames since rows use username as ID
      const initialSelectedUsers = initialUserIds
        .map((userId) => {
          const user = users.find((u) => u.id === userId || String(u.uuid) === userId);
          return user ? { id: user.username } : null;
        })
        .filter(Boolean);
      onSelect(true, initialSelectedUsers);
    }
  }, [users, initialUserIds]); // Don't include onSelect to avoid repeated calls

  const rows = useMemo(
    () =>
      users.map((user) => ({
        id: user.username,
        row: [
          user.is_org_admin ? intl.formatMessage(Messages.yes) : intl.formatMessage(Messages.no),
          user.username,
          user.email,
          user.first_name,
          user.last_name,
          user.is_active ? intl.formatMessage(Messages.active) : intl.formatMessage(Messages.inactive),
        ],
      })),
    [users, groupId],
  );

  const fetchData = useCallback(
    (apiProps: { count: number; limit: number; offset: number; orderBy: string }) => {
      const { count, limit, offset, orderBy } = apiProps;
      dispatch(fetchUsers({ ...mappedProps({ count, limit, offset, orderBy }), usesMetaInURL: true }));
    },
    [dispatch],
  );

  // Manage DataView state based on loading/error/data conditions
  useEffect(() => {
    if (isLoading) {
      setActiveState(DataViewState.loading);
    } else if (status === ERROR) {
      setActiveState(DataViewState.error);
    } else {
      setActiveState(users.length === 0 ? DataViewState.empty : undefined);
    }
  }, [users.length, isLoading, status]);

  useEffect(() => {
    fetchData({
      limit: perPage,
      offset: (page - 1) * perPage,
      orderBy: 'username',
      count: totalCount || 0,
    });
  }, [fetchData, page, perPage]);

  useEffect(() => {
    onChange({ initial: initialUserIds, updated: selection.selected.map((user) => user.id) });
  }, [selection.selected, initialUserIds]);

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
    <DataView selection={{ ...selection }} activeState={activeState}>
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
      <DataViewTable
        variant="compact"
        columns={columns}
        rows={rows}
        headStates={{
          loading: <SkeletonTableHead columns={columns} />,
        }}
        bodyStates={{
          loading: <SkeletonTableBody rowsCount={10} columnsCount={columns.length} />,
          empty: <EmptyTable titleText={intl.formatMessage(Messages.usersEmptyStateTitle)} />,
          error: (
            <EmptyTable titleText="Failed to load users" subtitleText="Please try refreshing the page or contact support if the problem persists." />
          ),
        }}
      />
    </DataView>
  );
};

// Component uses named export only
export { EditGroupUsersTable };
