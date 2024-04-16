import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import { ButtonVariant } from '@patternfly/react-core';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { ServiceAccount } from '../../../helpers/service-account/service-account-helper';
import { removeServiceAccountFromGroup } from '../../../redux/actions/group-actions';
import messages from '../../../Messages';

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
    ({ groupReducer: { selectedGroup } }) => selectedGroup
  );
  const [params] = useSearchParams();
  const selectedServiceAccounts = useSelector<RBACStore, ServiceAccount[]>(({ groupReducer: { selectedGroup } }) =>
    (selectedGroup?.serviceAccounts?.data || []).filter(({ name }) => params.getAll('name').includes(name))
  );
  const accountsCount = useMemo(() => params.getAll('name').length, [params]);
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
        const action = removeServiceAccountFromGroup(
          group.uuid,
          selectedServiceAccounts.map((serviceAccount) => serviceAccount.clientID)
        );
        dispatch(action);
        postMethod(action.payload);
      }}
    >
      <FormattedMessage
        {...messages.removeServiceAccountsText}
        values={{
          b: (text) => <b>{text}</b>,
          count: accountsCount,
          name: selectedServiceAccounts[0]?.name,
          group: group.name,
        }}
      />
    </WarningModal>
  );
};

export default RemoveServiceAccountFromGroup;
