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
import { useDispatch, useSelector } from 'react-redux';
import { addGroup, fetchGroup, fetchGroups, updateGroup } from '../../../../../redux/groups/actions';
import { selectGroupMembers, selectGroupServiceAccounts, selectGroups, selectSelectedGroup } from '../../../../../redux/groups/selectors';
import { Group, Member, ServiceAccount } from '../../../../../redux/groups/reducer';

import { useParams } from 'react-router-dom';
import { EditGroupUsersAndServiceAccounts } from './EditUserGroupUsersAndServiceAccounts';
import { RbacBreadcrumbs } from '../../../../../components/navigation/Breadcrumbs';
import pathnames from '../../../../../utilities/pathnames';
import useAppNavigate from '../../../../../hooks/useAppNavigate';

interface EditUserGroupProps {
  createNewGroup?: boolean;
}

export const EditUserGroup: React.FunctionComponent<EditUserGroupProps> = ({ createNewGroup }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const addNotification = useAddNotification();
  const params = useParams();
  const groupId = params.groupId;
  const navigate = useAppNavigate();

  const pageTitle = createNewGroup
    ? intl.formatMessage(Messages.usersAndUserGroupsCreateUserGroup)
    : intl.formatMessage(Messages.usersAndUserGroupsEditUserGroup);

  const [isLoading, setIsLoading] = useState(true);
  const [initialFormData, setInitialFormData] = useState<{
    name?: string;
    description?: string;
    users?: string[];
    serviceAccounts?: string[];
  } | null>(null);

  // Memoized selectors to prevent unnecessary re-renders
  const group = useSelector(selectSelectedGroup);
  const allGroups = useSelector(selectGroups);
  const groupUsers = useSelector(selectGroupMembers);
  const groupServiceAccounts = useSelector(selectGroupServiceAccounts);

  const breadcrumbsList = useMemo(
    () => [
      {
        title: intl.formatMessage(Messages.userGroups),
        to: pathnames['users-and-user-groups'].link,
      },
      {
        title: pageTitle,
        isActive: true,
      },
    ],
    [intl, pageTitle],
  );

  const fetchData = useCallback(async () => {
    try {
      await Promise.all([
        dispatch(fetchGroups({ limit: 1000, offset: 0, orderBy: 'name', usesMetaInURL: true })),
        groupId ? dispatch(fetchGroup(groupId)) : Promise.resolve(),
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [dispatch, groupId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Update form data when group data changes
  useEffect(() => {
    if (group && !createNewGroup) {
      const newFormData = {
        name: group.name,
        description: group.description,
        users: groupUsers.map((user: Member) => user.username),
        serviceAccounts: groupServiceAccounts.map((sa: ServiceAccount) => sa.clientId).filter((clientId): clientId is string => Boolean(clientId)),
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

  const returnToPreviousPage = () => {
    navigate(pathnames['user-groups'].link);
  };

  const handleSubmit = async (values: Record<string, any>) => {
    try {
      if (createNewGroup) {
        await dispatch(addGroup({ name: values.name, description: values.description }));
        addNotification({
          variant: 'success',
          title: 'Group created successfully',
          description: 'The group has been created.',
        });
      } else if (groupId && (values.name !== group?.name || values.description !== group?.description)) {
        await dispatch(updateGroup({ uuid: groupId, name: values.name, description: values.description }));
        addNotification({
          variant: 'success',
          title: intl.formatMessage(Messages.editGroupSuccessTitle),
          description: intl.formatMessage(Messages.editGroupSuccessDescription),
        });
      }

      if (values['users-and-service-accounts']) {
        const { users, serviceAccounts } = values['users-and-service-accounts'];
        if (users.updated.length > 0) {
          const addedUsers = users.updated.filter((user: string) => !users.initial.includes(user));
          const removedUsers = users.initial.filter((user: string) => !users.updated.includes(user));
          console.log(`Users added: ${addedUsers} and removed: ${removedUsers}`);
        }
        if (serviceAccounts.updated.length > 0) {
          const addedServiceAccounts = serviceAccounts.updated.filter((serviceAccount: string) => !serviceAccounts.initial.includes(serviceAccount));
          const removedServiceAccounts = serviceAccounts.initial.filter(
            (serviceAccount: string) => !serviceAccounts.updated.includes(serviceAccount),
          );
          console.log(`Service accounts added: ${addedServiceAccounts} and removed: ${removedServiceAccounts}`);
        }
        returnToPreviousPage();
      }
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
