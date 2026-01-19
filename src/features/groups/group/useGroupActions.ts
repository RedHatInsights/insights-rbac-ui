import { useCallback } from 'react';
import { useLocation } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import { useIntl } from 'react-intl';
import { groupsKeys, useDeleteGroupMutation } from '../../../data/queries/groups';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../utilities/constants';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';

interface UseGroupActionsProps {
  groupId?: string;
  isPlatformDefault: boolean;
  systemGroupUuid?: string;
  onResetWarningHide: () => void;
  onDefaultGroupChangedHide: () => void;
  navigateToGroup: (groupId: string) => void;
}

/**
 * Custom hook for managing Group component actions and handlers
 * Handles dropdown actions, modal actions, and group operations
 *
 * Migrated from Redux to React Query.
 */
export const useGroupActions = ({
  groupId,
  isPlatformDefault,
  systemGroupUuid,
  onResetWarningHide,
  onDefaultGroupChangedHide,
  navigateToGroup,
}: UseGroupActionsProps) => {
  const intl = useIntl();
  const location = useLocation();
  const queryClient = useQueryClient();
  const deleteGroupMutation = useDeleteGroupMutation();

  // Generate URLs for dropdown actions
  const getEditUrl = useCallback(() => {
    return (location.pathname.includes('members') ? pathnames['group-members-edit-group'] : pathnames['group-roles-edit-group']).link.replace(
      ':groupId',
      isPlatformDefault ? DEFAULT_ACCESS_GROUP_ID : groupId || '',
    );
  }, [location.pathname, isPlatformDefault, groupId]);

  const getDeleteUrl = useCallback(() => {
    return (location.pathname.includes('members') ? pathnames['group-members-remove-group'] : pathnames['group-roles-remove-group']).link.replace(
      ':groupId',
      groupId || '',
    );
  }, [location.pathname, groupId]);

  // Handle reset warning confirmation
  // This removes the modified system group which triggers recreation of the default
  const handleResetConfirm = useCallback(async () => {
    if (systemGroupUuid) {
      try {
        // Delete the group - the mutation handles success/error notifications
        await deleteGroupMutation.mutateAsync(systemGroupUuid);

        // Invalidate all groups queries to refetch fresh data
        // The system will automatically recreate the default group
        await queryClient.invalidateQueries({ queryKey: groupsKeys.all });

        onDefaultGroupChangedHide();

        // Navigate to the restored system default group
        // After deletion, the system recreates the default group with UUID 'system-default'
        navigateToGroup('system-default');
      } catch (error) {
        // Error notification is handled by the mutation's onError
        console.error('Failed to reset group:', error);
      }
    }
    onResetWarningHide();
  }, [systemGroupUuid, deleteGroupMutation, queryClient, onDefaultGroupChangedHide, onResetWarningHide, navigateToGroup]);

  return {
    // Action URLs and labels
    editUrl: getEditUrl(),
    deleteUrl: getDeleteUrl(),
    editLabel: intl.formatMessage(messages.edit),
    deleteLabel: intl.formatMessage(messages.delete),

    // Actions
    handleResetConfirm,
  };
};
