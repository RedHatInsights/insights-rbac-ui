import ContentHeader from '@patternfly/react-component-groups/dist/esm/ContentHeader';
import { PageSection, PageSectionVariants, Spinner } from '@patternfly/react-core';
import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import Messages from '../../../../../Messages';
import { FormRenderer, componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { FormTemplate } from '@data-driven-forms/pf4-component-mapper';
import { useDispatch, useSelector } from 'react-redux';
import { addGroup, fetchGroup, fetchGroups, updateGroup } from '../../../../../redux/actions/group-actions';
import { RBACStore } from '../../../../../redux/store';
import { useParams } from 'react-router-dom';
import { EditGroupUsersAndServiceAccounts } from './EditUserGroupUsersAndServiceAccounts';
import RbacBreadcrumbs from '../../../../../presentational-components/shared/breadcrumbs';
import { mergeToBasename } from '../../../../../presentational-components/shared/AppLink';
import pathnames from '../../../../../utilities/pathnames';
import useAppNavigate from '../../../../../hooks/useAppNavigate';

interface EditUserGroupProps {
  createNewGroup?: boolean;
}

export const EditUserGroup: React.FunctionComponent<EditUserGroupProps> = ({ createNewGroup }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
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

  const group = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup);
  const allGroups = useSelector((state: RBACStore) => state.groupReducer?.groups?.data || []);
  const groupUsers = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.members?.data || []);
  const groupServiceAccounts = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup?.serviceAccounts?.data || []);

  const breadcrumbsList = useMemo(
    () => [
      {
        title: intl.formatMessage(Messages.userGroups),
        to: mergeToBasename(pathnames['users-and-user-groups'].link),
      },
      {
        title: pageTitle,
        isActive: true,
      },
    ],
    [intl],
  );

  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          dispatch(fetchGroups({ limit: 1000, offset: 0, orderBy: 'name', usesMetaInURL: true })),
          groupId ? dispatch(fetchGroup(groupId)) : Promise.resolve(),
        ]);
      } finally {
        if (group) {
          setInitialFormData({
            name: group.name,
            description: group.description,
            users: groupUsers.map((user) => user.username),
            serviceAccounts: groupServiceAccounts.map((sa) => sa.clientId),
          });
        }
        setIsLoading(false);
      }
    };
    fetchData();
  }, [dispatch, groupId, group?.uuid]);

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
                (existingGroup) => existingGroup.name.toLowerCase() === value?.toLowerCase() && existingGroup.uuid !== groupId,
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
    if (createNewGroup) {
      dispatch(addGroup({ name: values.name, description: values.description }));
    } else if (values.name !== group?.name || values.description !== group?.description) {
      dispatch(updateGroup({ uuid: groupId, name: values.name, description: values.description }));
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
        const removedServiceAccounts = serviceAccounts.initial.filter((serviceAccount: string) => !serviceAccounts.updated.includes(serviceAccount));
        console.log(`Service accounts added: ${addedServiceAccounts} and removed: ${removedServiceAccounts}`);
      }
      returnToPreviousPage();
    }
  };

  return (
    <React.Fragment>
      <section className="pf-v5-c-page__main-breadcrumb">
        <RbacBreadcrumbs {...breadcrumbsList} />
      </section>
      <ContentHeader title={pageTitle} />
      <PageSection data-ouia-component-id="edit-user-group-form" className="pf-v5-u-m-lg-on-lg" variant={PageSectionVariants.light} isWidthLimited>
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

export default EditUserGroup;
