import React from 'react';
import { IntlShape } from 'react-intl';
import messages from '../../Messages';
import { Switch } from '@patternfly/react-core';
import { UserProps } from './user-table-helpers';

const ActivateToggle: React.FC<{
  user: UserProps;
  handleToggle: (_ev: unknown, isActive: boolean, updatedUsers: any[]) => void;
  intl: IntlShape;
  accountId?: string;
}> = ({ user, handleToggle, intl, accountId }) => {
  return user.external_source_id ? (
    <Switch
      id={user.username}
      key={user.uuid}
      isChecked={user.is_active}
      isDisabled={user.external_source_id + '' === accountId}
      onChange={(e, value) => handleToggle(e, value, [user])}
      label={intl.formatMessage(messages['usersAndUserGroupsActive'])}
      labelOff={intl.formatMessage(messages['usersAndUserGroupsInactive'])}
    ></Switch>
  ) : (
    <></>
  );
};

export default ActivateToggle;
