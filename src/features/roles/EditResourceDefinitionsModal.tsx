import React, { useEffect, useMemo, useReducer } from 'react';
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
import { isInventoryHostsPermission, isInventoryPermission } from './roleResourceDefinitionsTableHelpers';
import messages from '../../Messages';
import type { RBACStore } from '../../redux/store.d';
import './role-permissions.scss';

interface InventoryGroup {
  id: string;
  name: string;
}

interface ResourceValue {
  value: string;
}

interface Resources {
  [key: string]: ResourceValue[];
}

interface State {
  changedResources: string[] | undefined;
  cancelWarningVisible: boolean;
  resourcesPath: string | undefined;
  loadingStateVisible: boolean;
}

type Action = { type: 'update'; payload: Partial<State> };

interface EditResourceDefinitionsModalProps {
  cancelRoute: string;
}

const createOptions = (resources: Record<string, InventoryGroup> | Resources | undefined, permissionId: string) =>
  isInventoryPermission(permissionId)
    ? // options for inventory
      [
        ...(isInventoryHostsPermission(permissionId) ? [<FormattedMessage key="ungrouped" data-value="null" {...messages.ungroupedSystems} />] : []),
        ...Object.values((resources as Record<string, InventoryGroup>) || {}).map((inventoryGroup) => (
          <span key={inventoryGroup.id} data-value={inventoryGroup.id}>
            {inventoryGroup.name}
          </span>
        )),
      ]
    : // options for cost-management
      Object.entries(resources as Resources).reduce(
        (acc: { value: string; path: string; label: string }[], [key, value]) => [
          ...acc,
          ...value.map((r) => ({
            value: r.value,
            path: key,
            label: r.value,
          })),
        ],
        [],
      );

const initialState: State = {
  changedResources: undefined,
  cancelWarningVisible: false,
  resourcesPath: undefined,
  loadingStateVisible: true,
};

function reducer(state: State, action: Action): State {
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

const createEditResourceDefinitionsSchema = (
  resources: Resources | undefined,
  resourcesPath: string | undefined,
  options: unknown[],
  isInventory: boolean,
  intl: ReturnType<typeof useIntl>,
) => {
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
              getValueFromNode: (option: { props: { 'data-value': string } }) => option.props['data-value'],
            }
          : {}),
      },
    ],
  };
};

interface SelectorState {
  costReducer: {
    resourceTypes: { data: { value: string; path: string }[] };
    isLoading: boolean;
    loadingResources: number;
    resources: Record<string, unknown>;
  };
  inventoryReducer: {
    resourceTypes: Record<string, Record<string, InventoryGroup>>;
    isLoading: boolean;
  };
}

const selector = (state: SelectorState, resourcesPath: string | undefined) => ({
  resourceTypes: state.costReducer.resourceTypes.data,
  resources: state.costReducer.resources[resourcesPath || '']
    ? { resourcesPath: state.costReducer.resources[resourcesPath || ''] }
    : state.costReducer.resources,
  isLoading: state.costReducer.isLoading,
  isLoadingResources: state.costReducer.loadingResources > 0,
  isLoadingInventory: state.inventoryReducer.isLoading,
  inventoryGroups: state.inventoryReducer.resourceTypes,
});

const validatorMapper = {
  'validate-resources': () => (value: string[] | undefined) =>
    value && value.length > 0 ? undefined : 'At least one resource must be defined for this permission',
};

