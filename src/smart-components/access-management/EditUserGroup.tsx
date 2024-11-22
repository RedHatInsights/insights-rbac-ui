import ContentHeader from '@patternfly/react-component-groups/dist/esm/ContentHeader';
import { PageSection, PageSectionVariants } from '@patternfly/react-core';
import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import Messages from '../../Messages';
import { FormRenderer, componentTypes, validatorTypes } from '@data-driven-forms/react-form-renderer';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { FormTemplate } from '@data-driven-forms/pf4-component-mapper';
import { useDispatch, useSelector } from 'react-redux';
import { fetchGroup, fetchGroups, updateGroup } from '../../redux/actions/group-actions';
import { RBACStore } from '../../redux/store';
import { useNavigate, useParams } from 'react-router-dom';
import { EditGroupUsersAndServiceAccounts } from './EditUserGroupUsersAndServiceAccounts';

export const EditUserGroup: React.FunctionComponent = () => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const params = useParams();
  const groupId = params.groupId;
  const navigate = useNavigate();

  const group = useSelector((state: RBACStore) => state.groupReducer?.selectedGroup);
  const allGroups = useSelector((state: RBACStore) => state.groupReducer?.groups?.data || []);

  useEffect(() => {
    dispatch(fetchGroups({ limit: 1000, offset: 0, orderBy: 'name', usesMetaInURL: true }));
    if (groupId) {
      dispatch(fetchGroup(groupId));
    }
  }, [dispatch, groupId]);

  const schema = {
    fields: [
      {
        name: 'name',
        label: intl.formatMessage(Messages.name),
        component: componentTypes.TEXT_FIELD,
        validate: [
          { type: validatorTypes.REQUIRED },
          (value: string) => {
            if (value === group?.name) {
              return undefined;
            }

            const isDuplicate = allGroups.some(
              (existingGroup) => existingGroup.name.toLowerCase() === value?.toLowerCase() && existingGroup.uuid !== groupId
            );

            return isDuplicate ? intl.formatMessage(Messages.groupNameTakenTitle) : undefined;
          },
        ],
        initialValue: group?.name,
      },
      {
        name: 'description',
        label: intl.formatMessage(Messages.description),
        component: componentTypes.TEXTAREA,
        initialValue: group?.description,
      },
      {
        name: 'users-and-service-accounts',
        component: 'users-and-service-accounts',
        groupId: groupId,
      },
    ],
  };

  const returnToPreviousPage = () => {
    navigate(-1);
  };

  const handleSubmit = async (values: Record<string, any>) => {
    if (values.name !== group?.name || values.description !== group?.description) {
      dispatch(updateGroup({ uuid: groupId, name: values.name, description: values.description }));
      console.log(`Dispatched update group with name: ${values.name} and description: ${values.description}`);
    }
    if (values['users-and-service-accounts']) {
      const { users, serviceAccounts } = values['users-and-service-accounts'];
      if (users.added.length > 0) {
        console.log(`Users added: ${users.added}`);
      }
      if (users.removed.length > 0) {
        console.log(`Users removed: ${users.removed}`);
      }
      if (serviceAccounts.added.length > 0) {
        console.log(`Service accounts added: ${serviceAccounts.added}`);
      }
      if (serviceAccounts.removed.length > 0) {
        console.log(`Service accounts removed: ${serviceAccounts.removed}`);
      }
      returnToPreviousPage();
    }
  };

  return (
    <React.Fragment>
      <ContentHeader title={intl.formatMessage(Messages.usersAndUserGroupsEditUserGroup)} subtitle={''} />
      <PageSection data-ouia-component-id="edit-user-group-form" className="pf-v5-u-m-lg-on-lg" variant={PageSectionVariants.light} isWidthLimited>
        <FormRenderer
          schema={schema}
          componentMapper={{
            ...componentMapper,
            'users-and-service-accounts': EditGroupUsersAndServiceAccounts,
          }}
          onSubmit={handleSubmit}
          onCancel={returnToPreviousPage}
          FormTemplate={FormTemplate}
        />
      </PageSection>
    </React.Fragment>
  );
};

export default EditUserGroup;
