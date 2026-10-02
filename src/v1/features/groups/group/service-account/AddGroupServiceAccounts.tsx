import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';

import type { ServiceAccount } from '../../add-group/components/stepServiceAccounts/ServiceAccountsList';
import { useAddServiceAccountsToGroupMutation, useGroupQuery, useGroupsQuery } from '../../../../../shared/data/queries/groups';

import { ExternalLink } from '../../../../../shared/components/navigation/ExternalLink';
import { DEFAULT_ACCESS_GROUP_ID } from '../../../../../shared/utilities/constants';
import { ServiceAccountsList } from '../../add-group/components/stepServiceAccounts/ServiceAccountsList';
import { DefaultGroupChangeModal } from '../../components/DefaultGroupChangeModal';
import { getModalContainer } from '../../../../../shared/helpers/modal-container';
import { commonMessages } from '../../../../../shared/messages/common';

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
  const addServiceAccountsMutation = useAddServiceAccountsToGroupMutation();

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
        title={intl.formatMessage({ id: 'addServiceAccount', defaultMessage: 'Add service account', description: 'Add service account label' })}
        appendTo={getModalContainer()}
        actions={[
          <Button key="confirm" ouiaId="primary-confirm-button" isDisabled={selectedAccounts.length === 0} variant="primary" onClick={onSubmit}>
            {intl.formatMessage({ id: 'addToGroup', defaultMessage: 'Add to group', description: 'Add to group label' })}
          </Button>,
          <Button ouiaId="secondary-cancel-button" key="cancel" variant="link" onClick={onCancel}>
            {intl.formatMessage(commonMessages.cancel)}
          </Button>,
        ]}
        onClose={onCancel}
      >
        <Stack hasGutter>
          <StackItem>
            <Content>
              {intl.formatMessage({
                id: 'addServiceAccountsToGroupDescription',
                defaultMessage:
                  'This list contains all service accounts associated with your Red Hat organization account. Select any service accounts you wish to associate with the User Access group.',
                description: 'Add service accounts to group description',
              })}
              <Alert
                className="pf-v6-u-mt-sm rbac-service-accounts-alert"
                variant="info"
                component="span"
                isInline
                isPlain
                title={intl.formatMessage(
                  {
                    id: 'visitServiceAccountsPage',
                    defaultMessage: 'To add, reset credentials, or delete service accounts visit the {link}.',
                    description: 'Visit service accounts page text',
                  },
                  {
                    link: (
                      <ExternalLink to="/service-accounts">
                        {intl.formatMessage({
                          id: 'serviceAccountsPage',
                          defaultMessage: 'Service Accounts admin page',
                          description: 'Service accounts page message',
                        })}
                      </ExternalLink>
                    ),
                  },
                )}
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
