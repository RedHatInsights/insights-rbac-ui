import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { ButtonVariant } from '@patternfly/react-core';
import React, { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams, useSearchParams } from 'react-router-dom';

import { useGroupQuery, useGroupServiceAccountsQuery, useRemoveServiceAccountsFromGroupMutationV1 } from '../../../../data/queries/groups';
import messages from '../../../../Messages';

type RemoveGroupServiceAccountsProps = {
  cancelRoute: string;
  submitRoute: string;
  postMethod: () => void;
};

const RemoveServiceAccountFromGroup: React.FunctionComponent<RemoveGroupServiceAccountsProps> = ({ postMethod }) => {
  const { groupId } = useParams<{ groupId: string }>();
  const [params] = useSearchParams();
  const intl = useIntl();

  // Fetch group data via React Query
  const { data: group } = useGroupQuery(groupId ?? '', { enabled: !!groupId });

  // Fetch service accounts to get names
  const { data: serviceAccountsData } = useGroupServiceAccountsQuery(groupId ?? '', {}, { enabled: !!groupId });

  // Get UUIDs from URL params
  const selectedServiceAccountUUIDs = useMemo(() => {
    return params.getAll('uuid');
  }, [params]);

  const accountsCount = selectedServiceAccountUUIDs.length;

  // For singular case, try to get name from service accounts data
  const firstServiceAccountName = useMemo(() => {
    if (accountsCount === 1 && serviceAccountsData?.data) {
      const serviceAccount = serviceAccountsData.data.find((sa) => sa.uuid === selectedServiceAccountUUIDs[0]);
      return serviceAccount?.name || 'service account';
    }
    return 'service account';
  }, [accountsCount, selectedServiceAccountUUIDs, serviceAccountsData]);

  // Remove mutation - handles notifications and cache invalidation
  const removeServiceAccountsMutation = useRemoveServiceAccountsFromGroupMutationV1();

  const handleConfirm = async () => {
    if (!groupId) return;

    try {
      await removeServiceAccountsMutation.mutateAsync({
        groupId,
        serviceAccounts: selectedServiceAccountUUIDs,
      });
      postMethod();
    } catch (error) {
      // Error notification is handled by the mutation
      console.error('Failed to remove service accounts:', error);
      postMethod();
    }
  };

  return (
    <WarningModal
      isOpen
      withCheckbox
      title={intl.formatMessage(messages.removeGroupServiceAccountsQuestion, { count: accountsCount })}
      confirmButtonLabel={intl.formatMessage(messages.removeServiceAccounts, { count: accountsCount })}
      confirmButtonVariant={ButtonVariant.danger}
      onClose={() => postMethod()}
      onConfirm={handleConfirm}
    >
      <FormattedMessage
        {...messages.removeServiceAccountsText}
        values={{
          b: (text) => <b>{text}</b>,
          count: accountsCount,
          name: firstServiceAccountName,
          group: group?.name ?? '',
        }}
      />
    </WarningModal>
  );
};

export default RemoveServiceAccountFromGroup;
