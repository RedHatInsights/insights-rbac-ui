import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import useAppNavigate from '../../hooks/useAppNavigate';
import ModalFormTemplate from '../common/ModalFormTemplate';
import FormRenderer from '../common/form-renderer';
import useIsMounted from '../../hooks/useIsMounted';
import { roleSelector } from './role-selectors';
import { fetchRole, fetchRoles } from '../../helpers/role/role-helper';
import asyncDebounce from '../../utilities/async-debounce';
import { patchRole } from '../../redux/actions/role-actions';
import messages from '../../Messages';

const EditRoleModal = ({ cancelRoute, submitRoute = cancelRoute, afterSubmit }) => {
  const intl = useIntl();
  const isMounted = useIsMounted();
  const navigate = useAppNavigate();
  const dispatch = useDispatch();

  const { roleId } = useParams();
  const role = useSelector((state) => roleSelector(state, roleId));
  const [initialValues, setInitialValues] = useState(role);

  useEffect(() => {
    !initialValues &&
      fetchRole(roleId).then((role) => {
        if (isMounted.current) {
          setInitialValues(role);
        }
      });
  }, [roleId]);

  const validationPromise = (name, idKey, id) => {
    return name.length < 150
      ? fetchRoles({ name }).then(({ data }) => {
          if (data.length === 0) {
            return undefined;
          }

          const taken = data.some((item) => item[idKey] !== id && item.display_name === name);
          if (taken) {
            throw intl.formatMessage(messages.roleWithNameExists);
          }
        })
      : Promise.reject(intl.formatMessage(messages.maxCharactersWarning, { number: 150 }));
  };

  const createEditRoleSchema = (id) => {
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

  const uniqueNameValidator = asyncDebounce((value, idKey, id, validationPromise) =>
    !value || value.length === 0 ? Promise.reject(intl.formatMessage(messages.required)) : validationPromise(value, idKey, id),
  );

  const validatorMapper = {
    'validate-role-name':
      ({ idKey, id, validationPromise }) =>
      (value) =>
        uniqueNameValidator(value, idKey, id, validationPromise),
  };

  const onCancel = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        dismissDelay: 8000,
        title: intl.formatMessage(messages.editingRoleTitle),
        description: intl.formatMessage(messages.editingRoleCanceledDescription),
      }),
    );
    navigate(cancelRoute, { replace: true });
  };

  const handleSubmit = (data) =>
    // description is optional - however API only honors an empty description set to null (and not omitted or undefined or empty string)
    dispatch(patchRole(roleId, { name: data.name, display_name: data.name, description: data.description || null })).then(() => {
      afterSubmit();
      navigate(submitRoute);
    });

  return initialValues ? (
    <FormRenderer
      schema={createEditRoleSchema(roleId)}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      validatorMapper={validatorMapper}
      FormTemplate={(props) => (
        <ModalFormTemplate {...props} ModalProps={{ onClose: onCancel, isOpen: true, variant: 'small', title: 'Edit role information' }} />
      )}
    />
  ) : null;
};

EditRoleModal.propTypes = {
  cancelRoute: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      pathname: PropTypes.string.isRequired,
      search: PropTypes.string,
      hash: PropTypes.string,
    }),
  ]).isRequired,
  submitRoute: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      pathname: PropTypes.string.isRequired,
      search: PropTypes.string,
      hash: PropTypes.string,
    }),
  ]),
  afterSubmit: PropTypes.func.isRequired,
  isLoading: PropTypes.bool.isRequired,
};

export default EditRoleModal;
