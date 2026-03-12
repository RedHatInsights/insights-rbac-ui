import React, { useEffect, useState } from 'react';
import { useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';

import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { Wizard } from '@patternfly/react-core/deprecated';
import { createQueryParams } from '../../../../shared/helpers/navigation';
import { schemaBuilder } from './schema';
import { useCreateRoleMutation } from '../../../data/queries/roles';
import type { Permission, RolesCreateOrUpdateRoleRequest } from '../../../data/queries/roles';
import { useFlag } from '@unleash/proxy-client-react';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { RoleCreationSuccess } from '../components/RoleCreationSuccess';
import BaseRoleTable from './BaseRoleTable';
import AddPermissionsTable from './AddPermissions';
import ReviewStep from './ReviewStep';
import CostResources from './CostResources';
import TypeSelector from './TypeSelector';
import SetName from './SetName';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import { SilentErrorBoundary } from '../../../../shared/components/ui-states/SilentErrorBoundary';
import messages from '../../../../Messages';
import paths from '../../../utilities/pathnames';
import { AddRoleWizardContext } from './AddRoleWizardContext';
import type Schema from '@data-driven-forms/react-form-renderer/common-types/schema';

interface PaginationProps {
  limit: number;
}

interface FiltersProps {
  name?: string;
  [key: string]: unknown;
}

interface AddRoleWizardProps {
  pagination: PaginationProps;
  filters: FiltersProps;
  cancelRoute?: string;
}

interface DescriptionProps {
  Content: React.ComponentType<Record<string, unknown>>;
  [key: string]: unknown;
}

interface FormPermission {
  uuid: string;
  requires?: string[];
}

interface CostResource {
  permission: string;
  resources: string[];
}

interface FormData {
  'role-name'?: string;
  'role-description'?: string;
  'role-copy-name'?: string;
  'role-copy-description'?: string;
  'add-permissions-table': FormPermission[];
  'cost-resources'?: CostResource[];
  'role-type': 'create' | 'copy';
}

const FormTemplate: React.FC<React.ComponentProps<typeof Pf4FormTemplate>> = (props) => <Pf4FormTemplate {...props} showFormControls={false} />;
const Description: React.FC<DescriptionProps> = ({ Content, ...rest }) => <Content {...rest} />;

export const mapperExtension = {
  'set-name': SetName,
  'base-role-table': BaseRoleTable,
  'add-permissions-table': AddPermissionsTable,
  'cost-resources': CostResources,
  review: ReviewStep,
  description: Description,
  'type-selector': TypeSelector,
};

const AddRoleWizard: React.FunctionComponent<AddRoleWizardProps> = ({ pagination = {}, filters = {}, cancelRoute }) => {
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
  const [schema, setSchema] = useState<Schema | undefined>();

  useEffect(() => {
    setSchema(schemaBuilder(enableWorkspacesNameChange));
  }, [enableWorkspacesNameChange]);

  const rolesPath = paths['access-management-roles'].link();
  const userGroupsPath = paths['user-groups'].link();

  const onClose = () =>
    navigate({
      pathname: cancelRoute ?? rolesPath,
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
      pathname: cancelRoute ?? rolesPath,
      search: createQueryParams({ page: 1, per_page: pagination.limit, ...filters }),
    });
  };

  const setWizardError = (error: boolean | undefined) => setWizardContextValue((prev) => ({ ...prev, error }));
  const setWizardSuccess = (success: boolean) => setWizardContextValue((prev) => ({ ...prev, success }));
  const setHideForm = (hideForm: boolean) => setWizardContextValue((prev) => ({ ...prev, hideForm }));

  const handleFormCancel = (values: Record<string, unknown>) => {
    const showWarning = Boolean((values && values['role-name']) || values['role-description'] || values['copy-base-role']);
    if (showWarning) {
      setCancelWarningVisible(true);
    } else {
      onCancel();
    }
  };

  const onSubmit = (values: Record<string, unknown>) => {
    // DDF form values are Record<string, unknown>; FormData is the expected shape (eslint-disable-next-line: DDF limitation)
    const formData = values as unknown as FormData;
    const {
      'role-name': name,
      'role-description': description,
      'role-copy-name': copyName,
      'role-copy-description': copyDescription,
      'add-permissions-table': permissions,
      'role-type': type,
    } = formData;

    const selectedPermissionIds = permissions.map((record) => record.uuid);
    const roleName = type === 'create' ? (name ?? '') : (copyName ?? '');

    // V2 API: permissions only (no cost resource definitions or inventory groups)
    const roleData: RolesCreateOrUpdateRoleRequest = {
      name: roleName,
      description: (type === 'create' ? description : copyDescription) ?? '',
      permissions: permissions.reduce<Permission[]>(
        (acc, { uuid: permString, requires = [] }) => [
          ...acc,
          ...[permString, ...requires.filter((req) => !selectedPermissionIds.includes(req))].map((perm): Permission => {
            const [application, resource_type, operation] = perm.split(':');
            return { application: application ?? '', resource_type: resource_type ?? '', operation: operation ?? '' };
          }),
        ],
        [],
      ),
    };

    setWizardContextValue((prev) => ({ ...prev, submitting: true }));

    return createRoleMutation
      .mutateAsync(roleData)
      .then(() => {
        setWizardContextValue((prev) => ({ ...prev, submitting: false, success: true, hideForm: true }));
      })
      .catch((error: { errors?: Array<{ detail?: string }> }) => {
        addNotification({
          variant: 'danger',
          title: intl.formatMessage(messages.createRoleErrorTitle),
          description: error?.errors?.[0]?.detail ?? intl.formatMessage(messages.createRoleErrorDescription),
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
                      navigate(userGroupsPath);
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

export { AddRoleWizard };
export default AddRoleWizard;
