import React, { useMemo, useReducer } from 'react';
import componentTypes from '@data-driven-forms/react-form-renderer/component-types';
import pf4ComponentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import ReactFormRender from '@data-driven-forms/react-form-renderer/form-renderer';
import FixedDualListSelect from '../../components/forms/FixedDualListSelect';
import { FormattedMessage, useIntl } from 'react-intl';
import { useParams } from 'react-router-dom';
import { Bullseye } from '@patternfly/react-core';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { Spinner } from '@patternfly/react-core/dist/dynamic/components/Spinner';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import useAppNavigate from '../../hooks/useAppNavigate';
import ResourceDefinitionsFormTemplate from './ResourceDefinitionsFormTemplate';
import { isInventoryHostsPermission, isInventoryPermission } from './roleResourceDefinitionsTableHelpers';
import { getModalContainer } from '../../helpers/modal-container';
import { useRoleQuery, useUpdateRoleMutation } from '../../data/queries/roles';
import { useResourceQuery, useResourceTypesQuery } from '../../data/queries/cost';
import { useInventoryGroupsQuery } from '../../data/queries/inventory';
import type { Access, ResourceDefinition } from '@redhat-cloud-services/rbac-client/types';
import messages from '../../Messages';

// Create a custom component mapper with our fixed DualListSelect
const componentMapper = {
  ...pf4ComponentMapper,
  [componentTypes.DUAL_LIST_SELECT]: FixedDualListSelect,
};

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
  loadingStateVisible: boolean;
}

type Action = { type: 'update'; payload: Partial<State> };

interface EditResourceDefinitionsModalProps {
  cancelRoute: string;
}

// Helper to create options for DualListSelect
const createOptions = (resources: Record<string, InventoryGroup> | Resources | undefined, permissionId: string) =>
  isInventoryPermission(permissionId)
    ? [
        ...(isInventoryHostsPermission(permissionId) ? [<FormattedMessage key="ungrouped" data-value="null" {...messages.ungroupedSystems} />] : []),
        ...Object.values((resources as Record<string, InventoryGroup>) || {}).map((inventoryGroup) => (
          <span key={inventoryGroup.id} data-value={inventoryGroup.id}>
            {inventoryGroup.name}
          </span>
        )),
      ]
    : Object.entries(resources as Resources).reduce(
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
  loadingStateVisible: true,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'update':
      return { ...state, ...action.payload };
    default:
      throw new Error();
  }
}

// Helper to extract value from JSX option elements
const extractValueFromNode = (option: { props: { 'data-value': string } }) => option.props['data-value'];

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
        ...(isInventory ? { getValueFromNode: extractValueFromNode } : {}),
      },
    ],
  };
};

const validatorMapper = {
  'validate-resources': () => (value: string[] | undefined) =>
    value && value.length > 0 ? undefined : 'At least one resource must be defined for this permission',
};

