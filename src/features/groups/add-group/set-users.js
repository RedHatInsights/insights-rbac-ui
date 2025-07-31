import React, { Fragment, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { useFlag } from '@unleash/proxy-client-react';
import { Form, FormGroup, Stack, StackItem, TextContent } from '@patternfly/react-core';
import useFieldApi from '@data-driven-forms/react-form-renderer/use-field-api';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import UsersList from './users-list';
import UsersListItless from './users-list-itless';
import { ActiveUsers } from '../../../components/user-management/ActiveUsers';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';
import '../../../App.scss';

const SetUsers = (props) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const { input } = useFieldApi(props);
  const intl = useIntl();
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
    ...(!isITLess && { linkDescription: intl.formatMessage(messages.toManageUsersText) }),
  };

  const usersListProps = {
    selectedUsers,
    setSelectedUsers,
    displayNarrow: true,
  };

  return (
    <Fragment>
      <Form>
        <Stack hasGutter>
          <StackItem>
            <TextContent>
              <ActiveUsers {...activeUserProps} />
            </TextContent>
          </StackItem>
          <StackItem>
            <FormGroup fieldId="select-user">{isITLess ? <UsersListItless {...usersListProps} /> : <UsersList {...usersListProps} />}</FormGroup>
          </StackItem>
        </Stack>
      </Form>
    </Fragment>
  );
};

SetUsers.propTypes = {
  selectedUsers: PropTypes.array,
  setSelectedUsers: PropTypes.func,
  title: PropTypes.string,
  description: PropTypes.string,
};

export default SetUsers;
