import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import type { ServiceAccount } from '../../add-group/components/stepServiceAccounts/ServiceAccountsList';
import { useAddServiceAccountsToGroupMutationV1, useGroupQuery, useGroupsQuery } from '../../../../data/queries/groups';
import messages from '../../../../Messages';
import { ExternalLink } from '../../../../components/navigation/ExternalLink';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../../utilities/constants';
import { ServiceAccountsList } from '../../add-group/components/stepServiceAccounts/ServiceAccountsList';
import { DefaultGroupChangeModal } from '../../components/DefaultGroupChangeModal';
import { getModalContainer } from '../../../../helpers/modal-container';

interface AddGroupServiceAccountsProps {
  postMethod: () => void;
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
}) => {
  const intl = useIntl();
  const { groupId: uuid } = useParams();
  const [selectedAccounts, setSelectedAccounts] = useState<ServiceAccount[]>([]);
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  // Fetch system group UUID for default access group handling
  const { data: systemGroupData } = useGroupsQuery({ platformDefault: true, limit: 1 });
  const systemGroupUuid = systemGroupData?.data?.[0]?.uuid;

  // Use fetchUuid for default groups, otherwise use route param
  const groupId = isDefault && fetchUuid ? fetchUuid : uuid;

  // Fetch group data if name not provided
  useGroupQuery(groupId ?? '', { enabled: !name && !!groupId });

  // Add service accounts mutation
  const addServiceAccountsMutation = useAddServiceAccountsToGroupMutationV1();

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

  const handleAddServiceAccounts = async () => {
    const targetGroupId = groupId === DEFAULT_ACCESS_GROUP_ID ? systemGroupUuid : groupId;
    if (targetGroupId && selectedAccounts.length > 0) {
      try {
        await addServiceAccountsMutation.mutateAsync({
          groupId: targetGroupId,
          serviceAccounts: selectedAccounts.map((sa) => sa.clientId),
        });
        // Success notification is handled by the mutation
        postMethod();
      } catch (error) {
        // Error notification is handled by the mutation
        console.error('Failed to add service accounts:', error);
        postMethod();
      }
    } else {
      postMethod();
    }
  };

  const handleConfirm = () => {
    setShowConfirmModal(false);
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
                  link: <ExternalLink to="/service-accounts">{intl.formatMessage(messages.serviceAccountsPage)}</ExternalLink>,
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
