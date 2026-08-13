import React, { useCallback, useEffect, useState } from 'react';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { useFedRAMPMode } from '../../../../../../capabilities/useFedRAMPMode';
import { UsersList } from './UsersList';
import { ActiveUsers } from '../../../../../components/user-management/ActiveUsers';
import type { User } from './types';

interface SetUsersProps {
  name: string;
  // Data-driven-forms pass-through props
  input?: { onChange: (value: unknown) => void; value: unknown };
  meta?: { error?: string; touched?: boolean };
  [key: string]: unknown;
}

export const SetUsers: React.FC<SetUsersProps> = (props) => {
  const formOptions = useFormApi();
  const [selectedUsers, setSelectedUsers] = useState<User[]>(formOptions.getState().values['users-list'] || []);
  const { input } = useFieldApi(props);
  const isITLess = useFedRAMPMode();

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
