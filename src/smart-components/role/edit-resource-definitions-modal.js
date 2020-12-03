import React, { useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import componentTypes from '@data-driven-forms/react-form-renderer/dist/esm/component-types';
import FormRenderer from '../common/form-renderer';
import { useHistory, useRouteMatch } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { updateRole, fetchRole } from '../../redux/actions/role-actions';
import { routes as paths } from '../../../package.json';
import { getResource, getResourceDefinitions } from '../../redux/actions/cost-management-actions';
import componentMapper from '@data-driven-forms/pf4-component-mapper/dist/esm/component-mapper';
import { WarningModal } from '../common/warningModal';
import { Spinner, Modal } from '@patternfly/react-core';
import ResourceDefinitionsFormTemplate from './ResourceDefinitionsFormTemplate';
import flatten from 'lodash/flattenDeep';
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

const selector = ({ costReducer: { resourceTypes, isLoading, loadingResources, resources } }, resourcesPath) => ({
  resourceTypes: resourceTypes.data,
  resources: resources[resourcesPath] ? { resourcesPath: resources[resourcesPath] } : resources,
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
        ? flatten(
            state.roleReducer.selectedRole.access
              .filter((a) => a.permission === permissionId)
              .map((access) => access.resourceDefinitions.map((resource) => resource.attributeFilter.value))
          )
        : [],
      isRecordLoading: state.roleReducer.isRecordLoading,
    }),
    shallowEqual
  );

  const { resourceTypes, isLoading, isLoadingResources, resources } = useSelector((props) => selector(props, state.resourcesPath), shallowEqual);

  useEffect(() => {
    fetchResourceDefinitions();
  }, [permissionId]);

  useEffect(() => {
    if (!isLoading) {
      let path = resourceTypes.find((r) => r.value === permissionId.split(':')?.[1])?.path;
      if (path) {
        dispatchLocally({ type: 'update', payload: { resourcesPath: path.split('/')[5] } });
        dispatch(getResource(path));
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

  const handleSubmit = (data) => {
    dispatchLocally({ type: 'update', payload: { changedResources: data['dual-list-select'] } });
    const newAccess = {
      permission: permissionId,
      resourceDefinitions: [
        {
          attributeFilter: {
            key: `cost-management.${permissionId.split(':')?.[1]}`,
            operation: data['dual-list-select'].length === 1 ? 'equal' : 'in',
            value: data['dual-list-select'].length === 1 ? data['dual-list-select'][0] : data['dual-list-select'],
          },
        },
      ],
    };
    dispatch(updateRole(roleId, { ...role, access: [...role.access.filter((item) => item.permission !== permissionId), newAccess] }), true).then(
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
          onSubmit={handleSubmit}
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
