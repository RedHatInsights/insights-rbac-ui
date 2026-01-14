import React, { useEffect, useMemo, useState } from 'react';
import { useIntl } from 'react-intl';
import { Wizard } from '@patternfly/react-core/deprecated';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { useFlag } from '@unleash/proxy-client-react';
import { type Access, type ResourceDefinition, type RoleWithAccess, useUpdateRoleMutation } from '../../../data/queries/roles';
import AddPermissionsTable from '../add-role/AddPermissions';
import AddRolePermissionSummaryContent from './AddRolePermissionSummaryContent';
import AddRolePermissionSuccess from './AddRolePermissionSuccess';
import CostResources from '../add-role/CostResources';
import InventoryGroupsRole from '../add-role/InventoryGroupsRole';
import { schemaBuilder } from './schema';
import useAppNavigate from '../../../hooks/useAppNavigate';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';
import { AddRolePermissionWizardContext } from './AddRolePermissionWizardContext';

interface AddRolePermissionWizardProps {
  role: RoleWithAccess;
}

interface WizardContextValue {
  success: boolean;
  submitting: boolean;
  error: string | undefined;
  hideForm: boolean;
}

/**
 * Form data structure matching the wizard schema.
 * Each field corresponds to a step in the wizard.
 */
interface AddRolePermissionFormData extends Record<string, unknown> {
  'add-permissions-table': Array<{
    uuid: string;
    requires?: string[];
  }>;
  'cost-resources'?: Array<{
    permission: string;
    resources: string[];
  }>;
  'inventory-groups-role'?: Array<{
    permission: string;
    groups?: Array<{ id: string }>;
  }>;
}

/**
 * Type guard to validate form data structure.
 */
function isAddRolePermissionFormData(data: Record<string, unknown>): data is AddRolePermissionFormData {
  return (
    Array.isArray(data['add-permissions-table']) &&
    (data['cost-resources'] === undefined || Array.isArray(data['cost-resources'])) &&
    (data['inventory-groups-role'] === undefined || Array.isArray(data['inventory-groups-role']))
  );
}

const FormTemplate = (props: React.ComponentProps<typeof Pf4FormTemplate>) => <Pf4FormTemplate {...props} showFormControls={false} />;

export const mapperExtension = {
  'add-permissions-table': AddPermissionsTable,
  'inventory-groups-role': InventoryGroupsRole,
  'cost-resources': CostResources,
  review: AddRolePermissionSummaryContent,
};

