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
import { type WorkspacesWorkspace as Workspace, useCreateWorkspaceMutation, useDeleteWorkspaceMutation, useWorkspacesQuery } from '../queries.js';

const PAGE_SIZE = 12;

interface WorkspacesListProps {
  queryClient: QueryClient;
}

type Mode = 'browse' | 'search' | 'create' | 'confirm-delete';

export function WorkspacesList({ queryClient }: WorkspacesListProps): React.ReactElement {
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
  const workspacesQuery = useWorkspacesQuery({ limit: PAGE_SIZE, offset: page * PAGE_SIZE, name: searchTerm || undefined }, { queryClient });
  // Query root workspace to get parent_id for new workspaces
  const rootWorkspaceQuery = useWorkspacesQuery({ type: 'root' }, { queryClient });
  const rootWorkspaceId = rootWorkspaceQuery.data?.data?.[0]?.id;

  // Mutations
  const createWorkspace = useCreateWorkspaceMutation({ queryClient });
  const deleteWorkspace = useDeleteWorkspaceMutation({ queryClient });

  // Computed
  const workspacesList = useMemo(() => workspacesQuery.data?.data ?? [], [workspacesQuery.data]);
  const totalCount = workspacesList.length;
  const totalPages = Math.ceil(totalCount / PAGE_SIZE);
  const selectedWorkspace = workspacesList[selectedIndex] as Workspace | undefined;

  const isSystemWorkspace = (ws: Workspace) => ws.type === 'root' || ws.type === 'default';

  // Handlers
  const handleCreate = useCallback(async () => {
    if (!formFields.name.trim()) {
      setStatus({ message: 'Name is required', type: 'error' });
      return;
    }
    if (!rootWorkspaceId) {
      setStatus({ message: 'Cannot create workspace: root workspace not found', type: 'error' });
      return;
    }
    try {
      await createWorkspace.mutateAsync({
        name: formFields.name,
        description: formFields.description,
        parent_id: rootWorkspaceId,
      });
      setStatus({ message: 'Workspace created successfully', type: 'success' });
      setFormFields({ name: '', description: '' });
      setMode('browse');
    } catch (err) {
      setStatus({ message: `Failed to create: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    }
  }, [formFields, createWorkspace, setStatus, rootWorkspaceId]);

  const handleDelete = useCallback(async () => {
    if (!selectedWorkspace?.id) return;
    setDeletingId(selectedWorkspace.id);
    try {
      await deleteWorkspace.mutateAsync({ id: selectedWorkspace.id, name: selectedWorkspace.name });
      setStatus({ message: 'Workspace deleted successfully', type: 'success' });
      setSelectedIndex(Math.max(0, selectedIndex - 1));
    } catch (err) {
      setStatus({ message: `Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    } finally {
      setDeletingId(null);
      setMode('browse');
    }
  }, [selectedWorkspace, selectedIndex, deleteWorkspace, setStatus]);

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
      setSelectedIndex((prev) => Math.min(workspacesList.length - 1, prev + 1));
    } else if (key.leftArrow) {
      setPage((prev) => Math.max(0, prev - 1));
      setSelectedIndex(0);
    } else if (key.rightArrow) {
      setPage((prev) => Math.min(totalPages - 1, prev + 1));
      setSelectedIndex(0);
    } else if (key.return && selectedWorkspace?.id) {
      navigate(`/workspaces/${selectedWorkspace.id}`);
    } else if (input === '/') {
      setSearchInput(searchTerm);
      setMode('search');
    } else if (input.toLowerCase() === 'n') {
      setFormFields({ name: '', description: '' });
      setMode('create');
    } else if (input.toLowerCase() === 'd' && selectedWorkspace) {
      if (isSystemWorkspace(selectedWorkspace)) {
        setStatus({ message: 'Cannot delete root/default workspaces', type: 'error' });
      } else {
        setMode('confirm-delete');
      }
    } else if (input.toLowerCase() === 'r') {
      workspacesQuery.refetch();
      setStatus({ message: 'Refreshed', type: 'info' });
    }
  });

  // Render
  if (workspacesQuery.isError) {
    return <ErrorMessage message="Failed to load workspaces" onRetry={() => workspacesQuery.refetch()} />;
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
            title="Create New Workspace"
            fields={formFields}
            onChange={(f, v) => setFormFields((prev) => ({ ...prev, [f]: v }))}
            onSubmit={handleCreate}
            onCancel={() => setMode('browse')}
          />
        )}

        {mode === 'confirm-delete' && selectedWorkspace && (
          <ConfirmDialog message={`Delete "${selectedWorkspace.name}"?`} onConfirm={handleDelete} onCancel={() => setMode('browse')} />
        )}

        {(mode === 'browse' || mode === 'search') && (
          <>
            {workspacesQuery.isLoading ? (
              <Loading message="Loading workspaces..." />
            ) : workspacesList.length === 0 ? (
              <EmptyState message="No workspaces found" />
            ) : (
              workspacesList.map((ws, i) => (
                <WorkspaceRow key={ws.id} workspace={ws} isSelected={i === selectedIndex} isDeleting={deletingId === ws.id} />
              ))
            )}
            <Pagination page={page} totalPages={totalPages} totalItems={totalCount} />
          </>
        )}
      </Box>

      {/* Preview Panel */}
      <Box flexDirection="column" width="40%" paddingLeft={1}>
        {selectedWorkspace ? (
          <PreviewPanel title="Preview">
            <DetailField label="Name" value={selectedWorkspace.name} />
            <Text wrap="truncate-end">
              <Text bold>Desc:</Text> {selectedWorkspace.description?.slice(0, 60) || '—'}
            </Text>
            <DetailField label="Type" value={selectedWorkspace.type || 'standard'} />
          </PreviewPanel>
        ) : (
          <PreviewPanel title="Preview">
            <Text color={colors.muted}>Select a workspace to preview</Text>
          </PreviewPanel>
        )}
      </Box>
    </Box>
  );
}

// ============================================================================
// Row Component
// ============================================================================

function WorkspaceRow({ workspace, isSelected, isDeleting }: { workspace: Workspace; isSelected: boolean; isDeleting: boolean }): React.ReactElement {
  const badge = workspace.type === 'root' ? '[root]' : workspace.type === 'default' ? '[def]' : '';
  return (
    <Box>
      <Text backgroundColor={isSelected ? colors.highlight : undefined} color={isSelected ? '#FFFFFF' : undefined}>
        {isSelected ? '▸ ' : '  '}
        <Text bold>{workspace.name.slice(0, 40).padEnd(40)}</Text>
        <Text color={isSelected ? '#FFFFFF' : colors.muted}> {workspace.id?.slice(0, 8)}</Text>
        {badge && <Text color={colors.warning}> {badge}</Text>}
        {isDeleting && <Text color={colors.danger}> deleting...</Text>}
      </Text>
    </Box>
  );
}
