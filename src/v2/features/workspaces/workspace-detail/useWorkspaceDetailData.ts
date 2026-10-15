import { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { EMPTY_PERMISSIONS, type WorkspaceWithPermissions } from '../../../data/queries/workspaces';
import { type WorkspacesStatus, useWorkspacesWithPermissions } from '../hooks/useWorkspacesWithPermissions';
import type { WorkspaceHierarchyItem } from '../components/WorkspaceHeader';

function buildWorkspaceHierarchy(allWorkspaces: WorkspaceWithPermissions[], targetWorkspaceId: string): WorkspaceHierarchyItem[] {
  let currentWs = allWorkspaces.find((ws) => ws.id === targetWorkspaceId);

  const hierarchy: WorkspaceHierarchyItem[] = currentWs
    ? [{ name: currentWs.name ?? '', id: currentWs.id ?? '', canView: currentWs.permissions.view }]
    : [];
  while (currentWs?.parent_id?.length && currentWs?.parent_id?.length > 0) {
    currentWs = allWorkspaces.find((ws) => ws.id === currentWs?.parent_id);
    if (!currentWs) break;
    hierarchy.unshift({ name: currentWs.name ?? '', id: currentWs.id ?? '', canView: currentWs.permissions.view });
  }
  return hierarchy;
}

export interface WorkspaceDetailData {
  workspaceId: string;
  workspace: WorkspaceWithPermissions | null;
  workspaceHierarchy: WorkspaceHierarchyItem[];
  permissions: typeof EMPTY_PERMISSIONS;
  isLoading: boolean;
  status: WorkspacesStatus;
}

/**
 * Shared data hook used by each tab component to provide workspace data
 * to the layout. Fetches workspaces + permissions (React Query deduplicates
 * across tabs) and derives the hierarchy breadcrumb.
 */
export function useWorkspaceDetailData(): WorkspaceDetailData {
  const { workspaceId = '' } = useParams<{ workspaceId: string }>();
  const { workspaces, status } = useWorkspacesWithPermissions();

  const workspace = useMemo<WorkspaceWithPermissions | null>(() => workspaces.find((ws) => ws.id === workspaceId) ?? null, [workspaces, workspaceId]);

  const workspaceHierarchy = useMemo(
    () => (workspaces.length > 0 && workspaceId ? buildWorkspaceHierarchy(workspaces, workspaceId) : []),
    [workspaces, workspaceId],
  );

  const permissions = workspace?.permissions ?? EMPTY_PERMISSIONS;
  const isLoading = status === 'loading';

  return { workspaceId, workspace, workspaceHierarchy, permissions, isLoading, status };
}
