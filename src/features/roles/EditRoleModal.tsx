import React, { useEffect, useState } from 'react';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import type { Schema } from '@data-driven-forms/react-form-renderer';
import type { RoleWithAccess } from '@redhat-cloud-services/rbac-client/types';
import useAppNavigate from '../../hooks/useAppNavigate';
import { ModalFormTemplate } from '../../components/forms/ModalFormTemplate';
import FormRenderer from '../../components/forms/FormRenderer';
import useIsMounted from '../../hooks/useIsMounted';
import { roleSelector } from './roleSelectors';
import { fetchRole, fetchRoles } from '../../redux/roles/helper';
import { debounceAsync as asyncDebounce } from '../../utilities/debounce';
import { patchRole } from '../../redux/roles/actions';
import messages from '../../Messages';
import type { RBACStore } from '../../redux/store.d';

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
  const isMounted = useIsMounted();
  const navigate = useAppNavigate();
  const dispatch = useDispatch();
  const addNotification = useAddNotification();

  const { roleId } = useParams<{ roleId: string }>();
  const role = useSelector((state: RBACStore) => roleSelector(state, roleId ?? ''));
  const [initialValues, setInitialValues] = useState<RoleWithAccess | undefined>(role as RoleWithAccess | undefined);

  useEffect(() => {
    if (!initialValues && roleId) {
      fetchRole(roleId).then((role) => {
        if (isMounted.current) {
          setInitialValues(role);
        }
      });
    }
  }, [roleId, initialValues, isMounted]);

  const validationPromise: ValidationPromiseFn = (name, idKey, id) => {
    return name.length < 150
      ? fetchRoles({ name }).then(({ data }) => {
          if (!data || data.length === 0) {
            return undefined;
          }

          const taken = data.some((item) => (item as unknown as Record<string, unknown>)[idKey] !== id && item.display_name === name);
          if (taken) {
            throw intl.formatMessage(messages.roleWithNameExists);
          }
          return undefined;
        })
      : Promise.reject(intl.formatMessage(messages.maxCharactersWarning, { number: 150 }));
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
    // Cast to any needed because API actually expects null for clearing, but types say string | undefined
    const roleData = { name: data.name, display_name: data.name, description: data.description || (null as unknown as string) };
    try {
      await (dispatch(patchRole(roleId!, roleData)) as unknown as Promise<void>);
      addNotification({
        variant: 'success',
        title: intl.formatMessage(messages.editRoleSuccessTitle),
        description: intl.formatMessage(messages.editRoleSuccessDescription),
      });
      afterSubmit();
      navigate(submitRoute);
    } catch (error) {
      console.error('Failed to edit role:', error);
      addNotification({
        variant: 'danger',
        title: intl.formatMessage(messages.editRoleErrorTitle),
        description: intl.formatMessage(messages.editRoleErrorDescription),
      });
    }
  };

  return initialValues ? (
    <FormRenderer
      schema={createEditRoleSchema(roleId!)}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      validatorMapper={validatorMapper}
      FormTemplate={(props: Record<string, unknown>) => (
        <ModalFormTemplate {...props} ModalProps={{ onClose: onCancel, isOpen: true, variant: 'small', title: 'Edit role information' }} />
      )}
    />
  ) : null;
};

// Feature component (used by Routing.tsx) - both named and default exports
export { EditRoleModal };
export default EditRoleModal;
