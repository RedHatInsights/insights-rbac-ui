import React, { useEffect, useReducer } from 'react';
import PropTypes from 'prop-types';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import FormRenderer from '../common/form-renderer';
import { useParams } from 'react-router-dom';
import { useDispatch, useSelector, shallowEqual } from 'react-redux';
import { updateRole, fetchRole } from '../../redux/actions/role-actions';
import { getResource, getResourceDefinitions } from '../../redux/actions/cost-management-actions';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { WarningModal } from '../common/warningModal';
import { Spinner, Modal, ModalVariant, Bullseye } from '@patternfly/react-core';
import useAppNavigate from '../../hooks/useAppNavigate';
import ResourceDefinitionsFormTemplate from './ResourceDefinitionsFormTemplate';
import flatten from 'lodash/flattenDeep';
import { useIntl } from 'react-intl';
import messages from '../../Messages';
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

const createEditResourceDefinitionsSchema = (resources, resourcesPath, options) => {
  const intl = useIntl();
  return {
    fields: [
      {
        component: componentTypes.DUAL_LIST_SELECT,
        name: 'dual-list-select',
        leftTitle: intl.formatMessage(messages.resourcesAvailable),
        rightTitle: intl.formatMessage(messages.resourcesDefined),
        filterOptionsTitle: intl.formatMessage(messages.filterByResource),
        filterValueTitle: intl.formatMessage(messages.filterByResource),
        options: [...(resourcesPath && resources ? options : [])],
        validate: [{ type: 'validate-resources' }],
        isSearchable: true,
      },
    ],
  };
};

const selector = ({ costReducer: { resourceTypes, isLoading, loadingResources, resources } }, resourcesPath) => ({
  resourceTypes: resourceTypes.data,
  resources: resources[resourcesPath] ? { resourcesPath: resources[resourcesPath] } : resources,
  isLoading,
  isLoadingResources: loadingResources > 0,
});

const validatorMapper = {
  'validate-resources': () => (value) => value && value.length > 0 ? undefined : 'At least one resource must be defined for this permission',
};

const EditResourceDefinitionsModal = ({ cancelRoute }) => {
  const intl = useIntl();
  const { roleId, permissionId } = useParams();
  const navigate = useAppNavigate();

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

  const onCancel = () => navigate(cancelRoute, { replace: true });

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
        navigate(cancelRoute);
      }
    );
  };

  const options = createOptions(resources);

  return (
    <React.Fragment>
      <WarningModal
        customTitle={intl.formatMessage(messages.exitEditResourceDefinitions)}
        customDescription={intl.formatMessage(messages.changesWillBeLost)}
        isOpen={state.cancelWarningVisible}
        onModalCancel={() => dispatchLocally({ type: 'update', payload: { cancelWarningVisible: false } })}
        onConfirmCancel={onCancel}
      ></WarningModal>
      {(isLoading || isLoadingResources) && state.loadingStateVisible ? (
        <Modal
          variant={ModalVariant.large}
          className="rbac-m-resource-definitions"
          isOpen={true}
          title={intl.formatMessage(messages.editResourceDefinitions)}
          onClose={() => {
            dispatchLocally({ type: 'update', payload: { loadingStateVisible: false } });
            onCancel();
          }}
        >
          <Bullseye>
            <Spinner />
          </Bullseye>
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
                title: intl.formatMessage(messages.editResourceDefinitions),
                description: intl.formatMessage(messages.editPermissionsUsingArrows),
              }}
            />
          )}
        />
      )}
    </React.Fragment>
  );
};

EditResourceDefinitionsModal.propTypes = {
  cancelRoute: PropTypes.string.isRequired,
};

export default EditResourceDefinitionsModal;
