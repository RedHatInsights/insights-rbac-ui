import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useNavigate, useParams } from 'react-router-dom';
import type { QueryClient } from '@tanstack/react-query';
import { colors, useInputFocus, useStatus } from '../layouts/AppLayout.js';
import { ConfirmDialog, DetailField, EntityForm, ErrorMessage, Loading, TabBar } from '../components/shared/index.js';
import { type Access, useDeleteRoleMutation, useRoleQuery, useUpdateRoleMutation } from '../queries.js';

interface RoleDetailProps {
  queryClient: QueryClient;
}

type Mode = 'browse' | 'edit' | 'confirm-delete' | 'add-permission' | 'remove-permission';
type Tab = 'info' | 'permissions';

const TABS: Tab[] = ['info', 'permissions'];
const TAB_LABELS = ['Info', 'Permissions'];

export function RoleDetail({ queryClient }: RoleDetailProps): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setStatus } = useStatus();

  // State
  const [mode, setMode] = useState<Mode>('browse');
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [formFields, setFormFields] = useState({ name: '', description: '' });
  const [newPermission, setNewPermission] = useState('');
  const [selectedPermIndex, setSelectedPermIndex] = useState(0);

  // Disable global hotkeys when in text input mode
  const { setInputFocused } = useInputFocus();
  useEffect(() => {
    setInputFocused(mode === 'edit' || mode === 'add-permission');
    return () => setInputFocused(false);
  }, [mode, setInputFocused]);

  // Query
  const roleQuery = useRoleQuery(id!, { queryClient });
  const role = roleQuery.data;

  // Mutations
  const deleteRole = useDeleteRoleMutation({ queryClient });
  const updateRole = useUpdateRoleMutation({ queryClient });

  // Current permissions
  const currentAccess = useMemo(() => (role?.access as Access[] | undefined) ?? [], [role?.access]);

  // Handlers
  const handleEdit = useCallback(async () => {
    if (!id || !formFields.name.trim()) {
      setStatus({ message: 'Name is required', type: 'error' });
      return;
    }
    try {
      await updateRole.mutateAsync({
        uuid: id,
        rolePut: {
          name: formFields.name,
          display_name: formFields.name,
          description: formFields.description || undefined,
          access: currentAccess,
        },
      });
      setStatus({ message: 'Role updated successfully', type: 'success' });
      setMode('browse');
    } catch (err) {
      setStatus({ message: `Failed to update: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    }
  }, [id, formFields, updateRole, currentAccess, setStatus]);

  const handleDelete = useCallback(async () => {
    if (!id) return;
    try {
      await deleteRole.mutateAsync(id);
      setStatus({ message: 'Role deleted successfully', type: 'success' });
      navigate('/roles');
    } catch (err) {
      setStatus({ message: `Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
      setMode('browse');
    }
  }, [id, deleteRole, setStatus, navigate]);

  const handleAddPermission = useCallback(async () => {
    if (!id || !newPermission.trim()) {
      setStatus({ message: 'Permission string is required (e.g., inventory:hosts:read)', type: 'error' });
      return;
    }

    // Validate permission format (app:resource:verb)
    const parts = newPermission.trim().split(':');
    if (parts.length !== 3) {
      setStatus({ message: 'Invalid format. Use: application:resource:verb', type: 'error' });
      return;
    }

    // Check for duplicates
    if (currentAccess.some((a) => a.permission === newPermission.trim())) {
      setStatus({ message: 'Permission already exists', type: 'error' });
      return;
    }

    try {
      const newAccess: Access[] = [...currentAccess, { permission: newPermission.trim(), resourceDefinitions: [] }];
      await updateRole.mutateAsync({
        uuid: id,
        rolePut: {
          name: role?.name,
          display_name: role?.display_name || role?.name,
          description: role?.description || undefined,
          access: newAccess,
        },
      });
      setStatus({ message: `Added permission: ${newPermission.trim()}`, type: 'success' });
      setNewPermission('');
      setMode('browse');
      roleQuery.refetch();
    } catch (err) {
      setStatus({ message: `Failed to add: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    }
  }, [id, newPermission, currentAccess, updateRole, role, setStatus, roleQuery]);

  const handleRemovePermission = useCallback(async () => {
    if (!id || selectedPermIndex < 0 || selectedPermIndex >= currentAccess.length) return;

    const permissionToRemove = currentAccess[selectedPermIndex].permission;
    const newAccess = currentAccess.filter((_, i) => i !== selectedPermIndex);

    try {
      await updateRole.mutateAsync({
        uuid: id,
        rolePut: {
          name: role?.name,
          display_name: role?.display_name || role?.name,
          description: role?.description || undefined,
          access: newAccess,
        },
      });
      setStatus({ message: `Removed permission: ${permissionToRemove}`, type: 'success' });
      setMode('browse');
      setSelectedPermIndex(0);
      roleQuery.refetch();
    } catch (err) {
      setStatus({ message: `Failed to remove: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    }
  }, [id, selectedPermIndex, currentAccess, updateRole, role, setStatus, roleQuery]);

  // Input handling
  useInput((input, key) => {
    if (mode === 'edit') return;
    if (mode === 'confirm-delete') return;

    // Add permission mode
    if (mode === 'add-permission') {
      if (key.escape) {
        setMode('browse');
        setNewPermission('');
      } else if (key.return) {
        handleAddPermission();
      }
      return;
    }

    // Remove permission mode
    if (mode === 'remove-permission') {
      if (key.escape) {
        setMode('browse');
      } else if (key.return) {
        handleRemovePermission();
      }
      return;
    }

    // Tab switching
    if (input >= '1' && input <= String(TABS.length)) {
      const tabIndex = parseInt(input) - 1;
      setActiveTab(TABS[tabIndex]);
      setSelectedPermIndex(0);
      return;
    }

    // Permissions tab navigation
    if (activeTab === 'permissions') {
      if (key.upArrow) {
        setSelectedPermIndex((prev) => Math.max(0, prev - 1));
      } else if (key.downArrow) {
        setSelectedPermIndex((prev) => Math.min(currentAccess.length - 1, prev + 1));
      } else if (input.toLowerCase() === 'a' && role && !role.system) {
        setMode('add-permission');
      } else if (input.toLowerCase() === 'x' && currentAccess.length > 0 && role && !role.system) {
        setMode('remove-permission');
      }
    }

    // Global actions
    if (input.toLowerCase() === 'e' && role && !role.system && activeTab === 'info') {
      setFormFields({
        name: role.display_name || role.name || '',
        description: role.description || '',
      });
      setMode('edit');
    } else if (input.toLowerCase() === 'd' && role && activeTab === 'info') {
      if (role.system) {
        setStatus({ message: 'Cannot delete system roles', type: 'error' });
      } else {
        setMode('confirm-delete');
      }
    } else if (input.toLowerCase() === 'r') {
      roleQuery.refetch();
      setStatus({ message: 'Refreshed', type: 'info' });
    }
  });

  // Loading/Error states
  if (roleQuery.isLoading) {
    return <Loading message="Loading role details..." />;
  }

  if (roleQuery.isError || !role) {
    return <ErrorMessage message="Failed to load role" onRetry={() => roleQuery.refetch()} />;
  }

  return (
    <Box flexDirection="column">
      {/* Tab bar */}
      <TabBar tabs={TAB_LABELS} activeIndex={TABS.indexOf(activeTab)} />

      {/* Edit form */}
      {mode === 'edit' && (
        <EntityForm
          title="Edit Role"
          fields={formFields}
          onChange={(f, v) => setFormFields((prev) => ({ ...prev, [f]: v }))}
          onSubmit={handleEdit}
          onCancel={() => setMode('browse')}
        />
      )}

      {/* Delete confirmation */}
      {mode === 'confirm-delete' && (
        <ConfirmDialog message={`Delete "${role.display_name || role.name}"?`} onConfirm={handleDelete} onCancel={() => setMode('browse')} />
      )}

      {/* Add permission input */}
      {mode === 'add-permission' && (
        <Box flexDirection="column" padding={1}>
          <Text bold color={colors.primary}>
            Add Permission
          </Text>
          <Text color={colors.muted}>Enter permission string (format: application:resource:verb)</Text>
          <Text color={colors.muted}>Examples: inventory:hosts:read, advisor:*:read, cost-management:*:*</Text>
          <Box marginTop={1}>
            <Text color={colors.highlight}>Permission: </Text>
            <TextInput value={newPermission} onChange={setNewPermission} />
          </Box>
          <Text color={colors.muted} dimColor>
            Enter to add, Esc to cancel
          </Text>
        </Box>
      )}

      {/* Remove permission confirmation */}
      {mode === 'remove-permission' && currentAccess[selectedPermIndex] && (
        <ConfirmDialog
          message={`Remove permission "${currentAccess[selectedPermIndex].permission}"?`}
          onConfirm={handleRemovePermission}
          onCancel={() => setMode('browse')}
        />
      )}

      {/* Content */}
      {mode === 'browse' && (
        <Box flexDirection="column" padding={1}>
          <Text bold color={colors.primary}>
            {role.display_name || role.name}
          </Text>
          <Text color={colors.muted}>{role.description || 'No description'}</Text>
          <Box marginTop={1} />

          {activeTab === 'info' && (
            <Box flexDirection="column">
              <DetailField label="UUID" value={role.uuid} />
              <DetailField label="Type" value={role.system ? 'System Role' : 'Custom Role'} />
              <DetailField label="Created" value={role.created ? new Date(role.created).toLocaleDateString() : 'N/A'} />
              <DetailField label="Modified" value={role.modified ? new Date(role.modified).toLocaleDateString() : 'N/A'} />
              <DetailField label="Permissions" value={currentAccess.length} />
            </Box>
          )}

          {activeTab === 'permissions' && (
            <Box flexDirection="column">
              <Box>
                <Text bold>Permissions ({currentAccess.length})</Text>
                {!role.system && (
                  <Text color={colors.muted}>
                    {' '}
                    - <Text color={colors.success}>A</Text> Add, <Text color={colors.danger}>X</Text> Remove
                  </Text>
                )}
              </Box>
              {currentAccess.length === 0 ? (
                <Text color={colors.muted}>No permissions</Text>
              ) : (
                currentAccess.slice(0, 20).map((acc, i) => (
                  <Box key={i}>
                    <Text
                      backgroundColor={i === selectedPermIndex ? colors.highlight : undefined}
                      color={i === selectedPermIndex ? '#FFFFFF' : colors.muted}
                    >
                      {i === selectedPermIndex ? '▸ ' : '  '}
                      {acc.permission}
                    </Text>
                  </Box>
                ))
              )}
              {currentAccess.length > 20 && <Text color={colors.muted}>... and {currentAccess.length - 20} more</Text>}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
