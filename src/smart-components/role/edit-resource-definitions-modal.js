import React, { useEffect, useState, useReducer } from 'react';
import PropTypes from 'prop-types';
import componentTypes from '@data-driven-forms/react-form-renderer/dist/cjs/component-types';
import FormRenderer from '../common/form-renderer';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { updateRole, fetchRole } from '../../redux/actions/role-actions';
import { routes as paths } from '../../../package.json';
import { getResource, getResourceDefinitions } from '../../redux/actions/cost-management-actions';
import componentMapper from '@data-driven-forms/pf4-component-mapper/dist/cjs/component-mapper';
import { WarningModal } from '../common/warningModal';
import { Spinner, Modal } from '@patternfly/react-core';
import ResourceDefinitionsFormTemplate from './ResourceDefinitionsFormTemplate';
import './role-permissions.scss';

const createOptions = (resources) =>
  Object.entries(resources).reduce(
    (acc, [key, value]) => [
      ...acc,
      ...value.map((r) => ({
        value: r.value,
        path: key,
        label: r.value,
      })),
    ],
    []
  );

const initialState = {
  changedResources: undefined,
  cancelWarningVisible: false,
  resourcesPath: undefined,
  loadingStateVisible: true,
};

function reducer(state, action) {
  switch (action.type) {
    case 'update':
      return {
        ...state,
        ...action.payload,
      };
    default:
      throw new Error();
  }
}

const createEditResourceDefinitionsSchema = (resources, resourcesPath, options) => ({
  fields: [
    {
      component: componentTypes.DUAL_LIST_SELECT,
      name: 'dual-list-select',
      leftTitle: 'Resources available for the permission',
      rightTitle: 'Resources defined for the permission',
      filterOptionsTitle: 'Filter by resource...',
      filterValueTitle: 'Filter by resource...',
      options: [...(resourcesPath && resources ? options : [])],
      validate: [{ type: 'validate-resources' }],
    },
  ],
});

const selector = ({ costReducer: { resourceTypes, isLoading, loadingResources, resources } }) => ({
  resourceTypes: resourceTypes.data,
  resources,
  isLoading,
  isLoadingResources: loadingResources > 0,
});

const validatorMapper = {
  'validate-resources': () => (value) => (value && value.length > 0 ? undefined : 'At least one resource must be defined for this permission'),
};

const EditResourceDefinitionsModal = ({ cancelRoute }) => {
  const routeMatch = useRouteMatch(paths['role-detail-permission-edit']);
  const {
    params: { permissionId, roleId },
  } = useRouteMatch(routeMatch);
  const { replace, push } = useHistory();

  const dispatch = useDispatch();
  const fetchResourceDefinitions = () => dispatch(getResourceDefinitions());

  const [state, dispatchLocally] = useReducer(reducer, initialState);

  const { definedResources, role } = useSelector(
    (state) => ({
      role: state.roleReducer.selectedRole,
      definedResources: state.roleReducer.selectedRole?.access
        ? state.roleReducer.selectedRole.access
            .find((a) => a.permission === permissionId)
            .resourceDefinitions.reduce((acc, curr) => [...acc, curr.attributeFilter.value], [])
        : [],
      isRecordLoading: state.roleReducer.isRecordLoading,
    }),
    shallowEqual
  );

  const { resourceTypes, isLoading, isLoadingResources, resources } = useSelector((props) => selector(props), shallowEqual);

  useEffect(() => {
    fetchResourceDefinitions();
  }, [permissionId]);

  useEffect(() => {
    if (!isLoading) {
      let path = resourceTypes.find((r) => r.value === permissionId.split(':')?.[1])?.path;
      if (path) {
        dispatchLocally({ type: 'update', payload: { resourcesPath: path.split('/')[5] } });
        dispatch(getResource(path));
      } else if (permissionId.split(':')?.[1] === '*') {
        dispatchLocally({ type: 'update', payload: { resourcesPath: '*' } });
        resourceTypes.map((r) => dispatch(getResource(r.path)));
      }
    }
  }, [resourceTypes]);

  const onCancel = () => replace(cancelRoute);

  const handleCancel = (data) => {
    if (data['dual-list-select'] === definedResources) {
      onCancel();
    } else {
      dispatchLocally({
        type: 'update',
        payload: {
          changedResources: data['dual-list-select'],
          cancelWarningVisible: true,
        },
      });
    }
  };

  const handleSubmit = (data, options) => {
    dispatchLocally({ type: 'update', payload: { changedResources: data['dual-list-select'] } });
    const newAccess = {
      permission: permissionId,
      resourceDefinitions: data['dual-list-select'].map((value) => ({
        attributeFilter: {
          key: `cost-management.${options.find((option) => option.value === value).path}`,
          operation: 'equal',
          value,
        },
      })),
    };
    dispatch(updateRole(roleId, { ...role, access: role.access.map((item) => (item.permission === permissionId ? newAccess : item)) }), true).then(
      () => {
        dispatch(fetchRole(roleId));
        push(cancelRoute);
      }
    );
  };

  const options = createOptions(resources);

  return (
    <React.Fragment>
      <WarningModal
        customTitle="Exit edit resource definitions?"
        customDescription="All changes will be lost."
        isOpen={state.cancelWarningVisible}
        onModalCancel={() => dispatchLocally({ type: 'update', payload: { cancelWarningVisible: false } })}
        onConfirmCancel={onCancel}
      ></WarningModal>
      {(isLoading || isLoadingResources) && state.loadingStateVisible ? (
        <Modal
          className="ins-m-resource-definitions"
          isOpen={true}
          title="Edit resource definitions"
          onClose={() => {
            dispatchLocally({ type: 'update', payload: { loadingStateVisible: false } });
            onCancel();
          }}
        >
          <Spinner />
        </Modal>
      ) : (
        <FormRenderer
          schema={createEditResourceDefinitionsSchema(resources, state.resourcesPath, options)}
          componentMapper={componentMapper}
          initialValues={{ 'dual-list-select': state.changedResources || definedResources || [] }}
          onSubmit={(props) => handleSubmit(props, options)}
          onCancel={(data) => handleCancel(data)}
          validatorMapper={validatorMapper}
          FormTemplate={(props) => (
            <ResourceDefinitionsFormTemplate
              {...props}
              ModalProps={{
                onClose: handleCancel,
                isOpen: !state.cancelWarningVisible,
                variant: 'large',
                title: 'Edit resource definitions',
                description: 'Give or remove permissions to specific resources using the arrows below.',
              }}
            />
          )}
        />
      )}
    </React.Fragment>
  );
};

EditResourceDefinitionsModal.propTypes = {
  routeMatch: PropTypes.string.isRequired,
  cancelRoute: PropTypes.string.isRequired,
  resources: PropTypes.array,
  resourcesPath: PropTypes.string,
};

export default EditResourceDefinitionsModal;
