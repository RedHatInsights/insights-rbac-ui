import React, { useMemo } from 'react';
import { useParams } from 'react-router-dom';
import { Skeleton } from '@patternfly/react-core/dist/dynamic/components/Skeleton';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import useAppNavigate from '../../hooks/useAppNavigate';
import { ModalFormTemplate } from '../../components/forms/ModalFormTemplate';
import FormRenderer from '../../components/forms/FormRenderer';
import { useGroupQuery, useUpdateGroupMutation } from '../../data/queries/groups';
import { debouncedAsyncValidator } from './validators';
import { getModalContainer } from '../../helpers/modal-container';

interface Group {
  uuid: string;
  name: string;
  description?: string;
}

interface EditGroupModalProps {
  cancelRoute?: string | { pathname: string; search: string };
  submitRoute?: string | { pathname: string; search: string };
  group?: Group; // Optional - if provided, skip fetching
  onClose?: () => void; // Optional - used in stories, not in routing
}

/**
 * EditGroupModal - fetches its own data via React Query.
 *
 * Migrated from Redux to React Query - component is now self-contained.
 */
export const EditGroupModal: React.FC<EditGroupModalProps> = ({ cancelRoute, submitRoute = cancelRoute, group: propGroup, onClose }) => {
  const navigate = useAppNavigate();
  const { groupId } = useParams<{ groupId: string }>();

  // Fetch group data via React Query (only if not provided via prop)
  const { data: fetchedGroup, isLoading } = useGroupQuery(groupId ?? '', {
    enabled: !!groupId && !propGroup,
  });

  // Use prop group if provided, otherwise use fetched data
  const group = propGroup || fetchedGroup;

  // Update mutation
  const updateGroupMutation = useUpdateGroupMutation();

  const onSubmit = async (formData: { name: string; description?: string }) => {
    if (!group?.uuid) return;

    try {
      await updateGroupMutation.mutateAsync({
        uuid: group.uuid,
        name: formData.name,
        description: formData.description,
      });

      // Navigate to submitRoute or cancelRoute as fallback
      const route = submitRoute || cancelRoute || '/groups';
      navigate(route);
    } catch (error) {
      // Error notification is handled by the mutation
      console.error('Error updating group:', error);
    }
  };

  // Memoize schema to prevent recreation on every render
  // This is critical for async validators to maintain their debounce state
  const schema = useMemo(
    () => ({
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
            (value: string) => debouncedAsyncValidator(value, 'uuid', group?.uuid),
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
    }),
    [group?.uuid],
  );

  const onCancel = () => {
    if (onClose) {
      onClose();
    } else {
      const route = cancelRoute || '/groups';
      navigate(route);
    }
  };

  // Show loading while data loads
  if (isLoading || !group?.uuid) {
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
            title: `Edit group "${group.name}"`,
            isOpen: true,
            variant: 'medium',
            onClose: onCancel,
            appendTo: getModalContainer(),
          }}
          disableSubmit={['validating', 'pristine']}
          submitLabel="Save"
        />
      )}
      initialValues={group}
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
