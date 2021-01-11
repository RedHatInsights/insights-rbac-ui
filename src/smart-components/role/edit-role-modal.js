import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import componentTypes from '@data-driven-forms/react-form-renderer/dist/esm/component-types';

import ModalFormTemplate from '../common/ModalFormTemplate';
import FormRenderer from '../common/form-renderer';
import useIsMounted from '../../hooks/useIsMounted';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { roleSelector } from './role-selectors';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { fetchRole, fetchRoles } from '../../helpers/role/role-helper';
import asyncDebounce from '../../utilities/async-debounce';
import { updateRole } from '../../redux/actions/role-actions';

const validationPromise = (name, idKey, id) =>
  fetchRoles({ name }).then(({ data }) => {
    if (data.length === 0) {
      return undefined;
    }

    const taken = data.some((item) => item[idKey] !== id && item.name === name);
    if (taken) {
      throw 'Role with this name already exists.';
    }
  });

const createEditRoleSchema = (id) => ({
  fields: [
    {
      name: 'name',
      component: componentTypes.TEXT_FIELD,
      label: 'Name',
      isRequired: true,
      validate: [{ type: 'validate-role-name', id, idKey: 'uuid', validationPromise }],
    },
    {
      name: 'description',
      component: componentTypes.TEXTAREA,
      label: 'Description',
    },
  ],
});

const uniqueNameValidator = asyncDebounce((value, idKey, id, validationPromise) => {
  if (!value || value.length === 0) {
    return Promise.reject('Required');
  }

  return validationPromise(value, idKey, id);
});

const EditRoleModal = ({ routeMatch, cancelRoute, afterSubmit }) => {
  const isMounted = useIsMounted();
  const {
    params: { id },
  } = useRouteMatch(routeMatch);
  const { replace, push } = useHistory();
  const dispatch = useDispatch();

  const validatorMapper = {
    'validate-role-name': ({ idKey, id, validationPromise }) => (value) => uniqueNameValidator(value, idKey, id, validationPromise),
  };

  const role = useSelector((state) => roleSelector(state, id));
  const [initialValues, setInitialValues] = useState(role);

  const onCancel = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        dismissDelay: 8000,
        dismissable: false,
        title: 'Editing role',
        description: 'Edit role was canceled by the user.',
      })
    );
    replace(cancelRoute);
  };

  const handleSubmit = (data) =>
    dispatch(updateRole(id, { ...data, display_name: data.name })).then(() => {
      afterSubmit();
      push(cancelRoute);
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
  cancelRoute: PropTypes.string.isRequired,
  afterSubmit: PropTypes.func.isRequired,
};

export default EditRoleModal;
