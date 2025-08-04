import React, { Fragment, useEffect, useState } from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import { Form, Stack, StackItem } from '@patternfly/react-core';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { UsersList } from './UsersList';
import UsersListItless from './users-list-itless-legacy';
import { ActiveUsers } from '../../../components/user-management/ActiveUsers';
import type { User } from './types';
import '../../../App.scss';

interface SetUsersProps {
  name: string;
  // Data-driven-forms props
  input?: any;
  meta?: any;
  [key: string]: any;
}

export const SetUsers: React.FC<SetUsersProps> = (props) => {
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const { input } = useFieldApi(props);
  const formOptions = useFormApi();
  const isITLess = useFlag('platform.rbac.itless');

  useEffect(() => {
    setSelectedUsers(formOptions.getState().values['users-list'] || []);
  }, []);

  useEffect(() => {
    input.onChange(selectedUsers);
    formOptions.change('users-list', selectedUsers);
  }, [selectedUsers]);

  const activeUserProps = {
    linkDescription: 'Select users from your user access list to add to this group.',
  };

  return (
    <Fragment>
      <Form>
        <Stack hasGutter>
          <StackItem>
            {isITLess ? (
              <UsersListItless selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} displayNarrow={true} />
            ) : (
              <ActiveUsers {...activeUserProps}>
                <UsersList selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} displayNarrow={true} />
              </ActiveUsers>
            )}
          </StackItem>
        </Stack>
      </Form>
    </Fragment>
  );
};
