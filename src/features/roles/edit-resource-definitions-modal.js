import React, { useEffect, useMemo, useReducer } from 'react';
import PropTypes from 'prop-types';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import FormRenderer from '../../components/forms/FormRenderer';
import flatten from 'lodash/flattenDeep';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { shallowEqual, useDispatch, useSelector } from 'react-redux';
import { fetchRole, updateRole } from '../../redux/roles/actions';
import { fetchResource, fetchResourceDefinitions } from '../../redux/cost-management/actions';
import { fetchInventoryGroups, fetchInventoryGroupsDetails } from '../../redux/inventory/actions';
import { processResourceDefinitions } from '../../redux/inventory/helper';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { Bullseye } from '@patternfly/react-core';
import { Modal } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { ModalVariant } from '@patternfly/react-core';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import useAppNavigate from '../../hooks/useAppNavigate';
import ResourceDefinitionsFormTemplate from './ResourceDefinitionsFormTemplate';
import { isInventoryHostsPermission, isInventoryPermission } from './role-resource-definitions-table-helpers';
import messages from '../../Messages';
import './role-permissions.scss';

const createOptions = (resources, permissionId) =>
  isInventoryPermission(permissionId)
    ? // options for inventory
      [
        ...(isInventoryHostsPermission(permissionId) ? [<FormattedMessage key="ungrouped" data-value="null" {...messages.ungroupedSystems} />] : []),
        ...Object.values(resources || {}).map((inventoryGroup) => (
          <span key={inventoryGroup.id} data-value={inventoryGroup.id}>
            {inventoryGroup.name}
          </span>
        )),
      ]
    : // options for cost-management
      Object.entries(resources).reduce(
        (acc, [key, value]) => [
          ...acc,
          ...value.map((r) => ({
            value: r.value,
            path: key,
            label: r.value,
          })),
        ],
        [],
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

const createEditResourceDefinitionsSchema = (resources, resourcesPath, options, isInventory) => {
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
        options: [...((resourcesPath || isInventory) && resources ? options : [])],
        validate: [{ type: 'validate-resources' }],
        isSearchable: true,
        ...(isInventory
          ? {
              getValueFromNode: (option) => option.props['data-value'],
            }
          : {}),
      },
    ],
  };
};

const selector = (
  {
    costReducer: { resourceTypes, isLoading, loadingResources, resources },
    inventoryReducer: { resourceTypes: inventoryGroups, isLoading: isLoadingInventory },
  },
  resourcesPath,
) => ({
  resourceTypes: resourceTypes.data,
  resources: resources[resourcesPath] ? { resourcesPath: resources[resourcesPath] } : resources,
  isLoading,
  isLoadingResources: loadingResources > 0,
  isLoadingInventory,
  inventoryGroups,
});

const validatorMapper = {
  'validate-resources': () => (value) => (value && value.length > 0 ? undefined : 'At least one resource must be defined for this permission'),
};

const EditResourceDefinitionsModal = ({ cancelRoute }) => {
  const intl = useIntl();
  const { roleId, permissionId } = useParams();
  const navigate = useAppNavigate();

  const dispatch = useDispatch();
  const getResourceDefinitions = () => dispatch(fetchResourceDefinitions());
  const getInventoryGroups = () => dispatch(fetchInventoryGroups([permissionId]));
  const [state, dispatchLocally] = useReducer(reducer, initialState);
  const isInventory = useMemo(() => isInventoryPermission(permissionId), [permissionId]);

  const { resourceTypes, isLoading, isLoadingResources, resources, isLoadingInventory, inventoryGroups } = useSelector(
    (props) => selector(props, state.resourcesPath),
    shallowEqual,
  );

  const { definedResources, role } = useSelector(
    (state) => ({
      role: state.roleReducer.selectedRole,
      definedResources: state.roleReducer.selectedRole?.access
        ? flatten(
            state.roleReducer.selectedRole.access
              .filter((a) => a.permission === permissionId)
              .map((access) =>
                access.resourceDefinitions.map((resource) => {
                  const value = resource.attributeFilter.value;
                  if (isInventory) {
                    return Array.isArray(value) ? value.map((value) => String(value)) : String(value);
                  }
                  return resource.attributeFilter.value;
                }),
              ),
          )
        : [],
      isRecordLoading: state.roleReducer.isRecordLoading,
    }),
    shallowEqual,
  );

  useEffect(() => {
    (isInventory && getInventoryGroups()) || getResourceDefinitions();
  }, [permissionId]);

  useEffect(() => {
    if (!isLoading) {
      let path = resourceTypes.find((r) => r.value === permissionId.split(':')?.[1])?.path;
      if (path) {
        dispatchLocally({ type: 'update', payload: { resourcesPath: path.split('/')[5] } });
        dispatch(fetchResource(path));
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
    const dualListData = data['dual-list-select'].map((item) => (item === 'null' ? null : item));
    const newAccess = {
      permission: permissionId,
      resourceDefinitions: [
        {
          attributeFilter: {
            key: isInventory ? 'group.id' : `cost-management.${permissionId.split(':')?.[1]}`,
            operation: dualListData.length === 1 ? 'equal' : 'in',
            value: dualListData.length === 1 ? dualListData[0] : dualListData,
          },
        },
      ],
    };
    dispatch(updateRole(roleId, { ...role, access: [...role.access.filter((item) => item.permission !== permissionId), newAccess] }), true).then(
      () => {
        dispatch(fetchRole(roleId)).then(({ value }) => {
          isInventory &&
            dispatch(
              fetchInventoryGroupsDetails(
                processResourceDefinitions(value?.access?.find((item) => item.permission === permissionId)?.resourceDefinitions),
              ),
            );
        });
        navigate(cancelRoute);
      },
    );
  };

  const options = createOptions(isInventory ? inventoryGroups[permissionId] : resources, permissionId);

  return (
    <React.Fragment>
      <WarningModal
        title={intl.formatMessage(messages.exitEditResourceDefinitions)}
        isOpen={state.cancelWarningVisible}
        onClose={() => dispatchLocally({ type: 'update', payload: { cancelWarningVisible: false } })}
        onConfirm={onCancel}
        data-testid="warning-modal"
        confirmButtonLabel={intl.formatMessage(messages.discard)}
      >
        {intl.formatMessage(messages.changesWillBeLost)}
      </WarningModal>
      {(isLoading || isLoadingResources || isLoadingInventory) && state.loadingStateVisible ? (
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
          schema={createEditResourceDefinitionsSchema(resources, state.resourcesPath, options, isInventory)}
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
