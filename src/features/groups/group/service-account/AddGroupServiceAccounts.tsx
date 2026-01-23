import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';

import { ServiceAccount } from '../../../../redux/service-accounts/types';
import messages from '../../../../Messages';
import { AppLink } from '../../../../components/navigation/AppLink';
import { addServiceAccountsToGroup, fetchGroup, invalidateSystemGroup } from '../../../../redux/groups/actions';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../../utilities/constants';
import { ServiceAccountsList } from '../../add-group/components/stepServiceAccounts/ServiceAccountsList';
import { DefaultGroupChangeModal } from '../../components/DefaultGroupChangeModal';
import { getModalContainer } from '../../../../helpers/modal-container';

interface AddGroupServiceAccountsProps {
  postMethod: (promise?: Promise<unknown>) => void;
  isDefault?: boolean;
  isChanged?: boolean;
  onDefaultGroupChanged?: (show: boolean) => void;
  fetchUuid?: string;
  groupName?: string;
}

export interface PaginationProps {
  count?: number;
  limit: number;
  offset: number;
}

const AddGroupServiceAccounts: React.FunctionComponent<AddGroupServiceAccountsProps> = ({
  postMethod,
  isDefault,
  isChanged,
  onDefaultGroupChanged,
  fetchUuid,
  groupName: name,
}: AddGroupServiceAccountsProps) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { groupId: uuid } = useParams();
  const [selectedAccounts, setSelectedAccounts] = useState<ServiceAccount[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  // NOTE: Avoid composite selector objects here; Storybook test runner treats unstable selector
  // return values as critical warnings. We only need the UUID.
  const systemGroupUuid = useSelector(
    ({ groupReducer }: { groupReducer: { systemGroup?: { uuid: string } } }) => groupReducer.systemGroup?.uuid,
  );

  // Use fetchUuid for default groups, otherwise use route param
  const groupId = isDefault && fetchUuid ? fetchUuid : uuid;

  useEffect(() => {
    if (!name && groupId) {
      dispatch(fetchGroup(groupId));
    }
  }, [name, groupId, dispatch]);

  const onCancel = () => {
    postMethod();
  };

  const onSubmit = () => {
    // If this is a default group that hasn't been changed yet, show confirmation modal
    if (isDefault && !isChanged) {
      setShowConfirmModal(true);
      return;
    }

    handleAddServiceAccounts();
  };

  const handleAddServiceAccounts = () => {
    const targetGroupId = groupId === DEFAULT_ACCESS_GROUP_ID ? systemGroupUuid : groupId;
    if (targetGroupId) {
      const action = addServiceAccountsToGroup(targetGroupId, selectedAccounts);
      dispatch(action);
      postMethod(action.payload);
    }
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
    dispatch(invalidateSystemGroup());
    // Show the alert that the default group has been changed
    if (onDefaultGroupChanged) {
      onDefaultGroupChanged(true);
    }
    handleAddServiceAccounts();
  };

  return (
    <>
      <Modal
        isOpen
        className="rbac"
        variant={ModalVariant.medium}
        title={intl.formatMessage(messages.addServiceAccount)}
        appendTo={getModalContainer()}
        actions={[
          <Button key="confirm" ouiaId="primary-confirm-button" isDisabled={selectedAccounts.length === 0} variant="primary" onClick={onSubmit}>
            {intl.formatMessage(messages.addToGroup)}
          </Button>,
          <Button ouiaId="secondary-cancel-button" key="cancel" variant="link" onClick={onCancel}>
            {intl.formatMessage(messages.cancel)}
          </Button>,
        ]}
        onClose={onCancel}
      >
        <Stack hasGutter>
          <StackItem>
            <Content>
              {intl.formatMessage(messages.addServiceAccountsToGroupDescription)}
              <Alert
                className="pf-v6-u-mt-sm rbac-service-accounts-alert"
                variant="info"
                component="span"
                isInline
                isPlain
                title={intl.formatMessage(messages.visitServiceAccountsPage, {
                  link: (
                    <AppLink to="/service-accounts" linkBasename="/iam">
                      {intl.formatMessage(messages.serviceAccountsPage)}
                    </AppLink>
                  ),
                })}
              />
            </Content>
          </StackItem>
          <StackItem className="rbac-add-service-account-modal">
            <ServiceAccountsList
              initialSelectedServiceAccounts={selectedAccounts}
              onSelect={setSelectedAccounts}
              groupId={groupId === DEFAULT_ACCESS_GROUP_ID ? systemGroupUuid : groupId}
            />
          </StackItem>
        </Stack>
      </Modal>

      <DefaultGroupChangeModal isOpen={showConfirmModal} onSubmit={handleConfirm} onClose={() => setShowConfirmModal(false)} />
    </>
  );
};

export default AddGroupServiceAccounts;