const EditResourceDefinitionsModal: React.FC<EditResourceDefinitionsModalProps> = ({ cancelRoute }) => {
  const intl = useIntl();
  const { roleId, permissionId } = useParams<{ roleId: string; permissionId: string }>();
  const navigate = useAppNavigate();
  const [state, dispatchLocally] = useReducer(reducer, initialState);
  const isInventory = useMemo(() => isInventoryPermission(permissionId!), [permissionId]);

  // TanStack Query hooks
  const { data: role, isLoading: isRoleLoading } = useRoleQuery(roleId ?? '');
  const updateRoleMutation = useUpdateRoleMutation();

  // Cost management queries (for non-inventory permissions)
  const { data: resourceTypesData, isLoading: isLoadingResourceTypes } = useResourceTypesQuery({ enabled: !isInventory });

  // Find the resource path for this permission
  const resourcesPath = useMemo(() => {
    if (isInventory || !resourceTypesData?.data) return undefined;
    const resourceType = resourceTypesData.data.find((r) => r.value === permissionId?.split(':')?.[1]);
    return resourceType?.path?.split('/')[5];
  }, [resourceTypesData, permissionId, isInventory]);

  // Fetch specific resource data for cost management
  const { data: resourceData, isLoading: isLoadingResource } = useResourceQuery(
    { path: resourcesPath ?? '' },
    { enabled: !isInventory && !!resourcesPath },
  );

  // Inventory groups query
  const { data: inventoryGroupsData, isLoading: isLoadingInventory } = useInventoryGroupsQuery(undefined, { enabled: isInventory });

  // Convert inventory groups to lookup map
  const inventoryGroups = useMemo(() => {
    if (!inventoryGroupsData?.data) return {};
    return inventoryGroupsData.data.reduce(
      (acc, group) => {
        if (group.id) {
          acc[group.id] = group;
        }
        return acc;
      },
      {} as Record<string, InventoryGroup>,
    );
  }, [inventoryGroupsData]);

  // Get currently defined resources for this permission
  const definedResources = useMemo((): string[] => {
    if (!role?.access) return [];
    const result: string[] = [];
    role.access
      .filter((a) => a.permission === permissionId)
      .forEach((access) => {
        access.resourceDefinitions?.forEach((resource) => {
          const value = resource.attributeFilter.value;
          if (Array.isArray(value)) {
            value.forEach((v) => result.push(String(v)));
          } else if (value !== null && value !== undefined) {
            result.push(String(value));
          }
        });
      });
    return result;
  }, [role?.access, permissionId]);

  // Create resources object for options
  const resources = useMemo((): Resources | Record<string, InventoryGroup> | undefined => {
    if (isInventory) {
      return inventoryGroups;
    }
    if (resourcesPath && resourceData) {
      return { [resourcesPath]: resourceData.data as ResourceValue[] };
    }
    return undefined;
  }, [isInventory, inventoryGroups, resourcesPath, resourceData]);

  const options = useMemo(() => createOptions(resources, permissionId!), [resources, permissionId]);

  const isLoading = isRoleLoading || isLoadingResourceTypes || isLoadingResource || isLoadingInventory;

  const onCancel = () => navigate(cancelRoute, { replace: true });

  const handleCancel = (data: { 'dual-list-select': string[] }) => {
    if (JSON.stringify(data['dual-list-select']) === JSON.stringify(definedResources)) {
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

  const handleSubmit = async (data: { 'dual-list-select': string[] }) => {
    if (!role || !roleId || !permissionId) return;

    dispatchLocally({ type: 'update', payload: { changedResources: data['dual-list-select'] } });
    const dualListData = data['dual-list-select'].map((item) => (item === 'null' ? null : item));
    const key = isInventory ? 'group.id' : `cost-management.${permissionId.split(':')?.[1]}`;

    // Create resource definition based on number of values
    let resourceDefinition: ResourceDefinition;
    if (dualListData.length === 1) {
      resourceDefinition = {
        attributeFilter: {
          key,
          operation: 'equal' as const,
          value: dualListData[0],
        },
      };
    } else {
      resourceDefinition = {
        attributeFilter: {
          key,
          operation: 'in' as const,
          value: dualListData.filter((v): v is string => v !== null),
        },
      };
    }

    const newAccess: Access = {
      permission: permissionId,
      resourceDefinitions: [resourceDefinition],
    };

    try {
      await updateRoleMutation.mutateAsync({
        uuid: roleId,
        rolePut: {
          name: role.name,
          display_name: role.display_name ?? role.name,
          description: role.description,
          access: [...(role.access || []).filter((item) => item.permission !== permissionId), newAccess],
        },
      });
      navigate(cancelRoute);
    } catch (error) {
      console.error('Failed to update resource definitions:', error);
    }
  };

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
      {isLoading && state.loadingStateVisible ? (
        <Modal
          appendTo={getModalContainer()}
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
        <ReactFormRender
          schema={createEditResourceDefinitionsSchema(resources as Resources, resourcesPath, options, isInventory, intl)}
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

export { EditResourceDefinitionsModal };
export default EditResourceDefinitionsModal;
