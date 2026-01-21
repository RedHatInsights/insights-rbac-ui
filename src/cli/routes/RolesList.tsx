import React, { useCallback, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useNavigate } from 'react-router-dom';
import type { QueryClient } from '@tanstack/react-query';
import { colors, useStatus } from '../layouts/AppLayout.js';
import {
  ConfirmDialog,
  DetailField,
  EmptyState,
  EntityForm,
  ErrorMessage,
  Loading,
  Pagination,
  PreviewPanel,
  SearchInput,
} from '../components/shared/index.js';
import { type Role, useCreateRoleMutation, useDeleteRoleMutation, useRolesQuery } from '../queries.js';

const PAGE_SIZE = 12;

interface RolesListProps {
  queryClient: QueryClient;
}

type Mode = 'browse' | 'search' | 'create' | 'confirm-delete';

export function RolesList({ queryClient }: RolesListProps): React.ReactElement {
  const navigate = useNavigate();
  const { setStatus } = useStatus();

  // State
  const [mode, setMode] = useState<Mode>('browse');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [page, setPage] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [formFields, setFormFields] = useState({ name: '', description: '' });
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Queries
  const rolesQuery = useRolesQuery({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, name: searchTerm || undefined }, { queryClient });

  // Mutations
  const createRole = useCreateRoleMutation({ queryClient });
  const deleteRole = useDeleteRoleMutation({ queryClient });

  // Computed
  const rolesList = useMemo(() => rolesQuery.data?.data ?? [], [rolesQuery.data]);
  const totalCount = rolesQuery.data?.meta?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const selectedRole = rolesList[selectedIndex] as Role | undefined;

  // Handlers
  const handleCreate = useCallback(async () => {
    if (!formFields.name.trim()) {
      setStatus({ message: 'Name is required', type: 'error' });
      return;
    }
    try {
      // Note: RBAC API requires at least one permission. Use inventory:hosts:read as default
      // because custom roles cannot be created for the 'rbac' application.
      await createRole.mutateAsync({
        name: formFields.name,
        display_name: formFields.name,
        description: formFields.description || undefined,
        access: [
          {
            permission: 'inventory:hosts:read',
            resourceDefinitions: [],
          },
        ],
      });
      setStatus({ message: 'Role created successfully', type: 'success' });
      setFormFields({ name: '', description: '' });
      setMode('browse');
    } catch (err) {
      setStatus({ message: `Failed to create: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    }
  }, [formFields, createRole, setStatus]);

  const handleDelete = useCallback(async () => {
    if (!selectedRole?.uuid) return;
    setDeletingId(selectedRole.uuid);
    try {
      await deleteRole.mutateAsync(selectedRole.uuid);
      setStatus({ message: 'Role deleted successfully', type: 'success' });
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } catch (err) {
      setStatus({ message: `Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    } finally {
      setDeletingId(null);
      setMode('browse');
    }
  }, [selectedRole, selectedIndex, deleteRole, setStatus]);

  // Input handling
  useInput((input, key) => {
    // In search mode, don't handle any input - let SearchInput handle it
    if (mode === 'search') {
      return;
    }

    if (mode === 'create') return; // Handled by EntityForm
    if (mode === 'confirm-delete') return; // Handled by ConfirmDialog

    // Browse mode
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(rolesList.length - 1, prev + 1));
    } else if (key.leftArrow) {
      setPage((prev) => Math.max(0, prev - 1));
      setSelectedIndex(0);
    } else if (key.rightArrow) {
      setPage((prev) => Math.min(totalPages - 1, prev + 1));
      setSelectedIndex(0);
    } else if (key.return && selectedRole?.uuid) {
      navigate(`/roles/${selectedRole.uuid}`);
    } else if (input === '/') {
      setSearchInput(searchTerm);
      setMode('search');
    } else if (input.toLowerCase() === 'n') {
      setFormFields({ name: '', description: '' });
      setMode('create');
    } else if (input.toLowerCase() === 'd' && selectedRole) {
      if (selectedRole.system) {
        setStatus({ message: 'Cannot delete system roles', type: 'error' });
      } else {
        setMode('confirm-delete');
      }
    } else if (input.toLowerCase() === 'r') {
      rolesQuery.refetch();
      setStatus({ message: 'Refreshed', type: 'info' });
    }
  });

  // Render
  if (rolesQuery.isError) {
    return <ErrorMessage message="Failed to load roles" onRetry={() => rolesQuery.refetch()} />;
  }

  return (
    <Box flexDirection="row">
      {/* List Panel */}
      <Box flexDirection="column" width="60%">
        {mode === 'search' && (
          <SearchInput
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={() => {
              setSearchTerm(searchInput);
              setPage(0);
              setSelectedIndex(0);
              setMode('browse');
            }}
            onCancel={() => setMode('browse')}
          />
        )}

        {mode === 'create' && (
          <EntityForm
            title="Create New Role"
            fields={formFields}
            onChange={(f, v) => setFormFields((prev) => ({ ...prev, [f]: v }))}
            onSubmit={handleCreate}
            onCancel={() => setMode('browse')}
          />
        )}

        {mode === 'confirm-delete' && selectedRole && (
          <ConfirmDialog
            message={`Delete "${selectedRole.display_name || selectedRole.name}"?`}
            onConfirm={handleDelete}
            onCancel={() => setMode('browse')}
          />
        )}

        {(mode === 'browse' || mode === 'search') && (
          <>
            {rolesQuery.isLoading ? (
              <Loading message="Loading roles..." />
            ) : rolesList.length === 0 ? (
              <EmptyState message="No roles found" />
            ) : (
              rolesList.map((role, i) => (
                <RoleRow key={role.uuid} role={role} isSelected={i === selectedIndex} isDeleting={deletingId === role.uuid} />
              ))
            )}
            <Pagination page={page} totalPages={totalPages} totalItems={totalCount} />
          </>
        )}
      </Box>

      {/* Preview Panel */}
      <Box flexDirection="column" width="40%" paddingLeft={1}>
        {selectedRole ? (
          <PreviewPanel title="Preview">
            <DetailField label="Name" value={selectedRole.display_name || selectedRole.name} />
            <Text wrap="truncate-end">
              <Text bold>Desc:</Text> {selectedRole.description?.slice(0, 60) || '—'}
            </Text>
            <DetailField label="Type" value={selectedRole.system ? 'System' : 'Custom'} />
            <DetailField label="Perms" value={selectedRole.accessCount ?? 0} />
          </PreviewPanel>
        ) : (
          <PreviewPanel title="Preview">
            <Text color={colors.muted}>Select a role to preview</Text>
          </PreviewPanel>
        )}
      </Box>
    </Box>
  );
}

// ============================================================================
// Row Component
// ============================================================================

function RoleRow({ role, isSelected, isDeleting }: { role: Role; isSelected: boolean; isDeleting: boolean }): React.ReactElement {
  return (
    <Box>
      <Text backgroundColor={isSelected ? colors.highlight : undefined} color={isSelected ? '#FFFFFF' : undefined}>
        {isSelected ? '▸ ' : '  '}
        <Text bold>{(role.display_name || role.name).slice(0, 40).padEnd(40)}</Text>
        <Text color={isSelected ? '#FFFFFF' : colors.muted}> {role.uuid?.slice(0, 8)}</Text>
        {role.system && <Text color={colors.warning}> [sys]</Text>}
        {role.accessCount !== undefined && <Text color={isSelected ? '#FFFFFF' : colors.muted}> ({role.accessCount} perms)</Text>}
        {isDeleting && <Text color={colors.danger}> deleting...</Text>}
      </Text>
    </Box>
  );
}
