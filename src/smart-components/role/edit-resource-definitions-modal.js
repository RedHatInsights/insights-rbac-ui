import React, { useEffect, useState } from 'react';
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

const createOptions = (resources) => {
  let options = [];
  for (const [key, value] of Object.entries(resources)) {
    options = [
      ...options,
      ...value.map((r) => ({
        value: r.value,
        path: key,
        label: r.value,
      })),
    ];
  }

  return options;
};

const createEditResourceDefinitionsSchema = (resources, resourcesPath, options) => ({
  fields: [
    {
      component: componentTypes.DUAL_LIST_SELECT,
      name: 'dual-list-select',
      leftTitle: 'Resources available for the permission',
      rightTitle: 'Resources added to the permission',
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

  const [resourcesPath, setResourcesPath] = useState(undefined);
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const [loadingStateVisible, setLoadingStateVisible] = useState(true);
  const [changedResources, setChangedResources] = useState();

  const { definedResources, role } = useSelector(
    (state) => ({
      role: state.roleReducer.selectedRole,
      definedResources: state.roleReducer.selectedRole?.access
        ? state.roleReducer.selectedRole.access
            .find((a) => a.permission === permissionId)
            .resourceDefinitions.reduce((acc, curr) => [...acc, curr.attributeFilter.value], []) // tady to jsem přehodil komentář, nefunguje!
        : [],
      isRecordLoading: state.roleReducer.isRecordLoading,
    }),
    shallowEqual
  );

  const { resourceTypes, isLoading, isLoadingResources, resources } = useSelector((props) => selector(props, resourcesPath), shallowEqual);

  useEffect(() => {
    fetchResourceDefinitions();
  }, [permissionId]);

  useEffect(() => {
    if (!isLoading) {
      let path = resourceTypes.find((r) => r.value === permissionId.split(':')?.[1])?.path;
      if (path) {
        setResourcesPath(path.split('/')[5]);
        dispatch(getResource(path));
      } else if (permissionId.split(':')?.[1] === '*') {
        setResourcesPath('*');
        resourceTypes.map((r) => dispatch(getResource(r.path)));
      }
    }
  }, [resourceTypes]);

  const onCancel = () => replace(cancelRoute);

  const handleCancel = (data) => {
    if (data['dual-list-select'] === definedResources) {
      onCancel();
    } else {
      setChangedResources(data['dual-list-select']);
      setCancelWarningVisible(true);
    }
  };

  const handleSubmit = (data, options) => {
    setChangedResources(data['dual-list-select']);
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
        isOpen={cancelWarningVisible}
        onModalCancel={() => setCancelWarningVisible(false)}
        onConfirmCancel={onCancel}
      ></WarningModal>
      {(isLoading || isLoadingResources) && loadingStateVisible ? (
        <Modal
          className="ins-m-resource-definitions"
          isOpen={true}
          title="Edit resource definitions"
          onClose={() => {
            setLoadingStateVisible(false);
            onCancel();
          }}
        >
          <Spinner />
        </Modal>
      ) : (
        <FormRenderer
          schema={createEditResourceDefinitionsSchema(resources, resourcesPath, options)}
          componentMapper={componentMapper}
          initialValues={{ 'dual-list-select': changedResources || definedResources || [] }}
          onSubmit={(props) => handleSubmit(props, options)}
          onCancel={(data) => handleCancel(data)}
          validatorMapper={validatorMapper}
          FormTemplate={(props) => (
            <ResourceDefinitionsFormTemplate
              saveLabel="Submit"
              {...props}
              ModalProps={{
                onClose: handleCancel,
                isOpen: !cancelWarningVisible,
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
