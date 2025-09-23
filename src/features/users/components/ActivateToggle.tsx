import React from 'react';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';

interface UserProps {
  username: string;
  uuid: string;
  is_active: boolean;
  external_source_id?: number;
}

interface ActivateToggleProps {
  user: UserProps;
  onToggle: (isActive: boolean, user: UserProps) => void;
  accountId?: string;
}

export const ActivateToggle: React.FC<ActivateToggleProps> = ({ user, onToggle, accountId }) => {
  const intl = useIntl();

  return user.external_source_id ? (
    <Switch
      id={user.username}
      data-testid="user-status-toggle"
      key={user.uuid}
      isChecked={user.is_active}
      isDisabled={user.external_source_id + '' === accountId}
      onChange={(e, value) => onToggle(value, user)}
      label={intl.formatMessage(messages['usersAndUserGroupsActive'])}
      labelOff={intl.formatMessage(messages['usersAndUserGroupsInactive'])}
    />
  ) : (
    <></>
  );
};
