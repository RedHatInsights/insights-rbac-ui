import React from 'react';
import { useIntl } from 'react-intl';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Stack, StackItem } from '@patternfly/react-core';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import { List, ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { useGroupsQuery } from '../../../../data/queries/groups';
import { useRolesQuery } from '../../../../data/queries/roles';
import messages from '../../../../Messages';

const ReviewSelection: React.FC = () => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const { values } = formOptions.getState();

  // React Query hooks
  const { data: groupsData } = useGroupsQuery({ limit: 1000 });
  const { data: rolesData } = useRolesQuery({ limit: 1000 });

  const groups = React.useMemo(() => groupsData?.data ?? [], [groupsData?.data]);
  const roles = React.useMemo(() => rolesData?.data ?? [], [rolesData?.data]);

  const selectedUserGroups = values['selected-user-groups'] || [];
  const selectedRoles = values['selected-roles'] || [];

  const selectedGroupObjects = groups.filter((group) => selectedUserGroups.includes(group.uuid));
  const selectedRoleObjects = roles.filter((role) => selectedRoles.includes(role.uuid));

  return (
    <Stack hasGutter>
      <StackItem>
        <Content>
          <Content component={ContentVariants.h3}>{intl.formatMessage(messages.selectedUserGroups)}</Content>
          {selectedGroupObjects.length > 0 ? (
            <List>
              {selectedGroupObjects.map((group) => (
                <ListItem key={group.uuid}>
                  <Content component={ContentVariants.p}>
                    <strong>{group.name}</strong>
                  </Content>
                </ListItem>
              ))}
            </List>
          ) : (
            <Content component={ContentVariants.p}>{intl.formatMessage(messages.noUserGroupsSelected)}</Content>
          )}
        </Content>
      </StackItem>
      <StackItem>
        <Content>
          <Content component={ContentVariants.h3}>{intl.formatMessage(messages.selectedRoles)}</Content>
          {selectedRoleObjects.length > 0 ? (
            <List>
              {selectedRoleObjects.map((role) => (
                <ListItem key={role.uuid}>
                  <Content component={ContentVariants.p}>
                    <strong>{role.display_name || role.name}</strong>
                  </Content>
                  {role.description && <Content component={ContentVariants.small}>{role.description}</Content>}
                </ListItem>
              ))}
            </List>
          ) : (
            <Content component={ContentVariants.p}>{intl.formatMessage(messages.noRolesSelected)}</Content>
          )}
        </Content>
      </StackItem>
    </Stack>
  );
};

export default ReviewSelection;
