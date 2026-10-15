import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useNavigate, useParams } from 'react-router-dom';
import type { QueryClient } from '@tanstack/react-query';
import { colors, useInputFocus, useStatus } from '../layouts/AppLayout.js';
import { ConfirmDialog, DetailField, EntityForm, ErrorMessage, Loading, TabBar } from '../components/shared/index.js';
import {
  useAddMembersToGroupMutation,
  useAddRolesToGroupMutation,
  useDeleteGroupMutation,
  useGroupMembersQuery,
  useGroupQuery,
  useGroupRolesQuery,
  useRemoveMembersFromGroupMutation,
  useRemoveRolesFromGroupMutation,
  useRolesQuery,
  useUpdateGroupMutation,
  useUsersQuery,
} from '../queries.js';

interface GroupDetailProps {
  queryClient: QueryClient;
}

type Mode = 'browse' | 'edit' | 'confirm-delete' | 'add-members' | 'remove-member' | 'add-roles' | 'remove-role';
type Tab = 'info' | 'members' | 'roles';

const TABS: Tab[] = ['info', 'members', 'roles'];
const TAB_LABELS = ['Info', 'Members', 'Roles'];

export function GroupDetail({ queryClient }: GroupDetailProps): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setStatus } = useStatus();

  // State
  const [mode, setMode] = useState<Mode>('browse');
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [formFields, setFormFields] = useState({ name: '', description: '' });
  const [selectedMemberIndex, setSelectedMemberIndex] = useState(0);
  const [selectedRoleIndex, setSelectedRoleIndex] = useState(0);
  const [selectedItemToRemove, setSelectedItemToRemove] = useState<string | null>(null);

  // Disable global hotkeys when in text input mode
  const { setInputFocused } = useInputFocus();
  useEffect(() => {
    setInputFocused(mode === 'edit');
    return () => setInputFocused(false);
  }, [mode, setInputFocused]);

  // Queries
  const groupQuery = useGroupQuery(id!, { queryClient });
  const membersQuery = useGroupMembersQuery(id!, {}, { queryClient, enabled: activeTab === 'members' || mode === 'add-members' });
  const rolesQuery = useGroupRolesQuery(id!, {}, { queryClient, enabled: activeTab === 'roles' || mode === 'add-roles' });
  const group = groupQuery.data;

  // Available users/roles for adding
  const availableUsersQuery = useUsersQuery({ limit: 100 }, { queryClient, enabled: mode === 'add-members' });
  const availableRolesQuery = useRolesQuery({ limit: 100 }, { queryClient, enabled: mode === 'add-roles' });

  // Mutations
  const deleteGroup = useDeleteGroupMutation({ queryClient });
  const updateGroup = useUpdateGroupMutation({ queryClient });
  const addMembers = useAddMembersToGroupMutation({ queryClient });
  const removeMembers = useRemoveMembersFromGroupMutation({ queryClient });
  const addRoles = useAddRolesToGroupMutation({ queryClient });
  const removeRoles = useRemoveRolesFromGroupMutation({ queryClient });

  // Filter out already-assigned members/roles
  const currentMemberUsernames = useMemo(() => new Set(membersQuery.data?.members?.map((m) => m.username) ?? []), [membersQuery.data]);
  const currentRoleUuids = useMemo(() => new Set(rolesQuery.data?.roles?.map((r) => r.uuid) ?? []), [rolesQuery.data]);

  const availableUsers = useMemo(
    () => (availableUsersQuery.data?.users ?? []).filter((u) => !currentMemberUsernames.has(u.username)),
    [availableUsersQuery.data, currentMemberUsernames],
  );
  const availableRoles = useMemo(
    () => (availableRolesQuery.data?.data ?? []).filter((r) => !currentRoleUuids.has(r.uuid)),
    [availableRolesQuery.data, currentRoleUuids],
  );

  const isSystemGroup = group?.system || group?.platform_default || group?.admin_default;

  // Handlers
  const handleEdit = useCallback(async () => {
    if (!id || !formFields.name.trim()) {
      setStatus({ message: 'Name is required', type: 'error' });
      return;
    }
    try {
      await updateGroup.mutateAsync({
        uuid: id,
        name: formFields.name,
        description: formFields.description,
      });
      setStatus({ message: 'Group updated successfully', type: 'success' });
      setMode('browse');
    } catch (err) {
      setStatus({ message: `Failed to update: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    }
  }, [id, formFields, updateGroup, setStatus]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await deleteGroup.mutateAsync(id);
      setStatus({ message: 'Group deleted successfully', type: 'success' });
      navigate('/groups');
    } catch (err) {
      setStatus({ message: `Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
      setMode('browse');
    }
  }, [id, deleteGroup, setStatus, navigate]);

  const handleAddMember = useCallback(
    async (username: string) => {
      if (!id) return;
      try {
        await addMembers.mutateAsync({ groupId: id, usernames: [username] });
        setStatus({ message: `Added ${username} to group`, type: 'success' });
        setMode('browse');
        membersQuery.refetch();
      } catch (err) {
        setStatus({ message: `Failed to add member: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
      }
    },
    [id, addMembers, setStatus, membersQuery],
  );

  const handleRemoveMember = useCallback(async () => {
    if (!id || !selectedItemToRemove) return;
    try {
      await removeMembers.mutateAsync({ groupId: id, usernames: [selectedItemToRemove] });
      setStatus({ message: `Removed member from group`, type: 'success' });
      setMode('browse');
      setSelectedItemToRemove(null);
      membersQuery.refetch();
    } catch (err) {
      setStatus({ message: `Failed to remove member: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    }
  }, [id, selectedItemToRemove, removeMembers, setStatus, membersQuery]);

  const handleAddRole = useCallback(
    async (roleUuid: string) => {
      if (!id) return;
      try {
        await addRoles.mutateAsync({ groupId: id, roleUuids: [roleUuid] });
        setStatus({ message: `Added role to group`, type: 'success' });
        setMode('browse');
        rolesQuery.refetch();
      } catch (err) {
        setStatus({ message: `Failed to add role: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
      }
    },
    [id, addRoles, setStatus, rolesQuery],
  );

  const handleRemoveRole = useCallback(async () => {
    if (!id || !selectedItemToRemove) return;
    try {
      await removeRoles.mutateAsync({ groupId: id, roleUuids: [selectedItemToRemove] });
      setStatus({ message: `Removed role from group`, type: 'success' });
      setMode('browse');
      setSelectedItemToRemove(null);
      rolesQuery.refetch();
    } catch (err) {
      setStatus({ message: `Failed to remove role: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    }
  }, [id, selectedItemToRemove, removeRoles, setStatus, rolesQuery]);

  // Input handling
  useInput((input, key) => {
    // Handle modal/dialog modes
    if (mode === 'edit') return;
    if (mode === 'confirm-delete' || mode === 'remove-member' || mode === 'remove-role') return;

    // Add members selection mode
    if (mode === 'add-members') {
      if (key.escape) {
        setMode('browse');
      } else if (key.upArrow) {
        setSelectedMemberIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedMemberIndex((prev) => Math.min(availableUsers.length - 1, prev + 1));
      } else if (key.return && availableUsers[selectedMemberIndex]) {
        handleAddMember(availableUsers[selectedMemberIndex].username);
      }
      return;
    }

    // Add roles selection mode
    if (mode === 'add-roles') {
      if (key.escape) {
        setMode('browse');
      } else if (key.upArrow) {
        setSelectedRoleIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedRoleIndex((prev) => Math.min(availableRoles.length - 1, prev + 1));
      } else if (key.return && availableRoles[selectedRoleIndex]) {
        handleAddRole(availableRoles[selectedRoleIndex].uuid);
      }
      return;
    }

    // Tab switching
    if (input >= '1' && input <= String(TABS.length)) {
      const tabIndex = parseInt(input) - 1;
      setActiveTab(TABS[tabIndex]);
      setSelectedMemberIndex(0);
      setSelectedRoleIndex(0);
      return;
    }

    // Navigate within members/roles lists
    if (activeTab === 'members') {
      const membersList = membersQuery.data?.members ?? [];
      if (key.upArrow) {
        setSelectedMemberIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedMemberIndex((prev) => Math.min(membersList.length - 1, prev + 1));
      } else if (input.toLowerCase() === 'a' && !isSystemGroup) {
        setSelectedMemberIndex(0);
        setMode('add-members');
      } else if (input.toLowerCase() === 'x' && membersList[selectedMemberIndex] && !isSystemGroup) {
        setSelectedItemToRemove(membersList[selectedMemberIndex].username);
        setMode('remove-member');
      }
    } else if (activeTab === 'roles') {
      const rolesList = rolesQuery.data?.roles ?? [];
      if (key.upArrow) {
        setSelectedRoleIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedRoleIndex((prev) => Math.min(rolesList.length - 1, prev + 1));
      } else if (input.toLowerCase() === 'a' && !isSystemGroup) {
        setSelectedRoleIndex(0);
        setMode('add-roles');
      } else if (input.toLowerCase() === 'x' && rolesList[selectedRoleIndex] && !isSystemGroup) {
        setSelectedItemToRemove(rolesList[selectedRoleIndex].uuid);
        setMode('remove-role');
      }
    }

    // Global actions
    if (input.toLowerCase() === 'e' && group && !isSystemGroup && activeTab === 'info') {
      setFormFields({
        name: group.name || '',
        description: group.description || '',
      });
      setMode('edit');
    } else if (input.toLowerCase() === 'd' && group && activeTab === 'info') {
      if (isSystemGroup) {
        setStatus({ message: 'Cannot delete system/default groups', type: 'error' });
      } else {
        setMode('confirm-delete');
      }
    } else if (input.toLowerCase() === 'r') {
      groupQuery.refetch();
      if (activeTab === 'members') membersQuery.refetch();
      if (activeTab === 'roles') rolesQuery.refetch();
      setStatus({ message: 'Refreshed', type: 'info' });
    }
  });

  // Loading/Error states
  if (groupQuery.isLoading) {
    return <Loading message="Loading group details..." />;
  }

  if (groupQuery.isError || !group) {
    return <ErrorMessage message="Failed to load group" onRetry={() => groupQuery.refetch()} />;
  }

  const groupType = group.platform_default ? 'Platform Default' : group.admin_default ? 'Admin Default' : group.system ? 'System' : 'Custom';

  return (
    <Box flexDirection="column">
      {/* Tab bar */}
      <TabBar tabs={TAB_LABELS} activeIndex={TABS.indexOf(activeTab)} />

      {/* Edit form */}
      {mode === 'edit' && (
        <EntityForm
          title="Edit Group"
          fields={formFields}
          onChange={(f, v) => setFormFields((prev) => ({ ...prev, [f]: v }))}
          onSubmit={handleEdit}
          onCancel={() => setMode('browse')}
        />
      )}

      {/* Delete confirmation */}
      {mode === 'confirm-delete' && <ConfirmDialog message={`Delete "${group.name}"?`} onConfirm={handleDelete} onCancel={() => setMode('browse')} />}

      {/* Remove member confirmation */}
      {mode === 'remove-member' && selectedItemToRemove && (
        <ConfirmDialog
          message={`Remove "${selectedItemToRemove}" from group?`}
          onConfirm={handleRemoveMember}
          onCancel={() => {
            setMode('browse');
            setSelectedItemToRemove(null);
          }}
        />
      )}

      {/* Remove role confirmation */}
      {mode === 'remove-role' && selectedItemToRemove && (
        <ConfirmDialog
          message={`Remove role from group?`}
          onConfirm={handleRemoveRole}
          onCancel={() => {
            setMode('browse');
            setSelectedItemToRemove(null);
          }}
        />
      )}

      {/* Add members selection */}
      {mode === 'add-members' && (
        <Box flexDirection="column" padding={1}>
          <Text bold color={colors.primary}>
            Add Member to {group.name}
          </Text>
          <Text color={colors.muted}>↑/↓ Navigate, Enter Select, Esc Cancel</Text>
          <Box marginTop={1} />
          {availableUsersQuery.isLoading ? (
            <Text color={colors.muted}>Loading available users...</Text>
          ) : availableUsers.length === 0 ? (
            <Text color={colors.muted}>No available users to add</Text>
          ) : (
            availableUsers.slice(0, 15).map((user, i) => (
              <Box key={user.username}>
                <Text
                  backgroundColor={i === selectedMemberIndex ? colors.highlight : undefined}
                  color={i === selectedMemberIndex ? '#FFFFFF' : undefined}
                >
                  {i === selectedMemberIndex ? '▸ ' : '  '}
                  {user.username} {user.email ? `(${user.email})` : ''}
                </Text>
              </Box>
            ))
          )}
        </Box>
      )}

      {/* Add roles selection */}
      {mode === 'add-roles' && (
        <Box flexDirection="column" padding={1}>
          <Text bold color={colors.primary}>
            Add Role to {group.name}
          </Text>
          <Text color={colors.muted}>↑/↓ Navigate, Enter Select, Esc Cancel</Text>
          <Box marginTop={1} />
          {availableRolesQuery.isLoading ? (
            <Text color={colors.muted}>Loading available roles...</Text>
          ) : availableRoles.length === 0 ? (
            <Text color={colors.muted}>No available roles to add</Text>
          ) : (
            availableRoles.slice(0, 15).map((role, i) => (
              <Box key={role.uuid}>
                <Text
                  backgroundColor={i === selectedRoleIndex ? colors.highlight : undefined}
                  color={i === selectedRoleIndex ? '#FFFFFF' : undefined}
                >
                  {i === selectedRoleIndex ? '▸ ' : '  '}
                  {role.display_name || role.name}
                  {role.system && <Text color={colors.warning}> [sys]</Text>}
                </Text>
              </Box>
            ))
          )}
        </Box>
      )}

      {/* Content */}
      {mode === 'browse' && (
        <Box flexDirection="column" padding={1}>
          <Text bold color={colors.primary}>
            {group.name}
          </Text>
          <Text color={colors.muted}>{group.description || 'No description'}</Text>
          <Box marginTop={1} />

          {activeTab === 'info' && (
            <Box flexDirection="column">
              <DetailField label="UUID" value={group.uuid} />
              <DetailField label="Type" value={groupType} />
              <DetailField label="Members" value={group.principalCount ?? 0} />
              <DetailField label="Roles" value={group.roleCount ?? 0} />
              <DetailField label="Created" value={group.created ? new Date(group.created).toLocaleDateString() : 'N/A'} />
            </Box>
          )}

          {activeTab === 'members' && (
            <Box flexDirection="column">
              <Box>
                <Text bold>Members ({membersQuery.data?.totalCount ?? 0})</Text>
                {!isSystemGroup && (
                  <Text color={colors.muted}>
                    {' '}
                    - <Text color={colors.success}>A</Text> Add, <Text color={colors.danger}>X</Text> Remove
                  </Text>
                )}
              </Box>
              {membersQuery.isLoading && <Text color={colors.muted}>Loading...</Text>}
              {membersQuery.data?.members?.slice(0, 15).map((m, i) => (
                <Box key={m.username}>
                  <Text
                    backgroundColor={i === selectedMemberIndex ? colors.highlight : undefined}
                    color={i === selectedMemberIndex ? '#FFFFFF' : colors.muted}
                  >
                    {i === selectedMemberIndex ? '▸ ' : '  '}
                    {m.username} {m.email ? `(${m.email})` : ''}
                  </Text>
                </Box>
              ))}
              {(membersQuery.data?.totalCount ?? 0) > 15 && (
                <Text color={colors.muted}>... and {(membersQuery.data?.totalCount ?? 0) - 15} more</Text>
              )}
              {!membersQuery.isLoading && !membersQuery.data?.members?.length && <Text color={colors.muted}>No members</Text>}
            </Box>
          )}

          {activeTab === 'roles' && (
            <Box flexDirection="column">
              <Box>
                <Text bold>Assigned Roles ({rolesQuery.data?.totalCount ?? 0})</Text>
                {!isSystemGroup && (
                  <Text color={colors.muted}>
                    {' '}
                    - <Text color={colors.success}>A</Text> Add, <Text color={colors.danger}>X</Text> Remove
                  </Text>
                )}
              </Box>
              {rolesQuery.isLoading && <Text color={colors.muted}>Loading...</Text>}
              {rolesQuery.data?.roles?.slice(0, 15).map((r, i) => (
                <Box key={r.uuid}>
                  <Text
                    backgroundColor={i === selectedRoleIndex ? colors.highlight : undefined}
                    color={i === selectedRoleIndex ? '#FFFFFF' : colors.muted}
                  >
                    {i === selectedRoleIndex ? '▸ ' : '  '}
                    {r.name} {r.description ? `- ${r.description.slice(0, 40)}` : ''}
                  </Text>
                </Box>
              ))}
              {(rolesQuery.data?.totalCount ?? 0) > 15 && <Text color={colors.muted}>... and {(rolesQuery.data?.totalCount ?? 0) - 15} more</Text>}
              {!rolesQuery.isLoading && !rolesQuery.data?.roles?.length && <Text color={colors.muted}>No roles assigned</Text>}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
