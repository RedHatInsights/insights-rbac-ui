import PageHeader from '@patternfly/react-component-groups/dist/esm/PageHeader';
import { PageSection } from '@patternfly/react-core';

import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import Messages from '../../../../../Messages';
import { FormRenderer, componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { FormTemplate } from '@data-driven-forms/pf4-component-mapper';
import {
  type Group,
  useAddMembersToGroupMutation,
  useAddServiceAccountsToGroupMutation,
  useCreateGroupMutation,
  useGroupMembersQuery,
  useGroupQuery,
  useGroupServiceAccountsQuery,
  useGroupsQuery,
  useRemoveMembersFromGroupMutation,
  useRemoveServiceAccountsFromGroupMutation,
  useUpdateGroupMutation,
} from '../../../../../data/queries/groups';

import { useParams } from 'react-router-dom';
import { EditGroupUsersAndServiceAccounts } from './EditUserGroupUsersAndServiceAccounts';
import { RbacBreadcrumbs } from '../../../../../components/navigation/Breadcrumbs';
import pathnames from '../../../../../utilities/pathnames';
import useAppNavigate from '../../../../../hooks/useAppNavigate';

interface EditUserGroupProps {
  createNewGroup?: boolean;
}

/**
 * Form values interface for the Edit User Group form.
 * Defines the shape of values passed to the submit handler.
 */
interface EditUserGroupFormValues {
  name: string;
  description?: string;
  'users-and-service-accounts'?: {
    users: { initial: string[]; updated: string[] };
    serviceAccounts: { initial: string[]; updated: string[] };
  };
}

export const EditUserGroup: React.FunctionComponent<EditUserGroupProps> = ({ createNewGroup }) => {
  const intl = useIntl();
  const addNotification = useAddNotification();
  const params = useParams();
  const groupId = params.groupId;
  const navigate = useAppNavigate();

  const pageTitle = createNewGroup
    ? intl.formatMessage(Messages.usersAndUserGroupsCreateUserGroup)
    : intl.formatMessage(Messages.usersAndUserGroupsEditUserGroup);

  const [initialFormData, setInitialFormData] = useState<{
    name?: string;
    description?: string;
    users?: string[];
    serviceAccounts?: string[];
  } | null>(null);

  // Use React Query for data fetching
  const { data: allGroupsData, isLoading: isGroupsLoading } = useGroupsQuery({ limit: 1000, offset: 0, orderBy: 'name' }, { enabled: true });
  const { data: groupData, isLoading: isGroupLoading } = useGroupQuery(groupId || '', { enabled: !!groupId && !createNewGroup });
  const { data: membersData, isLoading: isMembersLoading } = useGroupMembersQuery(groupId || '', {}, { enabled: !!groupId && !createNewGroup });
  const { data: serviceAccountsData, isLoading: isServiceAccountsLoading } = useGroupServiceAccountsQuery(
    groupId || '',
    {},
    { enabled: !!groupId && !createNewGroup },
  );

  // Use React Query mutations
  const createGroupMutation = useCreateGroupMutation();
  const updateGroupMutation = useUpdateGroupMutation();
  const addMembersMutation = useAddMembersToGroupMutation();
  const removeMembersMutation = useRemoveMembersFromGroupMutation();
  const addServiceAccountsMutation = useAddServiceAccountsToGroupMutation();
  const removeServiceAccountsMutation = useRemoveServiceAccountsFromGroupMutation();

  // Extract data from typed query responses
  const allGroups: Group[] = allGroupsData?.data ?? [];
  const group = groupData;
  const groupUsers = membersData?.members ?? [];
  const groupServiceAccounts = serviceAccountsData?.data ?? [];

  const isLoading = isGroupsLoading || (groupId && !createNewGroup && (isGroupLoading || isMembersLoading || isServiceAccountsLoading));

  const breadcrumbsList = useMemo(
    () => [
      {
        title: intl.formatMessage(Messages.userGroups),
        to: pathnames['users-and-user-groups'].link(),
      },
      {
        title: pageTitle,
        isActive: true,
      },
    ],
    [intl, pageTitle],
  );

  // Update form data when group data changes
  useEffect(() => {
    if (group && !createNewGroup) {
      const newFormData = {
        name: group.name,
        description: group.description,
        users: groupUsers.map((user) => user.username),
        serviceAccounts: groupServiceAccounts.map((sa) => sa.clientId).filter(Boolean),
      };

      // Only update if the data actually changed
      setInitialFormData((prevData) => {
        if (
          !prevData ||
          prevData.name !== newFormData.name ||
          prevData.description !== newFormData.description ||
          JSON.stringify(prevData.users) !== JSON.stringify(newFormData.users) ||
          JSON.stringify(prevData.serviceAccounts) !== JSON.stringify(newFormData.serviceAccounts)
        ) {
          return newFormData;
        }
        return prevData;
      });
    } else if (createNewGroup && !initialFormData) {
      setInitialFormData({
        name: '',
        description: '',
        users: [],
        serviceAccounts: [],
      });
    }
  }, [group?.uuid, group?.name, group?.description, groupUsers.length, groupServiceAccounts.length, createNewGroup, initialFormData]);

  const schema = useMemo(
    () => ({
      fields: [
        {
          name: 'name',
          label: intl.formatMessage(Messages.name),
          component: componentTypes.TEXT_FIELD,
          validate: [
            { type: validatorTypes.REQUIRED },
            (value: string) => {
              if (value === initialFormData?.name) {
                return undefined;
              }

              const isDuplicate = allGroups.some(
                (existingGroup: Group) => existingGroup.name.toLowerCase() === value?.toLowerCase() && existingGroup.uuid !== groupId,
              );

              return isDuplicate ? intl.formatMessage(Messages.groupNameTakenTitle) : undefined;
            },
          ],
          initialValue: initialFormData?.name,
          isRequired: true,
        },
        {
          name: 'description',
          label: intl.formatMessage(Messages.description),
          component: componentTypes.TEXTAREA,
          initialValue: initialFormData?.description,
        },
        {
          name: 'users-and-service-accounts',
          component: 'users-and-service-accounts',
          groupId: groupId,
          initialUsers: initialFormData?.users || [],
          initialServiceAccounts: initialFormData?.serviceAccounts || [],
          initialValue: {
            users: {
              initial: initialFormData?.users || [],
              updated: initialFormData?.users || [],
            },
            serviceAccounts: {
              initial: initialFormData?.serviceAccounts || [],
              updated: initialFormData?.serviceAccounts || [],
            },
          },
        },
      ],
    }),
    [initialFormData, allGroups, groupId, intl],
  );

  const returnToPreviousPage = useCallback(() => {
    navigate(pathnames['user-groups'].link());
  }, [navigate]);

  const handleSubmit = async (values: EditUserGroupFormValues) => {
    try {
      let targetGroupId = groupId;

      if (createNewGroup) {
        // Create the group first and get the new group's UUID
        const newGroup = await createGroupMutation.mutateAsync({ name: values.name, description: values.description });
        targetGroupId = newGroup?.uuid;
        addNotification({
          variant: 'success',
          title: 'Group created successfully',
          description: 'The group has been created.',
        });
      } else if (groupId && (values.name !== group?.name || values.description !== group?.description)) {
        await updateGroupMutation.mutateAsync({ uuid: groupId, name: values.name, description: values.description });
        addNotification({
          variant: 'success',
          title: intl.formatMessage(Messages.editGroupSuccessTitle),
          description: intl.formatMessage(Messages.editGroupSuccessDescription),
        });
      }

      // Handle user and service account changes
      if (values['users-and-service-accounts'] && targetGroupId) {
        const { users, serviceAccounts } = values['users-and-service-accounts'];

        // Handle user additions/removals
        const addedUsers = users.updated.filter((user: string) => !users.initial.includes(user));
        const removedUsers = users.initial.filter((user: string) => !users.updated.includes(user));

        // Add new users to the group
        // GAP: Using guessed V1 API - POST /api/rbac/v1/groups/:uuid/principals/
        if (addedUsers.length > 0) {
          await addMembersMutation.mutateAsync({
            groupId: targetGroupId,
            usernames: addedUsers,
          });
        }

        // Remove users from the group
        // GAP: Using guessed V1 API - DELETE /api/rbac/v1/groups/:uuid/principals/
        if (removedUsers.length > 0) {
          await removeMembersMutation.mutateAsync({
            groupId: targetGroupId,
            usernames: removedUsers,
          });
        }

        // Handle service account additions/removals
        const addedServiceAccounts = serviceAccounts.updated.filter((serviceAccount: string) => !serviceAccounts.initial.includes(serviceAccount));
        const removedServiceAccounts = serviceAccounts.initial.filter((serviceAccount: string) => !serviceAccounts.updated.includes(serviceAccount));

        // Add new service accounts to the group
        // GAP: Using guessed V1-style API - POST /api/rbac/v1/groups/:uuid/service-accounts/
        if (addedServiceAccounts.length > 0) {
          await addServiceAccountsMutation.mutateAsync({
            groupId: targetGroupId,
            serviceAccounts: addedServiceAccounts,
          });
        }

        // Remove service accounts from the group
        // GAP: Using guessed V1-style API - DELETE /api/rbac/v1/groups/:uuid/service-accounts/
        if (removedServiceAccounts.length > 0) {
          await removeServiceAccountsMutation.mutateAsync({
            groupId: targetGroupId,
            serviceAccounts: removedServiceAccounts,
          });
        }
      }

      returnToPreviousPage();
    } catch (error) {
      console.error('Failed to save group:', error);
      addNotification({
        variant: 'danger',
        title: createNewGroup ? 'Error creating group' : intl.formatMessage(Messages.editGroupErrorTitle),
        description: createNewGroup ? 'There was an error creating the group.' : intl.formatMessage(Messages.editGroupErrorDescription),
      });
    }
  };

  return (
    <React.Fragment>
      <PageHeader title={pageTitle} breadcrumbs={<RbacBreadcrumbs breadcrumbs={breadcrumbsList} />} />
      <PageSection hasBodyWrapper data-ouia-component-id="edit-user-group-form" className="pf-v6-u-m-lg-on-lg" isWidthLimited>
        {isLoading || !initialFormData ? (
          <div style={{ textAlign: 'center' }}>
            <Spinner />
          </div>
        ) : (
          <FormRenderer
            schema={schema}
            componentMapper={{
              ...componentMapper,
              'users-and-service-accounts': EditGroupUsersAndServiceAccounts,
            }}
            onSubmit={handleSubmit}
            onCancel={returnToPreviousPage}
            FormTemplate={FormTemplate}
            FormTemplateProps={{
              disableSubmit: ['pristine', 'invalid'],
            }}
            debug={(values) => {
              console.log('values:', values);
            }}
          />
        )}
      </PageSection>
    </React.Fragment>
  );
};

// Export both named and default for feature containers
export default EditUserGroup;
