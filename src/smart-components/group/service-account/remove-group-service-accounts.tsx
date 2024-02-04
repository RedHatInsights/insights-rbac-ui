import React, { useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage, useIntl } from 'react-intl';
import { useSearchParams } from 'react-router-dom';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { removeServiceAccountFromGroup } from '../../../redux/actions/group-actions';
import messages from '../../../Messages';
import { ButtonVariant } from '@patternfly/react-core';

type AddGroupServiceAccountsProps = {
  cancelRoute: string;
  submitRoute: string;
  postMethod: (promise?: any) => void;
};

type RBACStore = {
  groupReducer: {
    selectedGroup: {
      uuid: string;
      name: string;
      serviceAccounts?: {
        data: { name: string }[];
      };
    };
  };
};

const RemoveServiceAccountFromGroup: React.FunctionComponent<AddGroupServiceAccountsProps> = ({ postMethod }: AddGroupServiceAccountsProps) => {
  const group = useSelector<RBACStore, { name: string; uuid: string }>(({ groupReducer: { selectedGroup } }) => selectedGroup);
  const [params] = useSearchParams();
  const selectedServiceAccounts = useSelector<RBACStore, { name: string }[]>(({ groupReducer: { selectedGroup } }) =>
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
      confirmButtonLabel={intl.formatMessage(messages.remove)}
      confirmButtonVariant={ButtonVariant.danger}
      onClose={postMethod}
      onConfirm={() => {
        const action = removeServiceAccountFromGroup(group.uuid, selectedServiceAccounts);
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
