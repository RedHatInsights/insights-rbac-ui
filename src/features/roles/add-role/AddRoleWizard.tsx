import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';

import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { Wizard } from '@patternfly/react-core/deprecated';
import { createQueryParams } from '../../../helpers/navigation';
import { schemaBuilder } from './schema';
import { useCreateRoleMutation } from '../../../data/queries/roles';
import { useFlag } from '@unleash/proxy-client-react';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { RoleCreationSuccess } from '../components/RoleCreationSuccess';
import BaseRoleTable from './BaseRoleTable';
import AddPermissionsTable from './AddPermissions';
import ReviewStep from './ReviewStep';
import InventoryGroupsRole from './InventoryGroupsRole';
import CostResources from './CostResources';
import TypeSelector from './TypeSelector';
import SetName from './SetName';
import useAppNavigate from '../../../hooks/useAppNavigate';
import { SilentErrorBoundary } from '../../../components/ui-states/SilentErrorBoundary';
import messages from '../../../Messages';
import paths from '../../../utilities/pathnames';
import { AddRoleWizardContext } from './AddRoleWizardContext';
// RoleIn type removed - RoleData interface now matches it directly

interface PaginationProps {
  limit: number;
}

interface FiltersProps {
  name?: string;
  [key: string]: any;
}

interface AddRoleWizardProps {
  pagination: PaginationProps;
  filters: FiltersProps;
}

interface DescriptionProps {
  Content: React.ComponentType<any>;
  [key: string]: any;
}

interface Permission {
  uuid: string;
  requires?: string[];
}

interface CostResource {
  permission: string;
  resources: string[];
}

interface InventoryResource {
  permission: string;
  groups: Array<{ id: string }>;
}

interface FormData {
  'role-name'?: string;
  'role-description'?: string;
  'role-copy-name'?: string;
  'role-copy-description'?: string;
  'add-permissions-table': Permission[];
  'inventory-groups-role'?: InventoryResource[];
  'cost-resources'?: CostResource[];
  'role-type': 'create' | 'copy';
}

// Use types from rbac-client for type safety
import type { Access, ResourceDefinition } from '@redhat-cloud-services/rbac-client/types';

/**
 * Role data structure matching RoleIn from rbac-client.
 * Note: The API computes 'applications' from permissions server-side,
 * so we don't include it here.
 */
interface RoleData {
  name: string;
  display_name?: string;
  description?: string;
  access: Access[];
}

const FormTemplate: React.FC<any> = (props) => <Pf4FormTemplate {...props} showFormControls={false} />;
const Description: React.FC<DescriptionProps> = ({ Content, ...rest }) => <Content {...rest} />;

export const mapperExtension = {
  'set-name': SetName,
  'base-role-table': BaseRoleTable,
  'add-permissions-table': AddPermissionsTable,
  'cost-resources': CostResources,
  'inventory-groups-role': InventoryGroupsRole,
  review: ReviewStep,
  description: Description,
  'type-selector': TypeSelector,
};

