import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@patternfly/react-core/dist/dynamic/components/Skeleton';
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
  [key: string]: unknown;
}

interface EditGroupModalProps {
  cancelRoute?: string | { pathname: string; search: string };
  submitRoute?: string | { pathname: string; search: string };
  group?: Group;
  onClose?: () => void; // Optional - used in stories, not in routing
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({ cancelRoute, submitRoute = cancelRoute, group, onClose }) => {
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();
  const dispatch = useDispatch();

  // Get group data and loading state from Redux (like other components do)
  const selectedGroup = useSelector((state: any) => state.groupReducer?.selectedGroup) || group;
  const isLoading = useSelector((state: any) => state.groupReducer?.isRecordLoading);

  // Fetch group data on mount (standard Redux pattern)
  useEffect(() => {
    if (groupId && !group) {
      dispatch(fetchGroup(groupId));
    }
  }, [groupId, group, dispatch]);

  const onSubmit = async (formData: { name: string; description?: string }) => {
    const userData = {
      uuid: selectedGroup?.uuid || '',
      name: formData.name,
      description: formData.description,
    };

    console.log('🚀 Submitting group update:', userData);

    try {
      // Use standard dispatch pattern - redux-promise-middleware handles notifications automatically
      await dispatch(updateGroup(userData));

      // Refresh the group data after successful update
      if (selectedGroup?.uuid) {
        dispatch(fetchGroup(selectedGroup.uuid));
      }

      // Navigate to submitRoute or cancelRoute as fallback
      const route = submitRoute || cancelRoute || '/groups';
      console.log('🔍 Navigating after successful update to:', route);
      navigate(route);
    } catch (error) {
      // Error notifications are handled automatically by redux-promise-middleware
      console.error('Error updating group:', error);
      // Don't navigate on error - let user retry or manually cancel
    }
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
          // Pass current group UUID to validator to exclude it from "already taken" check
          (value: string) => debouncedAsyncValidator(value, 'uuid', selectedGroup?.uuid),
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
    // Call onClose if provided (for stories/tests), otherwise just navigate
    if (onClose) {
      onClose();
    } else {
      // Navigate to cancelRoute (used in routing scenarios)
      const route = cancelRoute || '/groups';
      navigate(route);
    }
  };

  // Show loading while data loads (like AddGroupRoles story pattern)
  if (isLoading || !selectedGroup || !selectedGroup.uuid) {
    return (
      <div>
        <Skeleton height="300px" />
      </div>
    );
  }

  return (
    <FormRenderer
      schema={schema}
      subscription={{ values: true, valid: true, pristine: true }}
      FormTemplate={(props: React.ComponentProps<typeof ModalFormTemplate>) => (
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
  );
};

export default EditGroupModal;
