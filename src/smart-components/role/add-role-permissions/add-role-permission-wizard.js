import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Wizard } from '@patternfly/react-core/deprecated';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { useFlag } from '@unleash/proxy-client-react';
import { updateRole } from '../../../redux/actions/role-actions.js';
import AddPermissionsTable from '../add-role/add-permissions';
import AddRolePermissionSummaryContent from './add-role-permissions-summary-content';
import AddRolePermissionSuccess from './add-role-permission-success';
import CostResources from '../add-role/cost-resources';
import InventoryGroupsRole from '../add-role/inventory-groups-role';
import { schemaBuilder } from './schema';
import useAppNavigate from '../../../hooks/useAppNavigate';
import messages from '../../../Messages';
import pathnames from '../../../utilities/pathnames';
import { AddRolePermissionWizardContext } from './add-role-permission-wizard-context';

const FormTemplate = (props) => <Pf4FormTemplate {...props} showFormControls={false} />;

export const mapperExtension = {
  'add-permissions-table': AddPermissionsTable,
  'inventory-groups-role': InventoryGroupsRole,
  'cost-resources': CostResources,
  review: AddRolePermissionSummaryContent,
};

const AddRolePermissionWizard = ({ role }) => {
  const intl = useIntl();
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const [currentRoleID, setCurrentRoleID] = useState('');
  const navigate = useAppNavigate();
  const dispatch = useDispatch();
  const enableWorkspacesNameChange = useFlag('platform.rbac.groups-to-workspaces-rename');
  const [wizardContextValue, setWizardContextValue] = useState({
    success: false,
    submitting: false,
    error: undefined,
    hideForm: false,
  });
  const container = useRef(document.createElement('div'));
  const setWizardError = (error) => setWizardContextValue((prev) => ({ ...prev, error }));
  const setWizardSuccess = (success) => setWizardContextValue((prev) => ({ ...prev, success }));
  const setHideForm = (hideForm) => setWizardContextValue((prev) => ({ ...prev, hideForm }));
  const schema = useMemo(() => schemaBuilder(container.current, enableWorkspacesNameChange), []);

  useEffect(() => {
    setCurrentRoleID(role.uuid);
  });

  useEffect(() => {
    container.current.hidden = cancelWarningVisible;
  }, [cancelWarningVisible]);

  const handleWizardCancel = () => {
    setCancelWarningVisible(true);
  };

  const handleConfirmCancel = () => {
    navigate(pathnames['role-detail'].link.replace(':roleId', role.uuid));
  };

  const onSubmit = async (formData) => {
    const {
      'add-permissions-table': selectedPermissions,
      'cost-resources': costResources = [],
      'inventory-groups-role': invResources = [],
    } = formData;

    const selectedPermissionIds = [...role.access.map((record) => record.permission), ...selectedPermissions.map((record) => record.uuid)];
    const roleData = {
      ...role,
      access: [
        ...selectedPermissions.reduce(
          (acc, { uuid: permission, requires }) => [
            ...acc,
            ...[permission, ...requires.filter((require) => !selectedPermissionIds.includes(require))].map((permission) => ({
              permission,
              resourceDefinitions: [...costResources, ...invResources]?.find((r) => r.permission === permission)
                ? permission.includes('inventory')
                  ? [
                      {
                        attributeFilter: {
                          key: 'group.id',
                          operation: 'in',
                          value: invResources?.find((g) => g.permission === permission)?.groups?.map((group) => group?.id),
                        },
                      },
                    ]
                  : permission.includes('cost-management')
                    ? [
                        {
                          attributeFilter: {
                            key: `cost-management.${permission.split(':')[1]}`,
                            operation: 'in',
                            value: costResources?.find((r) => r.permission === permission).resources,
                          },
                        },
                      ]
                    : []
                : [],
            })),
          ],
          role.access,
        ),
      ],
      accessCount: role.accessCount + selectedPermissions.length,
    };

    setWizardContextValue((prev) => ({ ...prev, submitting: true }));
    dispatch(updateRole(currentRoleID, roleData))
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
          container={container}
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
          onCancel={(values) => {
            if (values && values['add-permissions-table']?.length > 0) {
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

AddRolePermissionWizard.defaultProps = {
  role: {},
};

AddRolePermissionWizard.propTypes = {
  role: PropTypes.object,
};

export default AddRolePermissionWizard;
