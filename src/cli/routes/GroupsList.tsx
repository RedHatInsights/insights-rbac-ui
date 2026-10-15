import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useNavigate } from 'react-router-dom';
import type { QueryClient } from '@tanstack/react-query';
import { colors, useInputFocus, useStatus } from '../layouts/AppLayout.js';
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
import { type Group, useCreateGroupMutation, useDeleteGroupMutation, useGroupsQuery } from '../queries.js';

const PAGE_SIZE = 12;

interface GroupsListProps {
  queryClient: QueryClient;
}

type Mode = 'browse' | 'search' | 'create' | 'confirm-delete';

export function GroupsList({ queryClient }: GroupsListProps): React.ReactElement {
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

  // Disable global hotkeys when in text input mode
  const { setInputFocused } = useInputFocus();
  useEffect(() => {
    setInputFocused(mode === 'create' || mode === 'search');
    return () => setInputFocused(false);
  }, [mode, setInputFocused]);

  // Queries
  const groupsQuery = useGroupsQuery({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, name: searchTerm || undefined }, { queryClient });

  // Mutations
  const createGroup = useCreateGroupMutation({ queryClient });
  const deleteGroup = useDeleteGroupMutation({ queryClient });

  // Computed
  const groupsList = useMemo(() => groupsQuery.data?.data ?? [], [groupsQuery.data]);
  const totalCount = groupsQuery.data?.meta?.count ?? 0;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const selectedGroup = groupsList[selectedIndex] as Group | undefined;

  const isSystemGroup = (group: Group) => group.system || group.platform_default || group.admin_default;

  // Handlers
  const handleCreate = useCallback(async () => {
    if (!formFields.name.trim()) {
      setStatus({ message: 'Name is required', type: 'error' });
      return;
    }
    try {
      await createGroup.mutateAsync({
        name: formFields.name,
        description: formFields.description,
      });
      setStatus({ message: 'Group created successfully', type: 'success' });
      setFormFields({ name: '', description: '' });
      setMode('browse');
    } catch (err) {
      setStatus({ message: `Failed to create: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    }
  }, [formFields, createGroup, setStatus]);

  const handleDelete = useCallback(async () => {
    if (!selectedGroup?.uuid) return;
    setDeletingId(selectedGroup.uuid);
    try {
      await deleteGroup.mutateAsync(selectedGroup.uuid);
      setStatus({ message: 'Group deleted successfully', type: 'success' });
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } catch (err) {
      setStatus({ message: `Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    } finally {
      setDeletingId(null);
      setMode('browse');
    }
  }, [selectedGroup, selectedIndex, deleteGroup, setStatus]);

  // Input handling
  useInput((input, key) => {
    // In search mode, don't handle any input - let SearchInput handle it
    if (mode === 'search') {
      return;
    }

    if (mode === 'create') return;
    if (mode === 'confirm-delete') return;

    // Browse mode
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(groupsList.length - 1, prev + 1));
    } else if (key.leftArrow) {
      setPage((prev) => Math.max(0, prev - 1));
      setSelectedIndex(0);
    } else if (key.rightArrow) {
      setPage((prev) => Math.min(totalPages - 1, prev + 1));
      setSelectedIndex(0);
    } else if (key.return && selectedGroup?.uuid) {
      navigate(`/groups/${selectedGroup.uuid}`);
    } else if (input === '/') {
      setSearchInput(searchTerm);
      setMode('search');
    } else if (input.toLowerCase() === 'n') {
      setFormFields({ name: '', description: '' });
      setMode('create');
    } else if (input.toLowerCase() === 'd' && selectedGroup) {
      if (isSystemGroup(selectedGroup)) {
        setStatus({ message: 'Cannot delete system/default groups', type: 'error' });
      } else {
        setMode('confirm-delete');
      }
    } else if (input.toLowerCase() === 'r') {
      groupsQuery.refetch();
      setStatus({ message: 'Refreshed', type: 'info' });
    }
  });

  // Render
  if (groupsQuery.isError) {
    return <ErrorMessage message="Failed to load groups" onRetry={() => groupsQuery.refetch()} />;
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
            title="Create New Group"
            fields={formFields}
            onChange={(f, v) => setFormFields((prev) => ({ ...prev, [f]: v }))}
            onSubmit={handleCreate}
            onCancel={() => setMode('browse')}
          />
        )}

        {mode === 'confirm-delete' && selectedGroup && (
          <ConfirmDialog message={`Delete "${selectedGroup.name}"?`} onConfirm={handleDelete} onCancel={() => setMode('browse')} />
        )}

        {(mode === 'browse' || mode === 'search') && (
          <>
            {groupsQuery.isLoading ? (
              <Loading message="Loading groups..." />
            ) : groupsList.length === 0 ? (
              <EmptyState message="No groups found" />
            ) : (
              groupsList.map((group, i) => (
                <GroupRow key={group.uuid} group={group} isSelected={i === selectedIndex} isDeleting={deletingId === group.uuid} />
              ))
            )}
            <Pagination page={page} totalPages={totalPages} totalItems={totalCount} />
          </>
        )}
      </Box>

      {/* Preview Panel */}
      <Box flexDirection="column" width="40%" paddingLeft={1}>
        {selectedGroup ? (
          <PreviewPanel title="Preview">
            <DetailField label="Name" value={selectedGroup.name} />
            <Text wrap="truncate-end">
              <Text bold>Desc:</Text> {selectedGroup.description?.slice(0, 60) || '—'}
            </Text>
            <DetailField label="Members" value={selectedGroup.principalCount ?? 0} />
            <DetailField label="Roles" value={selectedGroup.roleCount ?? 0} />
          </PreviewPanel>
        ) : (
          <PreviewPanel title="Preview">
            <Text color={colors.muted}>Select a group to preview</Text>
          </PreviewPanel>
        )}
      </Box>
    </Box>
  );
}

// ============================================================================
// Row Component
// ============================================================================

function GroupRow({ group, isSelected, isDeleting }: { group: Group; isSelected: boolean; isDeleting: boolean }): React.ReactElement {
  const badge = group.platform_default ? '[def]' : group.admin_default ? '[adm]' : group.system ? '[sys]' : '';
  return (
    <Box>
      <Text backgroundColor={isSelected ? colors.highlight : undefined} color={isSelected ? '#FFFFFF' : undefined}>
        {isSelected ? '▸ ' : '  '}
        <Text bold>{group.name.slice(0, 35).padEnd(35)}</Text>
        <Text color={isSelected ? '#FFFFFF' : colors.muted}> {group.uuid?.slice(0, 8)}</Text>
        {badge && <Text color={colors.warning}> {badge}</Text>}
        <Text color={isSelected ? '#FFFFFF' : colors.muted}>
          {' '}
          {group.principalCount ?? 0}m, {group.roleCount ?? 0}r
        </Text>
        {isDeleting && <Text color={colors.danger}> deleting...</Text>}
      </Text>
    </Box>
  );
}
