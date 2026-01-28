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

const PAGE_SIZE = 15;

interface WorkspacesListProps {
  queryClient: QueryClient;
}

type Mode = 'browse' | 'search' | 'create' | 'confirm-delete';

// Breadcrumb item for navigation
interface BreadcrumbItem {
  id: string;
  name: string;
}

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

  // Navigation state: current parent workspace (null = show root level)
  const [currentParentId, setCurrentParentId] = useState<string | null>(null);
  const [breadcrumbs, setBreadcrumbs] = useState<BreadcrumbItem[]>([]);

  // Fetch all workspaces (API doesn't support parent_id filtering)
  const allWorkspacesQuery = useWorkspacesQuery({ type: 'all', limit: 1000 }, { queryClient });

  // Combined loading/error state
  const isLoading = allWorkspacesQuery.isLoading;
  const isError = allWorkspacesQuery.isError;

  // Get all workspaces
  const allWorkspaces = allWorkspacesQuery.data?.data ?? [];

  // Find root workspace
  const rootWorkspace = useMemo(() => allWorkspaces.find((ws) => ws.type === 'root'), [allWorkspaces]);
  const rootWorkspaceId = rootWorkspace?.id;

  // Determine which parent to show children for
  const effectiveParentId = currentParentId ?? rootWorkspaceId;

  // Get current parent workspace object
  const currentParentWorkspace = useMemo(() => {
    if (!effectiveParentId) return null;
    return allWorkspaces.find((ws) => ws.id === effectiveParentId) ?? null;
  }, [allWorkspaces, effectiveParentId]);

  // Filter to get children of current parent (client-side filtering)
  const workspacesList = useMemo(() => {
    if (!effectiveParentId) return [];

    // Get direct children of current parent
    const children = allWorkspaces.filter((ws) => ws.parent_id === effectiveParentId);

    // Sort: default first, then alphabetically
    return children.sort((a, b) => {
      if (a.type === 'default' && b.type !== 'default') return -1;
      if (a.type !== 'default' && b.type === 'default') return 1;
      return a.name.localeCompare(b.name);
    });
  }, [allWorkspaces, effectiveParentId]);

  // Filter by search
  const filteredWorkspaces = useMemo(() => {
    if (!searchTerm) return workspacesList;
    return workspacesList.filter((ws) => ws.name.toLowerCase().includes(searchTerm.toLowerCase()));
  }, [workspacesList, searchTerm]);

  // Client-side pagination
  const totalCount = filteredWorkspaces.length;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  // Slice for current page
  const pageWorkspaces = useMemo(() => {
    const start = page * PAGE_SIZE;
    return filteredWorkspaces.slice(start, start + PAGE_SIZE);
  }, [filteredWorkspaces, page]);

  const selectedWorkspace = pageWorkspaces[selectedIndex];

  // Build a map of child counts for each workspace
  const childCountMap = useMemo(() => {
    const counts = new Map<string, number>();
    for (const ws of allWorkspaces) {
      if (ws.parent_id) {
        counts.set(ws.parent_id, (counts.get(ws.parent_id) || 0) + 1);
      }
    }
    return counts;
  }, [allWorkspaces]);

  // Helper to get child count for a workspace
  const getChildCount = useCallback(
    (wsId: string | undefined) => {
      if (!wsId) return 0;
      return childCountMap.get(wsId) || 0;
    },
    [childCountMap],
  );

  // Mutations
  const createWorkspace = useCreateWorkspaceMutation({ queryClient });
  const deleteWorkspace = useDeleteWorkspaceMutation({ queryClient });

  const isSystemWorkspace = (ws: Workspace) => ws.type === 'root' || ws.type === 'default';

  // Navigation handlers
  const drillInto = useCallback((workspace: Workspace) => {
    if (!workspace.id) return;
    setBreadcrumbs((prev) => [...prev, { id: workspace.id!, name: workspace.name }]);
    setCurrentParentId(workspace.id);
    setSelectedIndex(0);
    setPage(0);
  }, []);

  const goBack = useCallback(() => {
    if (breadcrumbs.length === 0) return;

    const newBreadcrumbs = breadcrumbs.slice(0, -1);
    setBreadcrumbs(newBreadcrumbs);

    // Go to parent of last breadcrumb, or null (root level)
    const newParentId = newBreadcrumbs.length > 0 ? newBreadcrumbs[newBreadcrumbs.length - 1].id : null;
    setCurrentParentId(newParentId);
    setSelectedIndex(0);
    setPage(0);
  }, [breadcrumbs]);

  const goToRoot = useCallback(() => {
    setBreadcrumbs([]);
    setCurrentParentId(null);
    setSelectedIndex(0);
    setPage(0);
  }, []);

  // Handlers
  const handleCreate = useCallback(async () => {
    if (!formFields.name.trim()) {
      setStatus({ message: 'Name is required', type: 'error' });
      return;
    }
    // Create under current parent (or root if at top level)
    const parentId = effectiveParentId;
    if (!parentId) {
      setStatus({ message: 'Cannot create workspace: no parent selected', type: 'error' });
      return;
    }
    try {
      await createWorkspace.mutateAsync({
        name: formFields.name,
        description: formFields.description,
        parent_id: parentId,
      });
      setStatus({ message: 'Workspace created successfully', type: 'success' });
      setFormFields({ name: '', description: '' });
      setMode('browse');
      allWorkspacesQuery.refetch();
    } catch (err) {
      setStatus({ message: `Failed to create: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    }
  }, [formFields, createWorkspace, setStatus, effectiveParentId, allWorkspacesQuery]);

  const handleDelete = useCallback(async () => {
    if (!selectedWorkspace?.id) return;
    setDeletingId(selectedWorkspace.id);
    try {
      await deleteWorkspace.mutateAsync({ id: selectedWorkspace.id, name: selectedWorkspace.name });
      setStatus({ message: 'Workspace deleted successfully', type: 'success' });
      setSelectedIndex(Math.max(0, selectedIndex - 1));
      allWorkspacesQuery.refetch();
    } catch (err) {
      setStatus({ message: `Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    } finally {
      setDeletingId(null);
      setMode('browse');
    }
  }, [selectedWorkspace, selectedIndex, deleteWorkspace, setStatus, allWorkspacesQuery]);

  // Input handling
  useInput((input, key) => {
    if (mode === 'search') return;
    if (mode === 'create') return;
    if (mode === 'confirm-delete') return;

    // Browse mode
    if (key.upArrow) {
      setSelectedIndex((prev) => Math.max(0, prev - 1));
    } else if (key.downArrow) {
      setSelectedIndex((prev) => Math.min(pageWorkspaces.length - 1, prev + 1));
    } else if (key.leftArrow) {
      if (totalPages > 1) {
        setPage((prev) => Math.max(0, prev - 1));
        setSelectedIndex(0);
      }
    } else if (key.rightArrow) {
      if (totalPages > 1) {
        setPage((prev) => Math.min(totalPages - 1, prev + 1));
        setSelectedIndex(0);
      }
    } else if (key.return && selectedWorkspace) {
      // Enter: drill into workspace to see children
      drillInto(selectedWorkspace);
    } else if (key.backspace || key.escape || input.toLowerCase() === 'b') {
      // Back: go up one level
      if (breadcrumbs.length > 0) {
        goBack();
      }
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
      allWorkspacesQuery.refetch();
      setStatus({ message: 'Refreshed', type: 'info' });
    } else if (input.toLowerCase() === 'c') {
      setSearchTerm('');
      setSelectedIndex(0);
      setStatus({ message: 'Search cleared', type: 'info' });
    } else if (input.toLowerCase() === 'v' && selectedWorkspace?.id) {
      // V: view workspace detail page
      navigate(`/workspaces/${selectedWorkspace.id}`);
    } else if (input.toLowerCase() === 'h') {
      // H: go to root/home
      goToRoot();
    }
  });

  // Render
  if (isError) {
    return (
      <ErrorMessage
        message="Failed to load workspaces"
        onRetry={() => {
          allWorkspacesQuery.refetch();
        }}
      />
    );
  }

  return (
    <Box flexDirection="row">
      {/* List Panel */}
      <Box flexDirection="column" width="60%">
        {/* Parent workspace header */}
        <Box flexDirection="column" marginBottom={1}>
          <Box>
            <Text color={colors.info} bold>
              📁{' '}
            </Text>
            <Text color={colors.success} bold>
              {currentParentWorkspace?.name ?? 'root'}
            </Text>
            {currentParentWorkspace?.type && <Text color={colors.warning}> [{currentParentWorkspace.type}]</Text>}
          </Box>
          <Box>
            <Text color={colors.muted} dimColor>
              {'   '}ID: {effectiveParentId ?? '—'}
            </Text>
          </Box>
          {breadcrumbs.length > 0 && (
            <Box>
              <Text color={colors.muted} dimColor>
                {'   '}Path: root{breadcrumbs.map((c) => ` / ${c.name}`).join('')}
              </Text>
            </Box>
          )}
          <Box marginTop={1}>
            <Text color={colors.muted}>
              Children ({totalCount}):
              {breadcrumbs.length > 0 && <Text dimColor> B=back H=home</Text>}
            </Text>
          </Box>
        </Box>

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
            {searchTerm && (
              <Box marginBottom={1}>
                <Text color={colors.muted}>
                  Filter: &quot;{searchTerm}&quot; <Text dimColor>(press C to clear)</Text>
                </Text>
              </Box>
            )}
            {isLoading ? (
              <Loading message="Loading workspaces..." />
            ) : pageWorkspaces.length === 0 ? (
              <EmptyState message={searchTerm ? 'No workspaces match filter' : 'No child workspaces'} />
            ) : (
              pageWorkspaces.map((ws, i) => (
                <WorkspaceRow
                  key={ws.id}
                  workspace={ws}
                  isSelected={i === selectedIndex}
                  isDeleting={deletingId === ws.id}
                  childCount={getChildCount(ws.id)}
                />
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
            <DetailField label="ID" value={selectedWorkspace.id || '—'} />
            <DetailField label="Children" value={String(getChildCount(selectedWorkspace.id))} />
            <Box marginTop={1}>
              <Text color={colors.muted} dimColor>
                Enter: drill in • V: details • B: back
              </Text>
            </Box>
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

function WorkspaceRow({
  workspace,
  isSelected,
  isDeleting,
  childCount,
}: {
  workspace: Workspace;
  isSelected: boolean;
  isDeleting: boolean;
  childCount: number;
}): React.ReactElement {
  // Badge for workspace type
  const badge = workspace.type === 'root' ? '[root]' : workspace.type === 'default' ? '[def]' : '';

  // Color based on type
  const typeColor = workspace.type === 'root' ? colors.success : workspace.type === 'default' ? colors.info : undefined;

  return (
    <Box>
      <Text backgroundColor={isSelected ? colors.highlight : undefined} color={isSelected ? '#FFFFFF' : undefined}>
        {isSelected ? '▸ ' : '  '}
        <Text bold color={typeColor}>
          {workspace.name.slice(0, 35).padEnd(35)}
        </Text>
        <Text color={isSelected ? '#FFFFFF' : colors.muted}> {workspace.id?.slice(0, 8)}</Text>
        {childCount > 0 && <Text color={colors.info}> ({childCount})</Text>}
        {badge && <Text color={colors.warning}> {badge}</Text>}
        {isDeleting && <Text color={colors.danger}> deleting...</Text>}
      </Text>
    </Box>
  );
}
