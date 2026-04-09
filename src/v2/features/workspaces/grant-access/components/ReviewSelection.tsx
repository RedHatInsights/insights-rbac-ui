import React from 'react';
import { useIntl } from 'react-intl';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Stack, StackItem } from '@patternfly/react-core';
import { Content, ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { List, ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { useGroupsQuery } from '../../../../../v2/data/queries/groups';
import { useAllRolesV2Query } from '../../../../data/queries/roles';
import messages from '../../../../../Messages';

const ReviewSelection: React.FC<{ workspaceId?: string; resourceType?: string }> = ({ workspaceId, resourceType }) => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const { values } = formOptions.getState();

  const { data: groupsData } = useGroupsQuery({ limit: 1000 });
  const { data: roles = [] } = useAllRolesV2Query({
    resourceType,
    resourceId: workspaceId,
  });

  const groups = groupsData?.data ?? [];

  const selectedUserGroups = values['selected-user-groups'] || [];
  const selectedRoles = values['selected-roles'] || [];

  const selectedGroupObjects = groups.filter((group) => selectedUserGroups.includes(group.uuid));
  const selectedRoleObjects = roles.filter((role) => role.id && selectedRoles.includes(role.id));

  return (
    <Stack hasGutter>
      <StackItem>
        <Title headingLevel="h2" size="xl" className="pf-v6-u-mb-md">
          {intl.formatMessage(messages.review)}
        </Title>
      </StackItem>
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
                <ListItem key={role.id}>
                  <Content component={ContentVariants.p}>
                    <strong>{role.name}</strong>
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