const AddRolePermissionWizard: React.FC<AddRolePermissionWizardProps> = ({ role }) => {
  const intl = useIntl();
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const [currentRoleID, setCurrentRoleID] = useState('');
  const navigate = useAppNavigate();
  const updateRoleMutation = useUpdateRoleMutation();
  const enableWorkspacesNameChange = useFlag('platform.rbac.groups-to-workspaces-rename');
  const [wizardContextValue, setWizardContextValue] = useState<WizardContextValue>({
    success: false,
    submitting: false,
    error: undefined,
    hideForm: false,
  });
  const setWizardError = (error: string | undefined) => setWizardContextValue((prev) => ({ ...prev, error }));
  const setWizardSuccess = (success: boolean) => setWizardContextValue((prev) => ({ ...prev, success }));
  const setHideForm = (hideForm: boolean) => setWizardContextValue((prev) => ({ ...prev, hideForm }));
  const schema = useMemo(() => schemaBuilder(enableWorkspacesNameChange), [enableWorkspacesNameChange]);

  useEffect(() => {
    setCurrentRoleID(role.uuid);
  });

  const handleWizardCancel = () => {
    setCancelWarningVisible(true);
  };

  const handleConfirmCancel = () => {
    navigate(pathnames['role-detail'].link.replace(':roleId', role.uuid));
  };

  const onSubmit = async (formData: Record<string, unknown>) => {
    // Type-safe form data extraction with validation
    if (!isAddRolePermissionFormData(formData)) {
      console.error('Invalid form data structure', formData);
      return;
    }

    const {
      'add-permissions-table': selectedPermissions,
      'cost-resources': costResources = [],
      'inventory-groups-role': invResources = [],
    } = formData;

    const selectedPermissionIds = [...role.access.map((record) => record.permission), ...selectedPermissions.map((record) => record.uuid)];

    const newAccess = selectedPermissions.reduce<Access[]>(
      (acc, { uuid: permission, requires = [] }) => [
        ...acc,
        ...[permission, ...requires.filter((require) => !selectedPermissionIds.includes(require))].map(
          (perm): Access => ({
            permission: perm,
            resourceDefinitions: [...costResources, ...invResources]?.find((r) => r.permission === perm)
              ? perm.includes('inventory')
                ? ([
                    {
                      attributeFilter: {
                        key: 'group.id',
                        operation: 'in',
                        value: invResources?.find((g) => g.permission === perm)?.groups?.map((group) => group?.id) ?? [],
                      },
                    },
                  ] as ResourceDefinition[])
                : perm.includes('cost-management') && (costResources?.find((r) => r.permission === perm)?.resources.length ?? 0) > 0
                  ? ([
                      {
                        attributeFilter: {
                          key: `cost-management.${perm.split(':')[1]}`,
                          operation: 'in',
                          value: costResources?.find((r) => r.permission === perm)?.resources ?? [],
                        },
                      },
                    ] as ResourceDefinition[])
                  : []
              : [],
          }),
        ),
      ],
      (role.access as Access[]) || [],
    );

    const roleData = {
      ...role,
      access: [...newAccess],
      accessCount: (role.accessCount ?? 0) + selectedPermissions.length,
    };

    setWizardContextValue((prev) => ({ ...prev, submitting: true }));
    updateRoleMutation
      .mutateAsync({
        uuid: currentRoleID,
        rolePut: {
          name: roleData.display_name,
          display_name: roleData.display_name,
          description: roleData.description,
          access: newAccess,
        },
      })
      .then(() => setWizardContextValue((prev) => ({ ...prev, submitting: false, success: true, hideForm: true })))
      .catch(() => {
        setWizardContextValue((prev) => ({ ...prev, submitting: false, success: false, hideForm: true }));
        navigate(pathnames['role-detail'].link.replace(':roleId', role.uuid));
      });
  };

  return (
    <AddRolePermissionWizardContext.Provider
      value={{ ...wizardContextValue, setWizardError, setWizardSuccess, setHideForm, rolePermissions: role.access }}
    >
      <WarningModal
        title={intl.formatMessage(messages.exitItemAdding, { item: intl.formatMessage(messages.permissions).toLocaleLowerCase() })}
        isOpen={cancelWarningVisible}
        onClose={() => setCancelWarningVisible(false)}
        confirmButtonLabel={intl.formatMessage(messages.discard)}
        onConfirm={handleConfirmCancel}
      >
        {intl.formatMessage(messages.discardedInputsWarning)}
      </WarningModal>
      {wizardContextValue.hideForm ? (
        wizardContextValue.success ? (
          <Wizard
            title={intl.formatMessage(messages.addPermissions)}
            isOpen
            steps={[
              {
                name: 'success',
                component: <AddRolePermissionSuccess currentRoleID={currentRoleID} />,
                isFinishedStep: true,
              },
            ]}
            onClose={handleConfirmCancel}
          />
        ) : null
      ) : (
        <FormRenderer
          schema={schema}
          subscription={{ values: true }}
          FormTemplate={FormTemplate}
          initialValues={{
            'role-uuid': role.uuid,
            'role-type': 'create',
            'role-name': role.display_name,
            'role-description': role.description,
          }}
          componentMapper={{ ...componentMapper, ...mapperExtension }}
          onSubmit={onSubmit}
          onCancel={(values: Record<string, unknown>) => {
            if (values && isAddRolePermissionFormData(values) && values['add-permissions-table'].length > 0) {
              handleWizardCancel();
            } else {
              handleConfirmCancel();
            }
          }}
        />
      )}
    </AddRolePermissionWizardContext.Provider>
  );
};

// Feature component (used by Routing.tsx) - both named and default exports
export { AddRolePermissionWizard };
export default AddRolePermissionWizard;
