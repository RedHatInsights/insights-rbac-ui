import PageHeader from '@patternfly/react-component-groups/dist/esm/PageHeader';
import { ActionGroup, PageSection } from '@patternfly/react-core';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { Checkbox } from '@patternfly/react-core/dist/dynamic/components/Checkbox';
import { Form } from '@patternfly/react-core/dist/dynamic/components/Form';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import Messages from '../../../../../../Messages';
import { FormRenderer, componentTypes, useFormApi, validatorTypes } from '@data-driven-forms/react-form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import type FormTemplateCommonProps from '@data-driven-forms/common/form-template';
import {
  type Group,
  useAddMembersToGroupMutation,
  useAddServiceAccountsToGroupMutation,
  useCreateGroupMutation,
  useDeleteGroupMutation,
  useGroupMembersQuery,
  useGroupQuery,
  useGroupServiceAccountsQuery,
  useGroupsQuery,
  useRemoveMembersFromGroupMutation,
  useRemoveServiceAccountsFromGroupMutation,
  useUpdateGroupMutation,
} from '../../../../../../v2/data/queries/groups';

import { useParams } from 'react-router-dom';
import { EditGroupUsersAndServiceAccounts } from './EditUserGroupUsersAndServiceAccounts';
import { RbacBreadcrumbs } from '../../../../../../shared/components/navigation/Breadcrumbs';
import pathnames from '../../../../../utilities/pathnames';
import useAppNavigate from '../../../../../../shared/hooks/useAppNavigate';
import { GroupResetWarningModal } from '../../../components/GroupResetWarningModal';

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

  // State for default group safeguard
  const [defaultGroupAcknowledged, setDefaultGroupAcknowledged] = useState(false);

  // State for restore modal
  const [isRestoreModalOpen, setIsRestoreModalOpen] = useState(false);

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
  const deleteGroupMutation = useDeleteGroupMutation();
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

  // Hard block: Redirect away if trying to edit admin_default group
  useEffect(() => {
    if (group?.admin_default && !createNewGroup) {
      addNotification({
        variant: 'warning',
        title: 'Cannot edit Default admin access group',
        description: 'The Default admin access group cannot be edited. This is a system-managed group.',
      });
      navigate(pathnames['user-groups'].link());
    }
  }, [group?.admin_default, createNewGroup, addNotification, navigate]);

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

  // Determine if this is a default group and its state
  const isUnmodifiedPlatformDefault = group?.platform_default && group?.system && !createNewGroup;
  const isCustomizedPlatformDefault = group?.platform_default && !group?.system && !createNewGroup;

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
    [initialFormData, allGroups, groupId, intl, isUnmodifiedPlatformDefault],
  );

  const returnToPreviousPage = useCallback(() => {
    navigate(pathnames['user-groups'].link());
  }, [navigate]);

  // Helper function to check if form values have changed from initial data
  const checkFormHasChanges = useCallback(
    (values: Record<string, unknown>) => {
      if (!initialFormData) {
        return false;
      }

      const nameChanged = values.name !== initialFormData.name;
      const descriptionChanged = values.description !== initialFormData.description;

      // For users and service accounts, compare the 'updated' arrays
      const usersAndSA = values['users-and-service-accounts'] as
        | { users?: { updated?: string[] }; serviceAccounts?: { updated?: string[] } }
        | undefined;
      const currentUsers = usersAndSA?.users?.updated || [];
      const currentServiceAccounts = usersAndSA?.serviceAccounts?.updated || [];
      const initialUsers = initialFormData.users || [];
      const initialServiceAccounts = initialFormData.serviceAccounts || [];

      const usersChanged = JSON.stringify([...currentUsers].sort()) !== JSON.stringify([...initialUsers].sort());
      const serviceAccountsChanged = JSON.stringify([...currentServiceAccounts].sort()) !== JSON.stringify([...initialServiceAccounts].sort());

      return nameChanged || descriptionChanged || usersChanged || serviceAccountsChanged;
    },
    [initialFormData],
  );

  // Custom FormTemplate that includes the acknowledgement checkbox above the submit button
  const CustomFormTemplate = useCallback(
    (props: FormTemplateCommonProps) => {
      const { formFields } = props;

      // Use the DDF useFormApi hook to access form state
      const { getState, handleSubmit, onCancel } = useFormApi();
      const formState = getState();
      const values = formState?.values || {};
      const isFormInvalid = formState?.invalid ?? false;

      // Check if form has actual changes (calculated directly, not in useEffect)
      const hasFormChanges = checkFormHasChanges(values);

      // For platform_default groups: disabled if no changes OR invalid OR checkbox not checked
      // For other groups: disabled if no changes OR invalid
      const shouldDisable = isUnmodifiedPlatformDefault
        ? !hasFormChanges || isFormInvalid || !defaultGroupAcknowledged
        : !hasFormChanges || isFormInvalid;

      return (
        <Form onSubmit={handleSubmit}>
          {formFields as React.ReactNode}
          {isUnmodifiedPlatformDefault && (
            <div className="pf-v6-u-mb-md">
              <Checkbox
                id="default-group-acknowledgement"
                label="I understand that saving will customize the Default access group."
                isChecked={defaultGroupAcknowledged}
                onChange={(_event, checked) => setDefaultGroupAcknowledged(checked)}
              />
            </div>
          )}
          <ActionGroup>
            <Button variant="primary" type="submit" isDisabled={shouldDisable}>
              Submit
            </Button>
            <Button variant="link" onClick={onCancel}>
              Cancel
            </Button>
          </ActionGroup>
        </Form>
      );
    },
    [isUnmodifiedPlatformDefault, defaultGroupAcknowledged, checkFormHasChanges],
  );

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
        // Skip name/description update for unmodified default groups (system=true)
        // The backend will clone the group when we modify members/service accounts below
        if (!isUnmodifiedPlatformDefault) {
          await updateGroupMutation.mutateAsync({ uuid: groupId, name: values.name, description: values.description });
          addNotification({
            variant: 'success',
            title: intl.formatMessage(Messages.editGroupSuccessTitle),
            description: intl.formatMessage(Messages.editGroupSuccessDescription),
          });
        }
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

      // Show success notification for unmodified default groups after customization
      if (isUnmodifiedPlatformDefault && !createNewGroup) {
        addNotification({
          variant: 'success',
          title: 'Default access group customized',
          description: 'The group has been customized and is no longer managed by the system.',
        });
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

  const handleRestoreConfirm = async () => {
    if (!groupId) return;

    try {
      await deleteGroupMutation.mutateAsync(groupId);

      addNotification({
        variant: 'success',
        title: intl.formatMessage(Messages.restoreToDefault),
        description: 'The Default access group has been restored to system defaults.',
      });

      setIsRestoreModalOpen(false);
      navigate(pathnames['user-groups'].link());
    } catch (error) {
      console.error('Failed to restore group:', error);
      addNotification({
        variant: 'danger',
        title: 'Error restoring group',
        description: 'There was an error restoring the Default access group.',
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
          <>
            {/* Alert for unmodified platform_default group */}
            {isUnmodifiedPlatformDefault && (
              <Alert variant="danger" isInline isExpandable={false} title="You are editing the Default access group" className="pf-v6-u-mb-md">
                <p>
                  Once saved, the system will no longer manage this group automatically and it will be renamed to{' '}
                  <strong>Custom default access</strong>.
                </p>
              </Alert>
            )}

            {/* Alert for customized platform_default group */}
            {isCustomizedPlatformDefault && (
              <Alert
                variant="info"
                isInline
                title="This group has been customized"
                className="pf-v6-u-mb-md"
                actionLinks={
                  <Button variant="link" isInline onClick={() => setIsRestoreModalOpen(true)}>
                    {intl.formatMessage(Messages.restoreToDefault)}
                  </Button>
                }
              >
                <p>This group has been customized from the Default access group. Changes here will not be reverted automatically.</p>
              </Alert>
            )}

            <FormRenderer
              schema={schema}
              componentMapper={{
                ...componentMapper,
                'users-and-service-accounts': EditGroupUsersAndServiceAccounts,
              }}
              onSubmit={handleSubmit}
              onCancel={returnToPreviousPage}
              FormTemplate={CustomFormTemplate}
            />
          </>
        )}
      </PageSection>

      {/* Restore warning modal */}
      <GroupResetWarningModal isOpen={isRestoreModalOpen} onClose={() => setIsRestoreModalOpen(false)} onConfirm={handleRestoreConfirm} />
    </React.Fragment>
  );
};

// Export both named and default for feature containers
export default EditUserGroup;
