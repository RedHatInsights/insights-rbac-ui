import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { ButtonVariant } from '@patternfly/react-core';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { fetchGroup, removeGroups } from '../../redux/groups/actions';
import { FormItemLoader } from '../../components/ui-states/LoaderPlaceholders';
import useAppNavigate from '../../hooks/useAppNavigate';

interface RemoveGroupModalProps {
  postMethod: (groupIds: string[], config: { limit?: number }) => Promise<unknown>;
  pagination?: { limit?: number };
  cancelRoute: string | { pathname: string; search: string };
  submitRoute?: string | { pathname: string; search: string };
}

export const RemoveGroupModal: React.FC<RemoveGroupModalProps> = ({ postMethod, pagination, cancelRoute, submitRoute = cancelRoute }) => {
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const { groupId = '' } = useParams<{ groupId: string }>();
  const groupsToRemove = groupId.split(',');
  const multipleGroups = groupsToRemove.length > 1;

  const { group, isLoading } = useSelector(
    ({ groupReducer }: { groupReducer: any }) => ({
      group: groupReducer?.selectedGroup,
      isLoading: groupsToRemove.length === 1 && !groupReducer?.selectedGroup?.loaded,
    }),
    shallowEqual,
  );

  useEffect(() => {
    groupsToRemove.length === 1 && (dispatch(fetchGroup(groupsToRemove[0])) as unknown);
  }, []);

  const onSubmit = async () => {
    try {
      // Remove groups and wait for completion
      await dispatch(removeGroups(groupsToRemove));

      // Call postMethod to refresh data
      await postMethod(groupsToRemove, { limit: pagination?.limit });

      // Navigate back to the route
      console.log('🔍 Navigating to submitRoute:', submitRoute);
      if (submitRoute) {
        navigate(submitRoute);
      } else {
        console.warn('⚠️ submitRoute is undefined, falling back to cancelRoute');
        navigate(cancelRoute);
      }
    } catch (error) {
      console.error('Failed to remove groups:', error);
      // Still navigate back even if refresh fails
      try {
        if (submitRoute) {
          navigate(submitRoute);
        } else {
          navigate(cancelRoute);
        }
      } catch (navError) {
        console.error('Navigation error:', navError);
        // Last resort - navigate to groups list
        navigate('/groups');
      }
    }
  };

  const onCancel = () => {
    try {
      console.log('🔍 Navigating to cancelRoute:', cancelRoute);
      navigate(cancelRoute);
    } catch (navError) {
      console.error('Cancel navigation error:', navError);
      // Last resort - navigate to groups list
      navigate('/groups');
    }
  };

  if (isLoading) {
    return (
      <WarningModal
        title="Removing group"
        isOpen={true}
        confirmButtonLabel="Remove"
        confirmButtonVariant={ButtonVariant.danger}
        onClose={onCancel}
        onConfirm={() => {}}
      >
        <FormItemLoader />
      </WarningModal>
    );
  }

  return (
    <WarningModal
      title={multipleGroups ? `Remove ${groupsToRemove.length} groups?` : `Remove group "${group?.name || groupsToRemove[0]}"?`}
      isOpen={true}
      confirmButtonLabel="Remove"
      confirmButtonVariant={ButtonVariant.danger}
      onClose={onCancel}
      onConfirm={onSubmit}
    >
      <TextContent>
        <Text>
          {multipleGroups ? (
            `This action will permanently delete ${groupsToRemove.length} groups and their associated data. This action cannot be undone.`
          ) : (
            <>
              This action will permanently delete group <b>{group?.name || groupsToRemove[0]}</b> and its associated data. This action cannot be
              undone.
            </>
          )}
        </Text>
      </TextContent>
    </WarningModal>
  );
};

export default RemoveGroupModal;
