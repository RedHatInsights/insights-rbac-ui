import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { fetchSystemGroup, removeGroups } from '../../../redux/groups/actions';
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
      await dispatch(removeGroups([systemGroupUuid]));
      await dispatch(fetchSystemGroup({ chrome }));
      onDefaultGroupChangedHide();
    }
    onResetWarningHide();
    navigateToGroup(DEFAULT_ACCESS_GROUP_ID);
  }, [systemGroupUuid, dispatch, chrome, onDefaultGroupChangedHide, onResetWarningHide, navigateToGroup]);

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
