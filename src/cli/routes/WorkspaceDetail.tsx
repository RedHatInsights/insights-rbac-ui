import React, { useCallback, useEffect, useState } from 'react';
import { Box, Text, useInput } from 'ink';
import { useNavigate, useParams } from 'react-router-dom';
import type { QueryClient } from '@tanstack/react-query';
import { colors, useInputFocus, useStatus } from '../layouts/AppLayout.js';
import { ConfirmDialog, DetailField, EntityForm, ErrorMessage, Loading, TabBar } from '../components/shared/index.js';
import { useDeleteWorkspaceMutation, useUpdateWorkspaceMutation, useWorkspaceGroupBindingsQuery, useWorkspaceQuery } from '../queries.js';

interface WorkspaceDetailProps {
  queryClient: QueryClient;
}

type Mode = 'browse' | 'edit' | 'confirm-delete';
type Tab = 'info' | 'bindings';

const TABS: Tab[] = ['info', 'bindings'];
const TAB_LABELS = ['Info', 'Group Bindings'];

export function WorkspaceDetail({ queryClient }: WorkspaceDetailProps): React.ReactElement {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { setStatus } = useStatus();

  // State
  const [mode, setMode] = useState<Mode>('browse');
  const [activeTab, setActiveTab] = useState<Tab>('info');
  const [formFields, setFormFields] = useState({ name: '', description: '' });

  // Disable global hotkeys when in text input mode
  const { setInputFocused } = useInputFocus();
  useEffect(() => {
    setInputFocused(mode === 'edit');
    return () => setInputFocused(false);
  }, [mode, setInputFocused]);

  // Queries
  const workspaceQuery = useWorkspaceQuery(id!, { queryClient });
  const bindingsQuery = useWorkspaceGroupBindingsQuery(id!, { queryClient, enabled: activeTab === 'bindings' });
  const workspace = workspaceQuery.data;

  // Mutations
  const deleteWorkspace = useDeleteWorkspaceMutation({ queryClient });
  const updateWorkspace = useUpdateWorkspaceMutation({ queryClient });

  const isSystemWorkspace = workspace?.type === 'root' || workspace?.type === 'default';

  // Handlers
  const handleEdit = useCallback(async () => {
    if (!id || !formFields.name.trim()) {
      setStatus({ message: 'Name is required', type: 'error' });
      return;
    }
    try {
      await updateWorkspace.mutateAsync({
        id,
        workspacesPatchWorkspaceRequest: {
          name: formFields.name,
          description: formFields.description,
        },
      });
      setStatus({ message: 'Workspace updated successfully', type: 'success' });
      setMode('browse');
    } catch (err) {
      setStatus({ message: `Failed to update: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
    }
  }, [id, formFields, updateWorkspace, setStatus]);

  const handleDelete = useCallback(async () => {
    if (!id || !workspace) return;
    try {
      await deleteWorkspace.mutateAsync({ id, name: workspace.name });
      setStatus({ message: 'Workspace deleted successfully', type: 'success' });
      navigate('/workspaces');
    } catch (err) {
      setStatus({ message: `Failed to delete: ${err instanceof Error ? err.message : 'Unknown error'}`, type: 'error' });
      setMode('browse');
    }
  }, [id, workspace, deleteWorkspace, setStatus, navigate]);

  // Input handling
  useInput((input) => {
    if (mode === 'edit') return;
    if (mode === 'confirm-delete') return;

    // Tab switching
    if (input >= '1' && input <= String(TABS.length)) {
      const tabIndex = parseInt(input) - 1;
      setActiveTab(TABS[tabIndex]);
      return;
    }

    // Actions
    if (input.toLowerCase() === 'e' && workspace && !isSystemWorkspace) {
      setFormFields({
        name: workspace.name || '',
        description: workspace.description || '',
      });
      setMode('edit');
    } else if (input.toLowerCase() === 'd' && workspace) {
      if (isSystemWorkspace) {
        setStatus({ message: 'Cannot delete root/default workspaces', type: 'error' });
      } else {
        setMode('confirm-delete');
      }
    } else if (input.toLowerCase() === 'r') {
      workspaceQuery.refetch();
      if (activeTab === 'bindings') bindingsQuery.refetch();
      setStatus({ message: 'Refreshed', type: 'info' });
    }
  });

  // Loading/Error states
  if (workspaceQuery.isLoading) {
    return <Loading message="Loading workspace details..." />;
  }

  if (workspaceQuery.isError || !workspace) {
    return <ErrorMessage message="Failed to load workspace" onRetry={() => workspaceQuery.refetch()} />;
  }

  return (
    <Box flexDirection="column">
      {/* Tab bar */}
      <TabBar tabs={TAB_LABELS} activeIndex={TABS.indexOf(activeTab)} />

      {/* Edit form */}
      {mode === 'edit' && (
        <EntityForm
          title="Edit Workspace"
          fields={formFields}
          onChange={(f, v) => setFormFields((prev) => ({ ...prev, [f]: v }))}
          onSubmit={handleEdit}
          onCancel={() => setMode('browse')}
        />
      )}

      {/* Delete confirmation */}
      {mode === 'confirm-delete' && (
        <ConfirmDialog message={`Delete "${workspace.name}"?`} onConfirm={handleDelete} onCancel={() => setMode('browse')} />
      )}

      {/* Content */}
      {mode === 'browse' && (
        <Box flexDirection="column" padding={1}>
          <Text bold color={colors.primary}>
            {workspace.name}
          </Text>
          <Text color={colors.muted}>{workspace.description || 'No description'}</Text>
          <Box marginTop={1} />

          {activeTab === 'info' && (
            <Box flexDirection="column">
              <DetailField label="ID" value={workspace.id} />
              <DetailField label="Type" value={workspace.type || 'standard'} />
              <DetailField label="Parent" value={workspace.parent_id || '(root)'} />
              <DetailField label="Created" value={workspace.created ? new Date(workspace.created).toLocaleDateString() : 'N/A'} />
              <DetailField label="Modified" value={workspace.modified ? new Date(workspace.modified).toLocaleDateString() : 'N/A'} />
            </Box>
          )}

          {activeTab === 'bindings' && (
            <Box flexDirection="column">
              <Text bold>Group Bindings:</Text>
              {bindingsQuery.isLoading && <Text color={colors.muted}>Loading...</Text>}
              {bindingsQuery.data?.data?.slice(0, 20).map((binding, i) => (
                <Box key={i} flexDirection="column" marginBottom={1}>
                  <Text color={colors.muted}>
                    {'  '}• Group: <Text color={colors.primary}>{binding.subject?.id || 'Unknown'}</Text>
                  </Text>
                  <Text color={colors.muted}>
                    {'    '}Role: <Text color={colors.highlight}>{binding.role?.id || 'Unknown'}</Text>
                  </Text>
                </Box>
              ))}
              {(bindingsQuery.data?.meta?.count ?? 0) > 20 && (
                <Text color={colors.muted}>... and {(bindingsQuery.data?.meta?.count ?? 0) - 20} more</Text>
              )}
              {!bindingsQuery.isLoading && !bindingsQuery.data?.data?.length && <Text color={colors.muted}>No group bindings</Text>}
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
}
