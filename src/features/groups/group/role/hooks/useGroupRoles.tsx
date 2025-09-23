import React, { useCallback, useContext, useEffect, useMemo } from 'react';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Dropdown } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownItem } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import EllipsisVIcon from '@patternfly/react-icons/dist/js/icons/ellipsis-v-icon';
import { useDataViewFilters, useDataViewSelection } from '@patternfly/react-data-view';
import { defaultSettings } from '../../../../../helpers/pagination';
import { fetchRolesForGroup, removeRolesFromGroup } from '../../../../../redux/groups/actions';
import PermissionsContext from '../../../../../utilities/permissionsContext';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../../../utilities/constants';
import messages from '../../../../../Messages';
import pathnames from '../../../../../utilities/pathnames';
import useAppNavigate from '../../../../../hooks/useAppNavigate';
import type { GroupRolesProps } from '../types';
import type { RoleWithAccess as Role } from '@redhat-cloud-services/rbac-client/types';
import type { RBACStore } from '../../../../../redux/store.d';

// Types
interface GroupRoleTableRow {
  id: string;
  row: [React.ReactElement, string, React.ReactElement, React.ReactElement];
  item: Role;
}

interface GroupRoleFilters {
  name: string;
}

// Hook return interface
export interface UseGroupRolesReturn {
  // Core data
  roles: Role[];
  isLoading: boolean;
  pagination: any;

  // DataView hooks
  filters: ReturnType<typeof useDataViewFilters<GroupRoleFilters>>;
  selection: ReturnType<typeof useDataViewSelection>;

  // Computed values
  tableRows: GroupRoleTableRow[];
  columns: Array<{ cell: string }>;
  hasActiveFilters: boolean;

  // Permission states
  hasPermissions: boolean;
  isPlatformDefault: boolean;
  isAdminDefault: boolean;
  isChanged: boolean;
  disableAddRoles: boolean;

  // Group data
  group: any;
  groupId: string | undefined;

  // Actions
  fetchData: (apiProps?: Record<string, unknown>) => void;
  handleRemoveSelectedRoles: () => void;

  // Action resolvers
  actionResolver: (role: Role) => Array<{ title: string; onClick: () => void }>;
  toolbarButtons: React.ReactElement[];

  // Empty state props
  emptyStateProps: {
    colSpan: number;
    hasActiveFilters: boolean;
    title: string;
    description: string;
  };

  // Callbacks for parent
  onDefaultGroupChanged?: GroupRolesProps['onDefaultGroupChanged'];
}

const generateOuiaID = (name: string) => {
  // given a group name, generate an OUIA ID for the 'Add role' button
  return name.toLowerCase().includes('default access') ? 'dag-add-role-button' : 'add-role-button';
};

// Role row actions component
interface GroupRoleActionsProps {
  role: Role;
  onRemove: (role: Role) => void;
  hasPermissions: boolean;
  isAdminDefault: boolean;
  ouiaId?: string;
}

const GroupRoleActions: React.FC<GroupRoleActionsProps> = ({ role, onRemove, hasPermissions, isAdminDefault, ouiaId }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const intl = useIntl();

  // Don't show actions if no permissions or admin default group
  if (!hasPermissions || isAdminDefault) {
    return null;
  }

  return (
    <Dropdown
      isOpen={isOpen}
      onOpenChange={setIsOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => (
        <MenuToggle
          ref={toggleRef}
          aria-label={`Actions for role ${role.display_name || role.name}`}
          variant="plain"
          onClick={() => setIsOpen(!isOpen)}
          isExpanded={isOpen}
        >
          <EllipsisVIcon />
        </MenuToggle>
      )}
      ouiaId={ouiaId}
    >
      <DropdownList>
        <DropdownItem key="remove" onClick={() => onRemove(role)}>
          {intl.formatMessage(messages.remove)}
        </DropdownItem>
      </DropdownList>
    </Dropdown>
  );
};

