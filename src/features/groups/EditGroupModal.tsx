import React, { useEffect, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import useAppNavigate from '../../hooks/useAppNavigate';
import { ModalFormTemplate } from '../../components/forms/ModalFormTemplate';
import FormRenderer from '../../components/forms/FormRenderer';
import { fetchGroup, updateGroup } from '../../redux/groups/actions';
import { debouncedAsyncValidator } from './validators';

interface Group {
  uuid: string;
  name: string;
  description?: string;
  [key: string]: any;
}

interface EditGroupModalProps {
  postMethod: (config?: any) => Promise<any>;
  cancelRoute: string;
  submitRoute?: string;
  group?: Group;
  onClose: () => void;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({ postMethod, cancelRoute, submitRoute = cancelRoute, group, onClose }) => {
  const [selectedGroup, setSelectedGroup] = useState<Group | undefined>(undefined);

  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  const setGroupData = (groupData: Group | undefined) => {
    setSelectedGroup(groupData);
  };

  const fetchData = () => {
    if (groupId) {
      (fetchGroup(groupId) as any).payload.then((data: any) => setGroupData(data)).catch(() => setGroupData(undefined));
    }
  };

  const dispatch = useDispatch();

  useEffect(() => {
    fetchData();
  }, [groupId]);

  useEffect(() => {
    group && setSelectedGroup(group);
  }, [group]);

  const onSubmit = (formData: any) => {
    const userData = {
      uuid: selectedGroup?.uuid || '',
      name: formData.name,
      description: formData.description,
    };

    dispatch(updateGroup(userData) as any)
      .then(() => {
        (dispatch as any)(
          addNotification({
            variant: 'success',
            title: 'Group updated successfully',
            description: `Group "${formData.name}" has been updated.`,
          }),
        );
      })
      .then(() => postMethod && postMethod())
      .then(() => navigate(submitRoute))
      .catch(() => {
        (dispatch as any)(
          addNotification({
            variant: 'danger',
            title: 'Error updating group',
            description: `There was an error updating the group "${formData.name}".`,
          }),
        );
      });
  };

  const schema = {
    fields: [
      {
        component: componentTypes.TEXT_FIELD,
        name: 'name',
        type: 'text',
        label: 'Group name',
        placeholder: 'Enter group name',
        isRequired: true,
        autoFocus: true,
        validate: [
          { type: validatorTypes.REQUIRED },
          { type: validatorTypes.MAX_LENGTH, threshold: 150 },
          {
            type: validatorTypes.PATTERN,
            pattern: /^[A-Za-z0-9]+[A-Za-z0-9\s_-]*$/,
            message: 'Group name must start with alphanumeric character and can contain alphanumeric characters, spaces, hyphens, and underscores',
          },
          debouncedAsyncValidator,
        ],
      },
      {
        component: componentTypes.TEXTAREA,
        name: 'description',
        type: 'text',
        label: 'Description',
        placeholder: 'Enter group description (optional)',
        validate: [{ type: validatorTypes.MAX_LENGTH, threshold: 150 }],
      },
    ],
  };

  const onCancel = () => {
    onClose();
    navigate(cancelRoute);
  };

  return selectedGroup ? (
    <FormRenderer
      schema={schema}
      subscription={{ values: true, valid: true, pristine: true }}
      FormTemplate={(props: any) => (
        <ModalFormTemplate
          {...props}
          ModalProps={{
            title: `Edit group "${selectedGroup.name}"`,
            isOpen: true,
            variant: 'medium',
            onClose: onCancel,
          }}
          disableSubmit={['validating', 'pristine']}
          submitLabel="Save"
        />
      )}
      initialValues={selectedGroup}
      onSubmit={onSubmit}
      onCancel={onCancel}
      componentMapper={{
        ...componentMapper,
        'text-field': componentMapper[componentTypes.TEXT_FIELD],
        textarea: componentMapper[componentTypes.TEXTAREA],
      }}
    />
  ) : (
    <div>
      <Skeleton height="300px" />
    </div>
  );
};
