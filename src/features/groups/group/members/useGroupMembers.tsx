import React, { useCallback, useContext, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDataViewFilters, useDataViewPagination, useDataViewSelection } from '@patternfly/react-data-view';
import { Label } from '@patternfly/react-core/dist/dynamic/components/Label';
import { Dropdown, DropdownItem, DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle, MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { EllipsisVIcon } from '@patternfly/react-icons/dist/dynamic/icons/ellipsis-v-icon';

import { defaultSettings } from '../../../../helpers/pagination';
import { fetchGroups, fetchMembersForGroup, removeMembersFromGroup } from '../../../../redux/groups/actions';
import { FetchMembersForGroupParams } from '../../../../redux/groups/helper';
import { Group } from '../../../../redux/groups/reducer';
import PermissionsContext from '../../../../utilities/permissionsContext';
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

// Member row actions component (moved from GroupMembers.tsx)
interface MemberRowActionsProps {
  member: Member;
  onRemoveMember: (member: Member) => void;
  ouiaId?: string;
}

const MemberRowActions: React.FC<MemberRowActionsProps> = ({ member, onRemoveMember, ouiaId }) => {
  const [isOpen, setIsOpen] = useState(false);
  const intl = useIntl();

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          aria-label="Kebab toggle"
          variant="plain"
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
          data-ouia-component-id={`${ouiaId}-menu-toggle`}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
      ouiaId={ouiaId}
    >
      <DropdownList>
        <DropdownItem
          key="remove"
          onClick={() => {
            setIsOpen(false);
            onRemoveMember(member);
          }}
          data-ouia-component-id={`${ouiaId}-remove`}
        >
          {intl.formatMessage(messages.remove)}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

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
    membersToRemove: Member[];
    title: React.ReactNode;
    text: React.ReactNode;
    confirmButtonLabel: string;
    onClose: () => void;
    onConfirm: () => void;
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

  // Local state for table functionality
  const [sortByState, setSortByState] = useState<SortByState>({
    index: isAdmin ? 1 : 0, // Account for selection column when admin
    direction: 'asc',
  });

  // State for remove modal
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [membersToRemove, setMembersToRemove] = useState<Member[]>([]);

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

  // Open remove modal (changed from direct removal)
  const handleRemoveMembers = useCallback((members: Member[]) => {
    setMembersToRemove(members);
    setIsRemoveModalOpen(true);
  }, []);

  // Close remove modal
  const handleCloseRemoveModal = useCallback(() => {
    setIsRemoveModalOpen(false);
    setMembersToRemove([]);
  }, []);

  // Confirm removal - actually perform the deletion
  const handleConfirmRemoveMembers = useCallback(async () => {
    if (!groupId || membersToRemove.length === 0) {
      return;
    }

    const usernames = membersToRemove.map((member) => member.username);

    try {
      await dispatch(removeMembersFromGroup(groupId, usernames));
      selection.onSelect(false); // Clear all selections
      setIsRemoveModalOpen(false);
      setMembersToRemove([]);
      // Reset offset to 0 after removal, fetchData will use current pagination from Redux
      fetchData(undefined, { offset: 0 });
      dispatch(fetchGroups({ usesMetaInURL: true }));
    } catch (error) {
      console.error('Failed to remove members from group:', error);
    }
  }, [dispatch, groupId, membersToRemove, selection, fetchData]);

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

      // Actions column with MemberRowActions component
      if (isAdmin && !adminDefault && !platformDefault) {
        baseRow.push(
          <MemberRowActions
            key={`actions-${member.username}`}
            member={member}
            onRemoveMember={(memberToRemove) => handleRemoveMembers([memberToRemove])}
            ouiaId={`member-actions-${member.username}`}
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

  // Remove modal state with proper singulár/plurál texts
  const removeModalState = useMemo(() => {
    const isSingular = membersToRemove.length === 1;
    const memberNames = membersToRemove.map((member) => member.username).join(', ');

    return {
      isOpen: isRemoveModalOpen,
      membersToRemove,
      title: intl.formatMessage(isSingular ? messages.removeMemberQuestion : messages.removeMembersQuestion),
      text: isSingular ? (
        <FormattedMessage
          {...messages.removeMemberText}
          values={{
            b: (text: React.ReactNode) => <b>{text}</b>,
            name: memberNames,
            group: group?.name || '',
          }}
        />
      ) : (
        <FormattedMessage
          {...messages.removeMembersText}
          values={{
            b: (text: React.ReactNode) => <b>{text}</b>,
            name: membersToRemove.length,
            group: group?.name || '',
          }}
        />
      ),
      confirmButtonLabel: intl.formatMessage(isSingular ? messages.removeMember : messages.remove),
      onClose: handleCloseRemoveModal,
      onConfirm: handleConfirmRemoveMembers,
    };
  }, [isRemoveModalOpen, membersToRemove, intl, group?.name, handleCloseRemoveModal, handleConfirmRemoveMembers]);

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
