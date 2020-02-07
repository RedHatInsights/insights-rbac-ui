import React from 'react';
import { Stack, StackItem, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { TopToolbar, TopToolbarTitle } from '../../presentational-components/shared/top-toolbar';
import { Section } from '@redhat-cloud-services/frontend-components';
import UsersList from '../group/add-group/users-list';

const Users = () => {
  const isProd = window.insights.chrome.isProd;
  const description = (<TextContent>
    <Text>
    These are the users in your organization. To add new users to your organization go to{ ' ' }
      <Text
        component={ TextVariants.a }
        href={ `https://www.${isProd ? '' : 'qa.'}redhat.com/wapps/ugc/protected/usermgt/userList.html` }>
      user management list.
      </Text>
    </Text>
  </TextContent>);

  return (
    <Stack >
      <StackItem>
        <TopToolbar paddingBottm={ false }>
          <TopToolbarTitle
            title="Users"
            description={ description }
          />
        </TopToolbar>
      </StackItem>
      <StackItem>
        <Section type="content" id={ 'users' }>
          <UsersList
            props={ {
              isSelectable: false,
              isCompact: false
            } }
          />
        </Section>
      </StackItem>
    </Stack >
  );
};

Users.propTypes = {

};

Users.defaultProps = {

};

export default Users;
