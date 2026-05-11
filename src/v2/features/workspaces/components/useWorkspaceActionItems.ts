import { useMemo } from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../../Messages';
import { EMPTY_PERMISSIONS, type WorkspacePermissions, useWorkspacesQuery } from '../../../data/queries/workspaces';
import { useWorkspacesFlag } from '../../../../shared/hooks/useWorkspacesFlag';

export interface WorkspaceActionCallbacks {
  onEdit?: () => void;
  onGrantAccess?: () => void;
  onCreateSub?: () => void;
  onCreateSibling?: () => void;
  onMove?: () => void;
  onDelete?: () => void;
}

export interface WorkspaceActionItem {
  key: string;
  label: string;
  onClick: () => void;
  isDisabled: boolean;
  isDanger?: boolean;
  isSeparator?: boolean;
}

interface UseWorkspaceActionItemsParams {
  workspaceId: string | undefined;
  permissions?: WorkspacePermissions;
  callbacks: WorkspaceActionCallbacks;
}

export function useWorkspaceActionItems({ workspaceId, permissions, callbacks }: UseWorkspaceActionItemsParams): WorkspaceActionItem[] {
  const intl = useIntl();
  const hasM4Flag = useWorkspacesFlag('m4');
  const perms = permissions ?? EMPTY_PERMISSIONS;

  // Children check is computed internally — callers cannot bypass it.
  // Fail-closed: disable delete when workspace data is unavailable.
  // Query is disabled when workspaceId is undefined to avoid API calls without a valid ID.
  const { data: workspaceList, isLoading, isError } = useWorkspacesQuery({}, { enabled: !!workspaceId });
  const allWorkspaces = workspaceList?.data ?? [];
  const hasChildren = isLoading || isError || !workspaceId || allWorkspaces.some((ws) => ws.parent_id === workspaceId);

  return useMemo(() => {
    const items: WorkspaceActionItem[] = [];

    if (callbacks.onEdit) {
      items.push({
        key: 'edit_workspace',
        label: intl.formatMessage(messages.workspacesActionEditWorkspace),
        onClick: callbacks.onEdit,
        isDisabled: !perms.edit,
      });
    }

    if (callbacks.onGrantAccess) {
      items.push({
        key: 'grant_access',
        label: intl.formatMessage(messages.workspacesActionGrantAccessToWorkspace),
        onClick: callbacks.onGrantAccess,
        isDisabled: !perms.create || !hasM4Flag,
      });
    }

    if (callbacks.onCreateSibling) {
      items.push({
        key: 'create_sibling_workspace',
        label: intl.formatMessage(messages.workspacesActionCreateSiblingWorkspace),
        onClick: callbacks.onCreateSibling,
        isDisabled: !perms.create,
      });
    }

    if (callbacks.onCreateSub) {
      items.push({
        key: 'create_subworkspace',
        label: intl.formatMessage(messages.workspacesActionCreateSubWorkspace),
        onClick: callbacks.onCreateSub,
        isDisabled: !perms.create,
      });
    }

    if (callbacks.onMove) {
      items.push({
        key: 'move_workspace',
        label: intl.formatMessage(messages.workspacesActionMoveWorkspace),
        onClick: callbacks.onMove,
        isDisabled: !perms.move,
      });
    }

    if (callbacks.onDelete) {
      const deleteDisabled = hasChildren || !perms.delete;
      items.push({
        key: 'separator',
        label: '',
        onClick: () => {},
        isDisabled: false,
        isSeparator: true,
      });
      items.push({
        key: 'delete_workspace',
        label: intl.formatMessage(messages.workspacesActionDeleteWorkspace),
        onClick: callbacks.onDelete,
        isDisabled: deleteDisabled,
        isDanger: !deleteDisabled,
      });
    }

    return items;
  }, [intl, perms, hasM4Flag, callbacks, hasChildren]);
}
