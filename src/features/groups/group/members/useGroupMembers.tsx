import React, { useCallback, useContext, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { useDataViewFilters, useDataViewPagination, useDataViewSelection } from '@patternfly/react-data-view';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';

import { ActionDropdown } from '../../../../components/ActionDropdown';
import { defaultSettings } from '../../../../helpers/pagination';
import { fetchGroups, fetchMembersForGroup, removeMembersFromGroup } from '../../../../redux/groups/actions';
import { FetchMembersForGroupParams } from '../../../../redux/groups/helper';
import { Group } from '../../../../redux/groups/reducer';
import PermissionsContext from '../../../../utilities/permissionsContext';
import { useGroupRemoveModal } from '../../hooks/useGroupRemoveModal';
import messages from '../../../../Messages';
import type { GroupMembersFilters, Member, MemberTableRow, SortByState } from './types';
import {
  selectGroupMembers,
  selectGroupMembersMeta,
  selectIsAdminDefaultGroup,
  selectIsChangedDefaultGroup,
  selectIsGroupMembersLoading,
  selectIsPlatformDefaultGroup,
  selectSelectedGroup,
  selectSystemGroupUUID,
} from '../../../../redux/groups/selectors';

export interface UseGroupMembersOptions {
  /** Whether to enable admin functionality */
  enableAdminFeatures?: boolean;
}

export interface UseGroupMembersReturn {
  // Data
  members: Member[];
  isLoading: boolean;
  group: Group | undefined;
  adminDefault: boolean;
  platformDefault: boolean;
  isChanged: boolean;
  systemGroupUuid: string | undefined;
  pagination: ReturnType<typeof useDataViewPagination>;
  totalCount: number;

  // Permissions
  isAdmin: boolean;

  // Filters and selection
  filters: ReturnType<typeof useDataViewFilters<GroupMembersFilters>>;
  selection: ReturnType<typeof useDataViewSelection>;
  hasActiveFilters: boolean;

  // Sorting
  sortByState: SortByState;
  setSortByState: (state: SortByState) => void;

  // Table data
  tableRows: MemberTableRow[];
  columns: Array<{ cell: string }>;

  // Actions
  fetchData: (usernameFilter?: string, apiProps?: FetchMembersForGroupParams) => void;
  handleRemoveMembers: (membersToRemove: Member[]) => void;

  // Computed values
  emptyStateProps: {
    colSpan: number;
    hasActiveFilters: boolean;
  };

  // Remove modal state
  removeModalState: {
    isOpen: boolean;
    title: string;
    text: React.ReactNode;
    confirmButtonLabel: string;
    onClose: () => void;
    onConfirm: () => Promise<void>;
  };
}

/**
 * Custom hook for managing GroupMembers business logic
 */
export const useGroupMembers = (options: UseGroupMembersOptions = {}): UseGroupMembersReturn => {
  const { enableAdminFeatures = true } = options;

  const intl = useIntl();
  const dispatch = useDispatch();
  const { groupId } = useParams<{ groupId: string }>();
  const addNotification = useAddNotification();

  // Get permissions from context (not Redux)
  const { orgAdmin, userAccessAdministrator } = useContext(PermissionsContext);

  // DataView filters for consistent filter management
  const filters = useDataViewFilters({
    initialFilters: {
      name: '',
    },
  });

  // DataView selection for consistent selection management
  const selection = useDataViewSelection({
    matchOption: (a, b) => a.id === b.id,
  });

  // DataView pagination for consistent pagination management
  const pagination = useDataViewPagination({
    perPage: 20,
  });

  // Calculate admin status from permissions context
  const isAdmin = enableAdminFeatures && (orgAdmin || userAccessAdministrator);

  // Use shared memoized selectors to prevent infinite re-renders
  const members = useSelector(selectGroupMembers);
  const reduxPagination = useSelector(selectGroupMembersMeta);
  const totalCount = reduxPagination.count || 0;
  const isLoading = useSelector(selectIsGroupMembersLoading);
  const group = useSelector(selectSelectedGroup);
  const adminDefault = useSelector(selectIsAdminDefaultGroup);
  const platformDefault = useSelector(selectIsPlatformDefaultGroup);
  const isChanged = useSelector(selectIsChangedDefaultGroup);
  const systemGroupUuid = useSelector(selectSystemGroupUUID);

  // Local state for table functionality
  const [sortByState, setSortByState] = useState<SortByState>({
    index: isAdmin ? 1 : 0, // Account for selection column when admin
    direction: 'asc',
  });

  // Calculate if there are active filters
  const hasActiveFilters = useMemo(() => {
    return Object.values(filters.filters).some((value) => value && value.trim() !== '');
  }, [filters.filters]);

  // Define table columns
  const columns = useMemo(() => {
    const baseColumns = [
      { cell: intl.formatMessage(messages.status) },
      { cell: intl.formatMessage(messages.username) },
      { cell: intl.formatMessage(messages.email) },
      { cell: intl.formatMessage(messages.lastName) },
      { cell: intl.formatMessage(messages.firstName) },
    ];

    if (isAdmin) {
      baseColumns.push({ cell: '' }); // Actions column
    }

    return baseColumns;
  }, [intl, isAdmin]);

  // Fetch data function (defined early to avoid dependency issues)
  const fetchData = useCallback(
    (usernameFilter?: string, apiProps: FetchMembersForGroupParams = {}) => {
      if (!groupId) return;

      const options: FetchMembersForGroupParams = {
        ...defaultSettings,
        limit: pagination.perPage,
        offset: (pagination.page - 1) * pagination.perPage,
        ...apiProps,
      };

      dispatch(fetchMembersForGroup(groupId, usernameFilter, options));
    },
    [dispatch, groupId], // REMOVED pagination dependency to prevent infinite loops
  );

  // Track members to remove (needed for the confirm callback)
  const membersToRemoveRef = useRef<Member[]>([]);

  // Remove modal with simple API
  const removeModal = useGroupRemoveModal({
    itemType: 'member',
    groupName: group?.name || '',
    onConfirm: async () => {
      if (!groupId) return;

      const usernames = membersToRemoveRef.current.map((m) => m.username);
      await dispatch(removeMembersFromGroup(groupId, usernames));
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.removeGroupMembersSuccessTitle),
        description: intl.formatMessage(messages.removeGroupMembersSuccessDescription),
        dismissable: true,
      });
      selection.onSelect(false);
      fetchData(undefined, { offset: 0 });
      dispatch(fetchGroups({ usesMetaInURL: true }));
    },
  });

  // Helper to open modal with members
  const handleRemoveMembers = useCallback(
    (members: Member[]) => {
      membersToRemoveRef.current = members;
      removeModal.openModal(members.map((m) => m.username));
    },
    [removeModal],
  );

  const removeModalState = removeModal.modalState;

  // Create table rows from members data
  const tableRows = useMemo((): MemberTableRow[] => {
    return members.map((member: Member) => {
      const baseRow = [
        // Status indicator with proper Label component
        <Label key={member.username} color={member.is_active ? 'green' : 'grey'}>
          {intl.formatMessage(member.is_active ? messages.active : messages.inactive)}
        </Label>,
        member.username,
        member.email,
        member.last_name,
        member.first_name,
      ];

      // Actions column with ActionDropdown component
      if (isAdmin && !adminDefault && !platformDefault) {
        baseRow.push(
          <ActionDropdown
            key={`actions-${member.username}`}
            ariaLabel={`Actions for ${member.username}`}
            ouiaId={`member-actions-${member.username}`}
            items={[
              {
                key: 'remove',
                label: intl.formatMessage(messages.remove),
                onClick: () => handleRemoveMembers([member]),
                ouiaId: `member-actions-${member.username}-remove`,
              },
            ]}
          />,
        );
      } else if (isAdmin) {
        baseRow.push(''); // Empty cell for default groups (no actions allowed)
      }

      return {
        id: member.username,
        row: baseRow,
        member,
      };
    });
  }, [members, intl, isAdmin, handleRemoveMembers, adminDefault, platformDefault]);

  // Empty state properties
  const emptyStateProps = useMemo(
    () => ({
      colSpan: columns.length,
      hasActiveFilters,
    }),
    [columns.length, hasActiveFilters],
  );

  return {
    // Data
    members,
    isLoading,
    group: group as Group | undefined, // Cast to Group for compatibility with hook interface
    adminDefault,
    platformDefault,
    isChanged,
    systemGroupUuid,
    pagination,
    totalCount,

    // Permissions
    isAdmin,

    // Filters and selection
    filters,
    selection,
    hasActiveFilters,

    // Sorting
    sortByState,
    setSortByState,

    // Table data
    tableRows,
    columns,

    // Actions
    fetchData,
    handleRemoveMembers,

    // Computed values
    emptyStateProps,
    removeModalState,
  };
};
