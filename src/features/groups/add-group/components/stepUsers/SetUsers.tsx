import React, { useCallback, useEffect, useState } from 'react';
import { useFlag } from '@unleash/proxy-client-react';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { UsersList } from './UsersList';
import { ActiveUsers } from '../../../../../components/user-management/ActiveUsers';
import type { User } from './types';

interface SetUsersProps {
  name: string;
  // Data-driven-forms props
  input?: any;
  meta?: any;
  [key: string]: any;
}

export const SetUsers: React.FC<SetUsersProps> = (props) => {
  const formOptions = useFormApi();
  const [selectedUsers, setSelectedUsers] = useState<User[]>(formOptions.getState().values['users-list'] || []);
  const { input } = useFieldApi(props);
  const isITLess = useFlag('platform.rbac.itless');

  useEffect(() => {
    input.onChange(selectedUsers);
    formOptions.change('users-list', selectedUsers);
  }, [selectedUsers]); // Remove unstable formOptions and input dependencies

  // Handle selection changes from UsersList - sync with form API
  const handleUserSelection = useCallback((users: User[]) => {
    setSelectedUsers(users);
  }, []);

  const activeUserProps = {
    linkDescription: 'Select users from your user access list to add to this group.',
  };

  return (
    <Stack hasGutter>
      <StackItem>
        {isITLess ? (
          <UsersList initialSelectedUsers={selectedUsers} onSelect={handleUserSelection} displayNarrow={true} />
        ) : (
          <ActiveUsers {...activeUserProps}>
            <UsersList initialSelectedUsers={selectedUsers} onSelect={handleUserSelection} displayNarrow={true} />
          </ActiveUsers>
        )}
      </StackItem>
    </Stack>
  );
};
