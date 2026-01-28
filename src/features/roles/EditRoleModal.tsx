import React from 'react';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import type { Schema } from '@data-driven-forms/react-form-renderer';
import useAppNavigate from '../../hooks/useAppNavigate';
import { ModalFormTemplate } from '../../components/forms/ModalFormTemplate';
import { usePatchRoleMutation, useRoleQuery } from '../../data/queries/roles';
import { rolesApi } from '../../data/api/roles';
import { debounceAsync as asyncDebounce } from '../../utilities/debounce';
import messages from '../../Messages';

type RouteLocation =
  | string
  | {
      pathname: string;
      search?: string;
      hash?: string;
    };

interface EditRoleModalProps {
  cancelRoute: RouteLocation;
  submitRoute?: RouteLocation;
  afterSubmit: () => void;
}

interface FormValues {
  name: string;
  description?: string;
}

type ValidationPromiseFn = (name: string, idKey: string, id: string) => Promise<string | undefined>;

const EditRoleModal: React.FC<EditRoleModalProps> = ({ cancelRoute, submitRoute = cancelRoute, afterSubmit }) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const addNotification = useAddNotification();
  const patchRoleMutation = usePatchRoleMutation();

  const { roleId } = useParams<{ roleId: string }>();
  const { data: roleData } = useRoleQuery(roleId ?? '');

  const validationPromise: ValidationPromiseFn = async (name, idKey, id) => {
    if (name.length >= 150) {
      throw intl.formatMessage(messages.maxCharactersWarning, { number: 150 });
    }

    const response = await rolesApi.listRoles({ displayName: name, limit: 10, offset: 0 });
    const data = response.data?.data;

    if (!data || data.length === 0) {
      return undefined;
    }

    // Check if any other role has the same display_name
    const taken = data.some((item) => item.uuid !== id && item.display_name === name);
    if (taken) {
      throw intl.formatMessage(messages.roleWithNameExists);
    }
    return undefined;
  };

  const createEditRoleSchema = (id: string): Schema => {
    return {
      fields: [
        {
          name: 'name',
          component: componentTypes.TEXT_FIELD,
          label: intl.formatMessage(messages.name),
          isRequired: true,
          validate: [{ type: 'validate-role-name', id, idKey: 'uuid', validationPromise }],
        },
        {
          name: 'description',
          component: componentTypes.TEXTAREA,
          label: intl.formatMessage(messages.description),
          validate: [
            {
              type: validatorTypes.MAX_LENGTH,
              threshold: 150,
            },
          ],
        },
      ],
    };
  };

  const uniqueNameValidator = asyncDebounce((value: string, idKey: string, id: string, validationPromiseFn: ValidationPromiseFn) =>
    !value || value.length === 0 ? Promise.reject(intl.formatMessage(messages.required)) : validationPromiseFn(value, idKey, id),
  );

  const validatorMapper = {
    'validate-role-name':
      ({ idKey, id, validationPromise: valPromise }: { idKey: string; id: string; validationPromise: ValidationPromiseFn }) =>
      (value: string) =>
        uniqueNameValidator(value, idKey, id, valPromise),
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: intl.formatMessage(messages.editingRoleTitle),
      description: intl.formatMessage(messages.editingRoleCanceledDescription),
    });
    navigate(cancelRoute, { replace: true });
  };

  const handleSubmit = async (data: FormValues) => {
    // description is optional - however API only honors an empty description set to null (and not omitted or undefined or empty string)
    const rolePatch = {
      name: data.name,
      display_name: data.name,
      description: data.description || undefined,
    };
    try {
      await patchRoleMutation.mutateAsync({ uuid: roleId!, rolePatch });
      // Success notification is handled by usePatchRoleMutation
      afterSubmit();
      navigate(submitRoute);
    } catch (error) {
      console.error('Failed to edit role:', error);
      // Error notification is handled by usePatchRoleMutation
    }
  };

  return roleData ? (
    <FormRenderer
      schema={createEditRoleSchema(roleId!)}
      componentMapper={componentMapper}
      initialValues={roleData}
      onSubmit={(values) => handleSubmit(values as FormValues)}
      onCancel={onCancel}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      validatorMapper={validatorMapper as any}
      FormTemplate={(props) => (
        <ModalFormTemplate {...props} ModalProps={{ onClose: onCancel, isOpen: true, variant: 'small', title: 'Edit role information' }} />
      )}
    />
  ) : null;
};

// Feature component (used by Routing.tsx) - both named and default exports
export { EditRoleModal };
export default EditRoleModal;
