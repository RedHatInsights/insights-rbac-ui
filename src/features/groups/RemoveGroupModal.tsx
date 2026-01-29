import React from 'react';
import { useParams } from 'react-router-dom';
import { ButtonVariant } from '@patternfly/react-core';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';

import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { useDeleteGroupMutation, useGroupQuery } from '../../data/queries/groups';
import { FormItemLoader } from '../../components/ui-states/LoaderPlaceholders';
import useAppNavigate from '../../hooks/useAppNavigate';
import { getModalContainer } from '../../helpers/modal-container';
import pathnames from '../../utilities/pathnames';

interface RemoveGroupModalProps {
  cancelRoute: string | { pathname: string; search: string };
  submitRoute?: string | { pathname: string; search: string };
}

export const RemoveGroupModal: React.FC<RemoveGroupModalProps> = ({ cancelRoute, submitRoute = cancelRoute }) => {
  const navigate = useAppNavigate();
  const { groupId = '' } = useParams<{ groupId: string }>();
  const groupsToRemove = groupId.split(',');
  const multipleGroups = groupsToRemove.length > 1;

  // Fetch single group for name display (only if single group)
  const { data: group, isLoading } = useGroupQuery(groupsToRemove[0], {
    enabled: groupsToRemove.length === 1,
  });

  // Delete mutation
  const deleteGroupMutation = useDeleteGroupMutation();

  const onSubmit = async () => {
    try {
      // Remove all groups using the mutation
      // Note: Notifications are handled by the mutation's onSuccess/onError
      for (const uuid of groupsToRemove) {
        await deleteGroupMutation.mutateAsync(uuid);
      }

      // Navigate to submit route - cache invalidation is handled by mutation
      navigate(submitRoute);
    } catch (error) {
      console.error('Failed to remove groups:', error);
      // Still navigate back even on error (notification already shown by mutation)
      navigate(cancelRoute);
    }
  };

  const onCancel = () => {
    try {
      navigate(cancelRoute);
    } catch (navError) {
      console.error('Cancel navigation error:', navError);
      // Last resort - navigate to groups list
      navigate(pathnames.groups.link());
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
        appendTo={getModalContainer()}
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
      appendTo={getModalContainer()}
    >
      <Content>
        <Content component="p">
          {multipleGroups ? (
            `This action will permanently delete ${groupsToRemove.length} groups and their associated data. This action cannot be undone.`
          ) : (
            <>
              This action will permanently delete group <b>{group?.name || groupsToRemove[0]}</b> and its associated data. This action cannot be
              undone.
            </>
          )}
        </Content>
      </Content>
    </WarningModal>
  );
};

export default RemoveGroupModal;
