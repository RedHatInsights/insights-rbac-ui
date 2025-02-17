import React, { useEffect, useState } from 'react';
import { IntlShape } from 'react-intl';
import messages from '../../Messages';
import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { useDispatch } from 'react-redux';
import { changeUsersStatus } from '../../redux/actions/user-actions';
import { Switch } from '@patternfly/react-core';
import { UserProps } from './user-table-helpers';

const ActivateToggle: React.FC<{
  user: UserProps;
  intl: IntlShape;
}> = ({ user, intl }) => {
  const { auth, isProd } = useChrome();
  const [isChecked, setIsChecked] = React.useState<boolean>(user.is_active);
  const [isDisabled, setIsDisabled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);
  const [accountId, setAccountId] = useState<string | null>(null);
  const [accountUsername, setAccountUsername] = useState<string | null>(null);
  const dispatch = useDispatch();

  useEffect(() => {
    const getToken = async () => {
      setAccountId((await auth.getUser())?.identity?.internal?.account_id as string);
      setAccountUsername((await auth.getUser())?.identity?.user?.username as string);
      setToken((await auth.getToken()) as string);
    };
    getToken();
  }, [auth]);

  useEffect(() => {
    if (accountUsername === user.username) {
      setIsDisabled(true);
    }
  }, [user.username, accountUsername]);

  const handleToggle = async (_event: React.FormEvent<HTMLInputElement>, checked: boolean) => {
    if (loading) return;
    setLoading(true);

    try {
      dispatch(
        changeUsersStatus(
          [
            {
              ...user,
              id: user.external_source_id,
              is_active: checked,
            },
          ],
          { isProd: isProd(), token, accountId }
        )
      );
      setIsChecked(checked);
    } catch (error) {
      console.error('Failed to update active status: ', error);
    } finally {
      setLoading(false);
    }
  };

  return user.external_source_id ? (
    <Switch
      id={user.username}
      key={user.uuid}
      isChecked={isChecked}
      isDisabled={isDisabled}
      onChange={handleToggle}
      label={intl.formatMessage(messages['usersAndUserGroupsActive'])}
      labelOff={intl.formatMessage(messages['usersAndUserGroupsInactive'])}
    ></Switch>
  ) : (
    <></>
  );
};

export default ActivateToggle;
