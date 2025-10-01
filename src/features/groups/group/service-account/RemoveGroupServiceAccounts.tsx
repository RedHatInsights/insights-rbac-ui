import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { ButtonVariant } from '@patternfly/react-core';
import React, { useMemo } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';

import { ServiceAccount } from '../../../../redux/service-accounts/types';
import messages from '../../../../Messages';
import { removeServiceAccountFromGroup } from '../../../../redux/groups/actions';

type AddGroupServiceAccountsProps = {
  cancelRoute: string;
  submitRoute: string;
  postMethod: (promise?: Promise<unknown>) => void;
};

type RBACStore = {
  groupReducer: {
    selectedGroup: {
      uuid: string;
      name: string;
      serviceAccounts?: {
        data: ServiceAccount[];
      };
    };
  };
};

const RemoveServiceAccountFromGroup: React.FunctionComponent<AddGroupServiceAccountsProps> = ({ postMethod }: AddGroupServiceAccountsProps) => {
  const group = useSelector<RBACStore, { name: string; uuid: string; serviceAccounts?: { data: ServiceAccount[] } }>(
    ({ groupReducer: { selectedGroup } }) => selectedGroup,
  );
  const [params] = useSearchParams();

  // Get UUIDs from URL params - no names needed
  const selectedServiceAccountUUIDs = useMemo(() => {
    const uuids = params.getAll('uuid');
    return uuids;
  }, [params]);

  const accountsCount = selectedServiceAccountUUIDs.length;

  // For singular case, try to get name from Redux state, fallback to generic name
  const firstServiceAccountName = useMemo(() => {
    if (accountsCount === 1 && group.serviceAccounts?.data) {
      const serviceAccount = group.serviceAccounts.data.find((sa) => sa.uuid === selectedServiceAccountUUIDs[0]);
      return serviceAccount?.name || 'service account';
    }
    return 'service account';
  }, [accountsCount, selectedServiceAccountUUIDs, group.serviceAccounts]);
  const dispatch = useDispatch();
  const intl = useIntl();

  return (
    <WarningModal
      isOpen
      withCheckbox
      title={intl.formatMessage(messages.removeGroupServiceAccountsQuestion, { count: accountsCount })}
      confirmButtonLabel={intl.formatMessage(messages.removeServiceAccounts, { count: accountsCount })}
      confirmButtonVariant={ButtonVariant.danger}
      onClose={() => postMethod()}
      onConfirm={() => {
        const action = removeServiceAccountFromGroup(group.uuid, selectedServiceAccountUUIDs);
        dispatch(action);
        postMethod(action.payload);
      }}
    >
      <FormattedMessage
        {...messages.removeServiceAccountsText}
        values={{
          b: (text) => <b>{text}</b>,
          count: accountsCount,
          name: firstServiceAccountName,
          group: group.name,
        }}
      />
    </WarningModal>
  );
};

export default RemoveServiceAccountFromGroup;
