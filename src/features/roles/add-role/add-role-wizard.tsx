import React, { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { useIntl } from 'react-intl';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { Wizard } from '@patternfly/react-core/deprecated';
import { createQueryParams } from '../../../helpers/navigation';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { schemaBuilder } from './schema';
import { createRole, fetchRolesWithPolicies } from '../../../redux/roles/actions';
import { useFlag } from '@unleash/proxy-client-react';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { RoleCreationSuccess } from '../components/RoleCreationSuccess';
import BaseRoleTable from './base-role-table';
import AddPermissionsTable from './add-permissions';
import ReviewStep from './review';
import InventoryGroupsRole from './inventory-groups-role';
import CostResources from './cost-resources';
import TypeSelector from './type-selector';
import SetName from './set-name';
import useAppNavigate from '../../../hooks/useAppNavigate';
import { SilentErrorBoundary } from '../../../components/ui-states/SilentErrorBoundary';
import messages from '../../../Messages';
import paths from '../../../utilities/pathnames';
import './add-role-wizard.scss';
import { AddRoleWizardContext } from './add-role-wizard-context';
import { RoleIn } from '@redhat-cloud-services/rbac-client/types';

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
  orderBy?: string;
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

interface AttributeFilter {
  key: string;
  operation: 'in';
  value: string[] | undefined;
}

interface RoleAccess {
  permission: string;
  resourceDefinitions: Array<{ attributeFilter: AttributeFilter }> | [];
}

interface RoleData {
  applications: string[];
  description?: string;
  name: string;
  access: RoleAccess[];
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

const AddRoleWizard: React.FunctionComponent<AddRoleWizardProps> = ({ pagination, filters, orderBy }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const navigate = useAppNavigate();
  const chrome = useChrome();
  const enableWorkspacesNameChange = useFlag('platform.rbac.groups-to-workspaces-rename');

  const [wizardContextValue, setWizardContextValue] = useState<{
    success: boolean;
    submitting: boolean;
    error: unknown | undefined;
    hideForm: boolean;
  }>({
    success: false,
    submitting: false,
    error: undefined,
    hideForm: false,
  });

  const [cancelWarningVisible, setCancelWarningVisible] = useState<boolean>(false);
  const container = useRef<HTMLDivElement>(document.createElement('div'));
  const [schema, setSchema] = useState<any>();

  useEffect(() => {
    setSchema(schemaBuilder(container.current, enableWorkspacesNameChange));
  }, [enableWorkspacesNameChange]);

  const onClose = () =>
    navigate({
      pathname: paths.roles.link,
      search: createQueryParams({ page: 1, per_page: pagination.limit, ...filters }),
    });

  const onCancel = () => {
    if (!wizardContextValue.success) {
      dispatch(
        addNotification({
          variant: 'warning',
          title: intl.formatMessage(messages.creatingRoleCanceled),
        }),
      );
    }

    setCancelWarningVisible(false);

    navigate({
      pathname: paths.roles.link,
      search: createQueryParams({ page: 1, per_page: pagination.limit, ...filters }),
    });
  };

  const setWizardError = (error: unknown) => setWizardContextValue((prev) => ({ ...prev, error }));
  const setWizardSuccess = (success: boolean) => setWizardContextValue((prev) => ({ ...prev, success }));
  const setHideForm = (hideForm: boolean) => setWizardContextValue((prev) => ({ ...prev, hideForm }));

  const handleFormCancel = (values: Record<string, any>) => {
    const showWarning = Boolean((values && values['role-name']) || values['role-description'] || values['copy-base-role']);
    if (showWarning) {
      container.current.hidden = true;
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

    const roleData: RoleData = {
      applications: [...new Set(permissions.map(({ uuid: permission }) => permission.split(':')[0]))],
      description: (type === 'create' ? description : copyDescription) || undefined,
      name: type === 'create' ? name || '' : copyName || '',
      access: permissions.reduce<RoleAccess[]>(
        (acc, { uuid: permission, requires = [] }) => [
          ...acc,
          ...[permission, ...requires.filter((require) => !selectedPermissionIds.includes(require))].map((permission): RoleAccess => {
            let attributeFilter: AttributeFilter | undefined;

            const costResource = costResources?.find((r) => r.permission === permission);
            if (permission.includes('cost-management') && costResource && costResource.resources.length > 0) {
              attributeFilter = {
                key: `cost-management.${permission.split(':')[1]}`,
                operation: 'in',
                value: costResource.resources,
              };
            } else if (permission.includes('inventory')) {
              attributeFilter = {
                key: 'group.id',
                operation: 'in',
                value: invResources?.find((g) => g.permission === permission)?.groups?.map((group) => group?.id),
              };
            }

            return {
              permission,
              resourceDefinitions: attributeFilter ? [{ attributeFilter }] : [],
            };
          }),
        ],
        [],
      ),
    };

    setWizardContextValue((prev) => ({ ...prev, submitting: true }));

    const createRoleResult = dispatch(createRole(roleData as RoleIn));
    return Promise.resolve(createRoleResult)
      .then((result: any) => {
        if (result.error) {
          throw result.error;
        }
        setWizardContextValue((prev) => ({ ...prev, submitting: false, success: true, hideForm: true }));
        dispatch(fetchRolesWithPolicies({ limit: pagination.limit, orderBy, usesMetaInURL: true, chrome }));
      })
      .catch(() => {
        setWizardContextValue((prev) => ({ ...prev, submitting: false, success: false, hideForm: true }));
        dispatch(fetchRolesWithPolicies({ limit: pagination.limit, orderBy, usesMetaInURL: true, chrome }));
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
          onClose={() => {
            container.current.hidden = false;
            setCancelWarningVisible(false);
          }}
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

export default AddRoleWizard;
