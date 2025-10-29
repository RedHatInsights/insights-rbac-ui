import React from 'react';
import { useSelector } from 'react-redux';
import { useIntl } from 'react-intl';
import useFormApi from '@data-driven-forms/react-form-renderer/use-form-api';
import { Stack, StackItem } from '@patternfly/react-core';
import { Text, TextContent, TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import { List, ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { RBACStore } from '../../../../redux/store';
import messages from '../../../../Messages';
import { Group } from '../../../../redux/groups/reducer';

const ReviewSelection: React.FC = () => {
  const intl = useIntl();
  const formOptions = useFormApi();
  const values = formOptions.getState().values;
  const { groups } = useSelector((state: RBACStore) => ({
    groups: state.groupReducer.groups?.data || [],
  }));
  const selectedUserGroups = values['selected-user-groups'] || [];
  const selectedGroupObjects = groups.filter((group: Group) => selectedUserGroups.includes(group.uuid));

  return (
    <Stack hasGutter>
      <StackItem>
        <TextContent>
          <Text component={TextVariants.h3}>{intl.formatMessage(messages.selectedUserGroups)}</Text>
          {selectedGroupObjects.length > 0 ? (
            <List>
              {selectedGroupObjects.map((group: Group) => (
                <ListItem key={group.uuid}>
                  <Text component={TextVariants.p}>
                    <strong>{group.name}</strong>
                  </Text>
                </ListItem>
              ))}
            </List>
          ) : (
            <Text component={TextVariants.p}>{intl.formatMessage(messages.noUserGroupsSelected)}</Text>
          )}
        </TextContent>
      </StackItem>
    </Stack>
  );
};

export default ReviewSelection;
