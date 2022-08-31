import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import validatorTypes from '@data-driven-forms/react-form-renderer/validator-types';

import ModalFormTemplate from '../common/ModalFormTemplate';
import FormRenderer from '../common/form-renderer';
import useIsMounted from '../../hooks/useIsMounted';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { roleSelector } from './role-selectors';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { fetchRole, fetchRoles } from '../../helpers/role/role-helper';
import asyncDebounce from '../../utilities/async-debounce';
import { patchRole } from '../../redux/actions/role-actions';
import { useIntl } from 'react-intl';
import messages from '../../Messages';

const validationPromise = (name, idKey, id) => {
  const intl = useIntl();
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
  const intl = useIntl();
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

const uniqueNameValidator = asyncDebounce((value, idKey, id, validationPromise) => {
  if (!value || value.length === 0) {
    const intl = useIntl();
    return Promise.reject(intl.formatMessage(messages.required));
  }

  return validationPromise(value, idKey, id);
});

const EditRoleModal = ({ routeMatch, cancelRoute, submitRoute = cancelRoute, afterSubmit }) => {
  const isMounted = useIsMounted();
  const {
    params: { id },
  } = useRouteMatch(routeMatch);
  const { replace, push } = useHistory();
  const dispatch = useDispatch();

  const validatorMapper = {
    'validate-role-name':
      ({ idKey, id, validationPromise }) =>
      (value) =>
        uniqueNameValidator(value, idKey, id, validationPromise),
  };

  const role = useSelector((state) => roleSelector(state, id));
  const [initialValues, setInitialValues] = useState(role);

  const onCancel = () => {
    const intl = useIntl();
    dispatch(
      addNotification({
        variant: 'warning',
        dismissDelay: 8000,
        title: intl.formatMessage(messages.editingRole),
        description: intl.formatMessage(messages.editingRoleCanceledDescription),
      })
    );
    replace(cancelRoute);
  };

  const handleSubmit = (data) =>
    dispatch(patchRole(id, { name: data.name, display_name: data.name, description: data.description })).then(() => {
      afterSubmit();
      push(submitRoute);
    });

  useEffect(() => {
    !initialValues &&
      fetchRole(id).then((role) => {
        if (isMounted.current) {
          setInitialValues(role);
        }
      });
  }, [id]);
  if (!initialValues) {
    return null;
  }

  return (
    <FormRenderer
      schema={createEditRoleSchema(id)}
      initialValues={initialValues}
      onSubmit={handleSubmit}
      onCancel={onCancel}
      validatorMapper={validatorMapper}
      FormTemplate={(props) => (
        <ModalFormTemplate {...props} ModalProps={{ onClose: onCancel, isOpen: true, variant: 'small', title: 'Edit role information' }} />
      )}
    />
  );
};

EditRoleModal.propTypes = {
  routeMatch: PropTypes.string.isRequired,
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
};

export default EditRoleModal;
