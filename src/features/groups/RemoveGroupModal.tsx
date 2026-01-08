import React, { useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { ButtonVariant } from '@patternfly/react-core';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';

import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { fetchGroup, removeGroups } from '../../redux/groups/actions';
import messages from '../../Messages';
import { FormItemLoader } from '../../components/ui-states/LoaderPlaceholders';
import useAppNavigate from '../../hooks/useAppNavigate';
import { getModalContainer } from '../../helpers/modal-container';

interface RemoveGroupModalProps {
  postMethod: (groupIds: string[], config: { limit?: number }) => Promise<unknown>;
  pagination?: { limit?: number };
  cancelRoute: string | { pathname: string; search: string };
  submitRoute?: string | { pathname: string; search: string };
}

export const RemoveGroupModal: React.FC<RemoveGroupModalProps> = ({ postMethod, pagination, cancelRoute, submitRoute = cancelRoute }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const addNotification = useAddNotification();
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

      addNotification({
        variant: 'success',
        title: intl.formatMessage(multipleGroups ? messages.removeGroupsSuccess : messages.removeGroupSuccess),
      });

      // Call postMethod to refresh data
      await postMethod(groupsToRemove, { limit: pagination?.limit });

      // Navigate back to the route
      if (submitRoute) {
        navigate(submitRoute);
      } else {
        navigate(cancelRoute);
      }
    } catch (error) {
      console.error('Failed to remove groups:', error);
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(multipleGroups ? messages.removeGroupsError : messages.removeGroupError),
      });
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
