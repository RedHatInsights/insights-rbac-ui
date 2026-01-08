import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { fetchGroup, fetchSystemGroup, removeGroups } from '../../../redux/groups/actions';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../utilities/constants';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';

interface UseGroupActionsProps {
  groupId?: string;
  isPlatformDefault: boolean;
  location: any;
  systemGroupUuid?: string;
  chrome: any;
  onResetWarningHide: () => void;
  onDefaultGroupChangedHide: () => void;
  navigateToGroup: (groupId: string) => void;
}

/**
 * Custom hook for managing Group component actions and handlers
 * Handles dropdown actions, modal actions, and group operations
 */
export const useGroupActions = ({
  groupId,
  isPlatformDefault,
  location,
  systemGroupUuid,
  chrome,
  onResetWarningHide,
  onDefaultGroupChangedHide,
  navigateToGroup,
}: UseGroupActionsProps) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const addNotification = useAddNotification();

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
  const handleResetConfirm = useCallback(async () => {
    if (systemGroupUuid) {
      try {
        await dispatch(removeGroups([systemGroupUuid]));
        addNotification({
          variant: 'success',
          title: intl.formatMessage(messages.removeGroupSuccess),
        });
        await dispatch(fetchSystemGroup({ chrome }));
        // Fetch the restored group detail to update Redux state
        await dispatch(fetchGroup('system-default'));
        onDefaultGroupChangedHide();

        // Navigate to the restored system default group
        // After deletion, the system will recreate the default group with UUID 'system-default'
        // Since we're already on this route, the fetchGroup above ensures the state is updated
        navigateToGroup('system-default');
      } catch (error) {
        console.error('Failed to reset group:', error);
        addNotification({
          variant: 'danger',
          title: intl.formatMessage(messages.removeGroupError),
        });
      }
    }
    onResetWarningHide();
  }, [systemGroupUuid, dispatch, chrome, onDefaultGroupChangedHide, onResetWarningHide, navigateToGroup, addNotification, intl]);

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
