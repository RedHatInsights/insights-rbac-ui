import React from 'react';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Stack, StackItem } from '@patternfly/react-core';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import { List, ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { RBACStore } from '../../../../redux/store';
import messages from '../../../../Messages';
import { Group } from '../../../../redux/groups/reducer';
import { Role } from '../../../../redux/roles/reducer';

const ReviewSelection: React.FC = () => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const { values } = formOptions.getState();
  const { groups, roles } = useSelector((state: RBACStore) => ({
    groups: state.groupReducer.groups?.data || [],
    roles: state.roleReducer.rolesForWizard?.data || [],
  }));

  const selectedUserGroups = values['selected-user-groups'] || [];
  const selectedRoles = values['selected-roles'] || [];

  const selectedGroupObjects = groups.filter((group: Group) => selectedUserGroups.includes(group.uuid));
  const selectedRoleObjects = roles.filter((role: Role) => selectedRoles.includes(role.uuid));

  return (
    <Stack hasGutter>
      <StackItem>
        <Content>
          <Content component={ContentVariants.h3}>{intl.formatMessage(messages.selectedUserGroups)}</Content>
          {selectedGroupObjects.length > 0 ? (
            <List>
              {selectedGroupObjects.map((group: Group) => (
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
              {selectedRoleObjects.map((role: Role) => (
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