const EditResourceDefinitionsModal: React.FC<EditResourceDefinitionsModalProps> = ({ cancelRoute }) => {
  const intl = useIntl();
  const { roleId, permissionId } = useParams<{ roleId: string; permissionId: string }>();
  const navigate = useAppNavigate();

  const dispatch = useDispatch();
  const getResourceDefinitions = () => dispatch(fetchResourceDefinitions({}) as unknown as { type: string });
  const getInventoryGroups = () =>
    dispatch(fetchInventoryGroups([permissionId!] as unknown as Parameters<typeof fetchInventoryGroups>[0], {}) as unknown as { type: string });
  const [state, dispatchLocally] = useReducer(reducer, initialState);
  const isInventory = useMemo(() => isInventoryPermission(permissionId!), [permissionId]);

  const { resourceTypes, isLoading, isLoadingResources, resources, isLoadingInventory, inventoryGroups } = useSelector(
    (props: SelectorState) => selector(props, state.resourcesPath),
    shallowEqual,
  );

  const { definedResources, role } = useSelector(
    (state: RBACStore) => ({
      role: state.roleReducer.selectedRole,
      definedResources: state.roleReducer.selectedRole?.access
        ? flatten(
            state.roleReducer.selectedRole.access
              .filter((a: { permission: string }) => a.permission === permissionId)
              .map((access: { resourceDefinitions: { attributeFilter: { value: unknown } }[] }) =>
                access.resourceDefinitions.map((resource) => {
                  const value = resource.attributeFilter.value;
                  if (isInventory) {
                    return Array.isArray(value) ? value.map((v) => String(v)) : String(value);
                  }
                  return resource.attributeFilter.value;
                }),
              ),
          )
        : [],
    }),
    shallowEqual,
  );

  useEffect(() => {
    (isInventory && getInventoryGroups()) || getResourceDefinitions();
  }, [permissionId]);

  useEffect(() => {
    if (!isLoading) {
      const path = resourceTypes.find((r: { value: string }) => r.value === permissionId?.split(':')?.[1])?.path;
      if (path) {
        dispatchLocally({ type: 'update', payload: { resourcesPath: path.split('/')[5] } });
        dispatch(fetchResource(path as unknown as { [key: string]: unknown }) as unknown as { type: string });
      }
    }
  }, [resourceTypes]);

  const onCancel = () => navigate(cancelRoute, { replace: true });

  const handleCancel = (data: { 'dual-list-select': string[] }) => {
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

  const handleSubmit = (data: { 'dual-list-select': string[] }) => {
    dispatchLocally({ type: 'update', payload: { changedResources: data['dual-list-select'] } });
    const dualListData = data['dual-list-select'].map((item) => (item === 'null' ? null : item));
    const newAccess = {
      permission: permissionId,
      resourceDefinitions: [
        {
          attributeFilter: {
            key: isInventory ? 'group.id' : `cost-management.${permissionId?.split(':')?.[1]}`,
            operation: dualListData.length === 1 ? 'equal' : 'in',
            value: dualListData.length === 1 ? dualListData[0] : dualListData,
          },
        },
      ],
    };
    (
      dispatch(
        updateRole(
          roleId!,
          {
            ...role,
            access: [...(role?.access || []).filter((item: { permission: string }) => item.permission !== permissionId), newAccess],
          } as unknown as Parameters<typeof updateRole>[1],
          true,
        ) as unknown as { type: string },
      ) as unknown as Promise<void>
    ).then(() => {
      (
        dispatch(fetchRole(roleId!) as unknown as { type: string }) as unknown as Promise<{
          value: { access: { permission: string; resourceDefinitions: unknown[] }[] };
        }>
      ).then(({ value }) => {
        if (isInventory) {
          const resourceDefs = value?.access?.find((item) => item.permission === permissionId)?.resourceDefinitions;
          dispatch(
            fetchInventoryGroupsDetails(processResourceDefinitions(resourceDefs as unknown as never[]) as unknown as string[]) as unknown as {
              type: string;
            },
          );
        }
      });
      navigate(cancelRoute);
    });
  };

  const options = createOptions(isInventory ? inventoryGroups[permissionId!] : (resources as Resources), permissionId!);

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
          schema={createEditResourceDefinitionsSchema(resources as Resources, state.resourcesPath, options, isInventory, intl)}
          componentMapper={componentMapper}
          initialValues={{ 'dual-list-select': state.changedResources || definedResources || [] }}
          onSubmit={handleSubmit}
          onCancel={(data: { 'dual-list-select': string[] }) => handleCancel(data)}
          validatorMapper={validatorMapper}
          FormTemplate={(props: Record<string, unknown>) => (
            <ResourceDefinitionsFormTemplate
              {...props}
              ModalProps={{
                onClose: handleCancel as (values: Record<string, unknown>) => void,
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

// Feature component (used by Routing.tsx) - both named and default exports
export { EditResourceDefinitionsModal };
export default EditResourceDefinitionsModal;