const AddRoleWizard: React.FunctionComponent<AddRoleWizardProps> = ({ pagination, filters }) => {
  const intl = useIntl();
  const navigate = useAppNavigate();
  const enableWorkspacesNameChange = useFlag('platform.rbac.groups-to-workspaces-rename');
  const addNotification = useAddNotification();
  const createRoleMutation = useCreateRoleMutation();

  const [wizardContextValue, setWizardContextValue] = useState<{
    success: boolean;
    submitting: boolean;
    error: boolean | undefined;
    hideForm: boolean;
  }>({
    success: false,
    submitting: false,
    error: undefined,
    hideForm: false,
  });

  const [cancelWarningVisible, setCancelWarningVisible] = useState<boolean>(false);
  const [schema, setSchema] = useState<any>();

  useEffect(() => {
    setSchema(schemaBuilder(enableWorkspacesNameChange));
  }, [enableWorkspacesNameChange]);

  const onClose = () =>
    navigate({
      pathname: paths.roles.link,
      search: createQueryParams({ page: 1, per_page: pagination.limit, ...filters }),
    });

  const onCancel = () => {
    if (!wizardContextValue.success) {
      addNotification({
        variant: 'warning',
        title: intl.formatMessage(messages.creatingRoleCanceled),
      });
    }

    setCancelWarningVisible(false);

    navigate({
      pathname: paths.roles.link,
      search: createQueryParams({ page: 1, per_page: pagination.limit, ...filters }),
    });
  };

  const setWizardError = (error: boolean | undefined) => setWizardContextValue((prev) => ({ ...prev, error }));
  const setWizardSuccess = (success: boolean) => setWizardContextValue((prev) => ({ ...prev, success }));
  const setHideForm = (hideForm: boolean) => setWizardContextValue((prev) => ({ ...prev, hideForm }));

  const handleFormCancel = (values: Record<string, any>) => {
    const showWarning = Boolean((values && values['role-name']) || values['role-description'] || values['copy-base-role']);
    if (showWarning) {
      setCancelWarningVisible(true);
    } else {
      onCancel();
    }
  };

  const onSubmit = (formData: FormData) => {
    const {
      'role-name': name,
      'role-description': description,
      'role-copy-name': copyName,
      'role-copy-description': copyDescription,
      'add-permissions-table': permissions,
      'inventory-groups-role': invResources,
      'cost-resources': costResources,
      'role-type': type,
    } = formData;

    const selectedPermissionIds = permissions.map((record) => record.uuid);
    const roleName = type === 'create' ? name || '' : copyName || '';

    const roleData: RoleData = {
      name: roleName,
      display_name: roleName,
      description: (type === 'create' ? description : copyDescription) || undefined,
      access: permissions.reduce<Access[]>(
        (acc, { uuid: permission, requires = [] }) => [
          ...acc,
          ...[permission, ...requires.filter((require) => !selectedPermissionIds.includes(require))].map((permission): Access => {
            const resourceDefinitions: ResourceDefinition[] = [];

            const costResource = costResources?.find((r) => r.permission === permission);
            if (permission.includes('cost-management') && costResource && costResource.resources.length > 0) {
              resourceDefinitions.push({
                attributeFilter: {
                  key: `cost-management.${permission.split(':')[1]}`,
                  operation: 'in',
                  value: costResource.resources,
                },
              });
            } else if (permission.includes('inventory')) {
              const groups = invResources?.find((g) => g.permission === permission)?.groups;
              const groupIds = groups?.map((group) => group?.id).filter((id): id is string => id !== undefined && id !== null);
              if (groupIds && groupIds.length > 0) {
                resourceDefinitions.push({
                  attributeFilter: {
                    key: 'group.id',
                    operation: 'in',
                    value: groupIds,
                  },
                });
              }
            }

            return {
              permission,
              resourceDefinitions,
            };
          }),
        ],
        [],
      ),
    };

    setWizardContextValue((prev) => ({ ...prev, submitting: true }));

    return createRoleMutation
      .mutateAsync(roleData)
      .then(() => {
        // Success is shown via RoleCreationSuccess wizard step, no notification needed
        // Cache invalidation happens automatically in the mutation's onSuccess
        setWizardContextValue((prev) => ({ ...prev, submitting: false, success: true, hideForm: true }));
      })
      .catch((error: { errors?: Array<{ detail?: string }> }) => {
        addNotification({
          variant: 'danger',
          title: intl.formatMessage(messages.createRoleErrorTitle),
          description: error?.errors?.[0]?.detail || intl.formatMessage(messages.createRoleErrorDescription),
        });
        setWizardContextValue((prev) => ({ ...prev, submitting: false, success: false, hideForm: true }));
        onClose();
      });
  };

  if (!schema) {
    return null;
  }

  return (
    <AddRoleWizardContext.Provider value={{ ...wizardContextValue, setWizardError, setWizardSuccess, setHideForm }}>
      <SilentErrorBoundary silentErrorString="focus-trap">
        <WarningModal
          title={intl.formatMessage(messages.exitItemCreation, { item: intl.formatMessage(messages.role).toLocaleLowerCase() })}
          confirmButtonLabel={intl.formatMessage(messages.discard)}
          isOpen={cancelWarningVisible}
          onClose={() => setCancelWarningVisible(false)}
          onConfirm={onCancel}
        >
          {intl.formatMessage(messages.discardedInputsWarning)}
        </WarningModal>
      </SilentErrorBoundary>
      {wizardContextValue.hideForm ? (
        wizardContextValue.success ? (
          <Wizard
            title={intl.formatMessage(messages.createRole)}
            isOpen
            onClose={onClose}
            steps={[
              {
                name: 'success',
                component: (
                  <RoleCreationSuccess
                    onClose={onClose}
                    onCreateAnother={() => {
                      setHideForm(false);
                      setWizardSuccess(false);
                    }}
                    onAddToGroup={() => {
                      navigate(paths.groups.link);
                    }}
                  />
                ),
                isFinishedStep: true,
              },
            ]}
          />
        ) : null
      ) : (
        <FormRenderer
          schema={schema}
          subscription={{ values: true }}
          FormTemplate={FormTemplate}
          initialValues={{
            'role-type': 'create',
          }}
          componentMapper={{ ...componentMapper, ...mapperExtension }}
          onSubmit={onSubmit}
          onCancel={handleFormCancel}
        />
      )}
    </AddRoleWizardContext.Provider>
  );
};

// Feature component (used by Routing.tsx) - both named and default exports
export { AddRoleWizard };
export default AddRoleWizard;
