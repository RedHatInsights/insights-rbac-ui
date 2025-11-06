import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { useIntl } from 'react-intl';
import { FormattedMessage } from 'react-intl';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Dropdown } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownItem } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { DropdownList } from '@patternfly/react-core/dist/dynamic/components/Dropdown';
import { MenuToggle } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import { MenuToggleElement } from '@patternfly/react-core/dist/dynamic/components/MenuToggle';
import EllipsisVIcon from '@patternfly/react-icons/dist/js/icons/ellipsis-v-icon';
import { useDataViewFilters, useDataViewSelection } from '@patternfly/react-data-view';
import { fetchAddRolesForGroup, fetchRolesForGroup, removeRolesFromGroup } from '../../../../../redux/groups/actions';
import {
  selectGroupRoles,
  selectGroupRolesMeta,
  selectIsAdminDefaultGroup,
  selectIsChangedDefaultGroup,
  selectIsGroupRolesLoading,
  selectIsPlatformDefaultGroup,
  selectSelectedGroup,
  selectShouldDisableAddRoles,
  selectSystemGroupUUID,
} from '../../../../../redux/groups/selectors';
import PermissionsContext from '../../../../../utilities/permissionsContext';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../../../utilities/constants';
import messages from '../../../../../Messages';
import pathnames from '../../../../../utilities/pathnames';
import useAppNavigate from '../../../../../hooks/useAppNavigate';
import type { GroupRolesProps } from '../types';
import type { RoleWithAccess as Role } from '@redhat-cloud-services/rbac-client/types';

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
  systemGroupUuid: string | undefined;

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

  // Remove modal state
  removeModalState: {
    isOpen: boolean;
    rolesToRemove: Role[];
    title: React.ReactNode;
    text: React.ReactNode;
    confirmButtonLabel: string;
    onClose: () => void;
    onConfirm: () => void;
  };
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

export const useGroupRoles = (props: GroupRolesProps): UseGroupRolesReturn => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const { userAccessAdministrator, orgAdmin } = useContext(PermissionsContext);
  const hasPermissions = orgAdmin || userAccessAdministrator;

  // Redux selectors - using memoized selectors to prevent unnecessary re-renders
  const roles = useSelector(selectGroupRoles);
  const pagination = useSelector(selectGroupRolesMeta);
  const isLoading = useSelector(selectIsGroupRolesLoading);
  const isPlatformDefault = useSelector(selectIsPlatformDefaultGroup);
  const isAdminDefault = useSelector(selectIsAdminDefaultGroup);
  const isChanged = useSelector(selectIsChangedDefaultGroup);
  const disableAddRoles = useSelector(selectShouldDisableAddRoles);
  const systemGroupUuid = useSelector(selectSystemGroupUUID);
  const group = useSelector(selectSelectedGroup);

  // State for remove modal
  const [isRemoveModalOpen, setIsRemoveModalOpen] = useState(false);
  const [rolesToRemove, setRolesToRemove] = useState<Role[]>([]);

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

  // Fetch available roles for "Add Roles" button (roles not already in group)
  useEffect(() => {
    const actualGroupId = groupId !== DEFAULT_ACCESS_GROUP_ID ? groupId! : systemGroupUuid;
    if (actualGroupId) {
      dispatch(fetchAddRolesForGroup(actualGroupId, { limit: 20, offset: 0 }));
    }
  }, [dispatch, groupId, systemGroupUuid]);

  // Handle default group changes
  useEffect(() => {
    if (isChanged && props.onDefaultGroupChanged && group) {
      props.onDefaultGroupChanged({ uuid: group.uuid, name: group.name });
    }
  }, [isChanged, group, props.onDefaultGroupChanged]);

  // Open remove modal for selected roles
  const handleRemoveSelectedRoles = useCallback(() => {
    if (!selection.selected || selection.selected.length === 0) {
      return;
    }

    const selectedRoleItems = selection.selected.map((item) => roles.find((role) => role.uuid === item.id)).filter(Boolean) as Role[];
    setRolesToRemove(selectedRoleItems);
    setIsRemoveModalOpen(true);
  }, [selection, roles]);

  // Open remove modal for individual role
  const handleRemoveRole = useCallback((role: Role) => {
    setRolesToRemove([role]);
    setIsRemoveModalOpen(true);
  }, []);

  // Close remove modal
  const handleCloseRemoveModal = useCallback(() => {
    setIsRemoveModalOpen(false);
    setRolesToRemove([]);
  }, []);

  // Confirm removal - actually perform the deletion
  const handleConfirmRemoveRoles = useCallback(async () => {
    try {
      if (rolesToRemove.length === 0) {
        return;
      }

      const roleIds = rolesToRemove.map(({ uuid }) => uuid);

      await dispatch(removeRolesFromGroup(groupId!, roleIds));
      selection.onSelect(false); // Clear selection
      setIsRemoveModalOpen(false);
      setRolesToRemove([]);
      // Refresh the data to reflect the change
      fetchData();
    } catch (error) {
      console.error('Failed to remove roles from group:', error);
    }
  }, [dispatch, groupId, rolesToRemove, selection, fetchData]);

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

  // Remove modal state with proper singulár/plurál texts
  const removeModalState = useMemo(() => {
    const isSingular = rolesToRemove.length === 1;
    const roleNames = rolesToRemove.map((role) => role.display_name || role.name).join(', ');

    return {
      isOpen: isRemoveModalOpen,
      rolesToRemove,
      title: intl.formatMessage(isSingular ? messages.removeRoleQuestion : messages.removeRolesQuestion),
      text: isSingular ? (
        <FormattedMessage
          {...messages.removeRoleModalText}
          values={{
            b: (text: React.ReactNode) => <b>{text}</b>,
            name: group?.name || '',
            role: roleNames,
          }}
        />
      ) : (
        <FormattedMessage
          {...messages.removeRolesModalText}
          values={{
            b: (text: React.ReactNode) => <b>{text}</b>,
            name: group?.name || '',
            roles: rolesToRemove.length,
          }}
        />
      ),
      confirmButtonLabel: intl.formatMessage(isSingular ? messages.removeRole : messages.removeRoles),
      onClose: handleCloseRemoveModal,
      onConfirm: handleConfirmRemoveRoles,
    };
  }, [isRemoveModalOpen, rolesToRemove, intl, group?.name, handleCloseRemoveModal, handleConfirmRemoveRoles]);

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
    systemGroupUuid,
    fetchData,
    handleRemoveSelectedRoles,
    actionResolver,
    toolbarButtons,
    emptyStateProps,
    onDefaultGroupChanged: props.onDefaultGroupChanged,
    removeModalState,
  };
};
