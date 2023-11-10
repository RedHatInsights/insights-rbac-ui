import React from 'react';
import RemoveModal from '../../../presentational-components/shared/RemoveModal';
import { useDispatch, useSelector } from 'react-redux';
import { FormattedMessage } from 'react-intl';
import messages from '../../../Messages';
import { useSearchParams } from 'react-router-dom';
import { removeServiceAccountFromGroup } from '../../../redux/actions/group-actions';

type AddGroupServiceAccountsProps = {
  cancelRoute: string;
  submitRoute: string;
  postMethod: () => void;
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
  const dispatch = useDispatch();
  return (
    <RemoveModal
      title={`Remove service account from group ${group.name}`}
      text={
        <FormattedMessage
          {...messages.removeServiceAccountsText}
          values={{
            b: (text) => <b>{text}</b>,
            count: params.getAll('name').length,
            name: selectedServiceAccounts[0].name,
            group: group.name,
          }}
        />
      }
      confirmButtonLabel="Remove"
      withCheckbox
      onClose={() => postMethod()}
      onSubmit={() => {
        dispatch(removeServiceAccountFromGroup(group.uuid, selectedServiceAccounts));
        postMethod();
      }}
      isOpen={true}
    />
  );
};

export default RemoveServiceAccountFromGroup;