const reducer = ({ groupReducer }: RBACStore) => {
  const { selectedGroup, systemGroup, groups } = groupReducer;
  return {
    roles: selectedGroup?.roles?.data || [],
    pagination: { ...defaultSettings, ...((selectedGroup?.roles as any)?.meta || {}) },
    groupsPagination: groups?.pagination || groups?.meta,
    groupsFilters: groups?.filters,
    isLoading: selectedGroup?.roles?.isLoading || false,
    isPlatformDefault: selectedGroup?.platform_default || false,
    isAdminDefault: selectedGroup?.admin_default || false,
    isChanged: Boolean((selectedGroup?.admin_default || selectedGroup?.platform_default) && !selectedGroup?.system),
    disableAddRoles:
      /**
       * First validate if the pagination object exists and is not empty.
       * If empty or undefined, the disable condition will be always true
       */
      Object.keys(selectedGroup?.addRoles?.pagination || {}).length > 0
        ? !(selectedGroup?.addRoles?.pagination && (selectedGroup?.addRoles?.pagination?.count || 0) > 0) || !!selectedGroup?.admin_default
        : !!selectedGroup?.admin_default,
    systemGroupUuid: systemGroup?.uuid,
    group: selectedGroup,
  };
};

export const useGroupRoles = (props: GroupRolesProps): UseGroupRolesReturn => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);
  const hasPermissions = orgAdmin || userAccessAdministrator;

  // Redux selectors
  const { roles, pagination, isLoading, isPlatformDefault, isAdminDefault, isChanged, disableAddRoles, systemGroupUuid, group } = useSelector(
    reducer,
    shallowEqual,
  );

  // DataView hooks
  const filters = useDataViewFilters<GroupRoleFilters>({
    initialFilters: { name: '' },
  });

  const selection = useDataViewSelection({
    matchOption: (a: { id: string }, b: { id: string }) => a.id === b.id,
  });

  // Fetch roles for group
  const fetchGroupRoles = useCallback(
    (groupId: string, options: Record<string, unknown>) => dispatch(fetchRolesForGroup(groupId, options)),
    [dispatch],
  );

  const fetchData = useCallback(
    (apiProps: Record<string, unknown> = {}) => {
      const actualGroupId = groupId !== DEFAULT_ACCESS_GROUP_ID ? groupId! : systemGroupUuid;
      if (actualGroupId) {
        fetchGroupRoles(actualGroupId, {
          limit: 50,
          offset: 0,
          orderBy: 'display_name',
          ...pagination,
          ...apiProps,
        });
      }
    },
    [fetchGroupRoles, groupId, pagination, systemGroupUuid],
  );

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, [systemGroupUuid]);

  // Handle default group changes
  useEffect(() => {
    if (isChanged && props.onDefaultGroupChanged && group) {
      props.onDefaultGroupChanged({ uuid: group.uuid, name: group.name });
    }
  }, [isChanged, group, props.onDefaultGroupChanged]);

  // Handle remove selected roles
  const handleRemoveSelectedRoles = useCallback(async () => {
    try {
      if (!selection.selected || selection.selected.length === 0) {
        return;
      }

      const selectedRoleItems = selection.selected.map((item) => roles.find((role) => role.uuid === item.id)).filter(Boolean) as Role[];
      const roleIds = selectedRoleItems.map(({ uuid }) => uuid);

      await dispatch(removeRolesFromGroup(groupId!, roleIds));
      selection.onSelect(false); // Clear selection
      // Refresh the data to reflect the change
      fetchData();
    } catch (error) {
      console.error('Failed to remove roles from group:', error);
    }
  }, [dispatch, groupId, selection, roles, fetchData]);

  // Handle individual role removal
  const handleRemoveRole = useCallback(
    async (role: Role) => {
      try {
        // Remove this single role from the group
        await dispatch(removeRolesFromGroup(groupId!, [role.uuid]));
        // Refresh the data to reflect the change
        fetchData();
      } catch (error) {
        console.error('Failed to remove role from group:', error);
      }
    },
    [dispatch, groupId, fetchData],
  );

  // Action resolver for table rows
  const actionResolver = useCallback(
    (role: Role) => [
      ...(hasPermissions && !isAdminDefault
        ? [
            {
              title: intl.formatMessage(messages.remove),
              onClick: () => handleRemoveRole(role),
            },
          ]
        : []),
    ],
    [hasPermissions, isAdminDefault, intl, handleRemoveRole],
  );

  // Table rows with JSX elements
  const tableRows = useMemo((): GroupRoleTableRow[] => {
    return roles.map(
      (role): GroupRoleTableRow => ({
        id: role.uuid,
        row: [
          // Role name with link
          <div key={`${role.uuid}-name`}>
            <a
              href={pathnames['group-detail-role-detail'].link.replace(':groupId', groupId!).replace(':roleId', role.uuid)}
              onClick={(e: React.MouseEvent) => {
                e.preventDefault();
                navigate(pathnames['group-detail-role-detail'].link.replace(':groupId', groupId!).replace(':roleId', role.uuid));
              }}
            >
              {role.display_name || role.name}
            </a>
          </div>,
          // Description
          role.description || '',
          // Modified date
          <div key={`${role.uuid}-modified`}>{new Date(role.modified || '').toLocaleDateString()}</div>,
          // Actions
          <GroupRoleActions
            key={`${role.uuid}-actions`}
            role={role}
            onRemove={handleRemoveRole}
            hasPermissions={hasPermissions}
            isAdminDefault={isAdminDefault}
            ouiaId={`group-roles-table-${role.uuid}-actions`}
          />,
        ],
        item: role,
      }),
    );
  }, [roles, groupId, navigate, handleRemoveRole, hasPermissions, isAdminDefault]);

  // Column definitions
  const columns = useMemo(
    () => [
      { cell: intl.formatMessage(messages.name) },
      { cell: intl.formatMessage(messages.description) },
      { cell: intl.formatMessage(messages.lastModified) },
      { cell: 'Actions' },
    ],
    [intl],
  );

  // Toolbar actions dropdown
  const [isDropdownOpen, setIsDropdownOpen] = React.useState(false);

  const toolbarButtons = useMemo(() => {
    if (!hasPermissions || isAdminDefault) {
      return [];
    }

    const actions = [];

    // Always show Add Role button
    actions.push(
      <Button
        key="add-roles"
        variant="primary"
        ouiaId={generateOuiaID(group?.name || '')}
        isDisabled={disableAddRoles}
        onClick={() => navigate(pathnames['group-add-roles'].link.replace(':groupId', groupId!))}
      >
        {intl.formatMessage(messages.addRole)}
      </Button>,
    );

    // Show bulk actions dropdown when roles are selected
    if (selection.selected && selection.selected.length > 0) {
      actions.push(
        <Dropdown
          key="bulk-actions"
          isOpen={isDropdownOpen}
          onSelect={() => setIsDropdownOpen(false)}
          onOpenChange={setIsDropdownOpen}
          toggle={(toggleRef) => (
            <MenuToggle ref={toggleRef} aria-label="bulk actions toggle" variant="plain" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              <EllipsisVIcon />
            </MenuToggle>
          )}
          shouldFocusToggleOnSelect
        >
          <DropdownList>
            <DropdownItem
              key="remove"
              onClick={() => {
                handleRemoveSelectedRoles();
                setIsDropdownOpen(false);
              }}
            >
              {intl.formatMessage(messages.remove)}
            </DropdownItem>
          </DropdownList>
        </Dropdown>,
      );
    }

    return actions;
  }, [
    hasPermissions,
    isAdminDefault,
    groupId,
    group?.name,
    disableAddRoles,
    selection.selected?.length,
    intl,
    navigate,
    handleRemoveSelectedRoles,
    isDropdownOpen,
  ]);

  // Computed values
  const hasActiveFilters = Object.values(filters.filters).some((value) => value !== '');

  // Empty state props
  const emptyStateProps = {
    colSpan: columns.length,
    hasActiveFilters,
    title: intl.formatMessage(messages.noGroupRoles),
    description: intl.formatMessage(isPlatformDefault ? messages.contactServiceTeamForRoles : messages.addRoleToThisGroup),
  };

  return {
    roles,
    isLoading,
    pagination,
    filters,
    selection,
    tableRows,
    columns,
    hasActiveFilters,
    hasPermissions,
    isPlatformDefault,
    isAdminDefault,
    isChanged,
    disableAddRoles,
    group,
    groupId,
    fetchData,
    handleRemoveSelectedRoles,
    actionResolver,
    toolbarButtons,
    emptyStateProps,
    onDefaultGroupChanged: props.onDefaultGroupChanged,
  };
};
