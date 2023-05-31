import React, { useState, useEffect, useRef, createContext, useMemo } from 'react';
import { useDispatch } from 'react-redux';
import AddRolePermissionSummaryContent from './add-role-permissions-summary-content';
import AddRolePermissionSuccess from './add-role-permission-success';
import PropTypes from 'prop-types';
import { WarningModal } from '../../common/warningModal';
import { useHistory } from 'react-router-dom';
import { Wizard } from '@patternfly/react-core';
import { updateRole } from '../../../redux/actions/role-actions.js';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import AddPermissionsTable from '../add-role/add-permissions';
import CostResources from '../add-role/cost-resources';
import InventoryGroupsRole from '../add-role//inventory-groups-role';
import { schemaBuilder } from './schema';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const FormTemplate = (props) => <Pf4FormTemplate {...props} showFormControls={false} />;

export const mapperExtension = {
  'add-permissions-table': AddPermissionsTable,
  'inventory-groups-role': InventoryGroupsRole,
  'cost-resources': CostResources,
  review: AddRolePermissionSummaryContent,
};

export const AddRolePermissionWizardContext = createContext({
  success: false,
  submitting: false,
  error: undefined,
});

const AddRolePermissionWizard = ({ role }) => {
  const intl = useIntl();
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const [currentRoleID, setCurrentRoleID] = useState('');
  const history = useHistory();
  const dispatch = useDispatch();
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
  const schema = useMemo(() => schemaBuilder(container.current), []);

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
    history.push(`/roles/detail/${role.uuid}`);
  };

  const onSubmit = async (formData) => {
    const { 'add-permissions-table': selectedPermissions, 'cost-resources': resourceDefinitions } = formData;

    const selectedPermissionIds = [...role.access.map((record) => record.permission), ...selectedPermissions.map((record) => record.uuid)];
    const roleData = {
      ...role,
      access: [
        ...selectedPermissions.reduce(
          (acc, { uuid: permission, requires }) => [
            ...acc,
            ...[permission, ...requires.filter((require) => !selectedPermissionIds.includes(require))].map((permission) => ({
              permission,
              resourceDefinitions: resourceDefinitions?.find((r) => r.permission === permission)
                ? [
                    {
                      attributeFilter: {
                        key: `cost-management.${permission.split(':')[1]}`,
                        operation: 'in',
                        value: resourceDefinitions?.find((r) => r.permission === permission).resources,
                      },
                    },
                  ]
                : [],
            })),
          ],
          role.access
        ),
      ],
      accessCount: role.accessCount + selectedPermissions.length,
    };

    setWizardContextValue((prev) => ({ ...prev, submitting: true }));
    dispatch(updateRole(currentRoleID, roleData))
      .then(() => setWizardContextValue((prev) => ({ ...prev, submitting: false, success: true, hideForm: true })))
      .catch(() => {
        setWizardContextValue((prev) => ({ ...prev, submitting: false, success: false, hideForm: true }));
        history.push(`/roles/detail/${role.uuid}`);
      });
  };

  return (
    <AddRolePermissionWizardContext.Provider
      value={{ ...wizardContextValue, setWizardError, setWizardSuccess, setHideForm, rolePermissions: role.access }}
    >
      <WarningModal
        type={intl.formatMessage(messages.permission)}
        isOpen={cancelWarningVisible}
        onModalCancel={() => setCancelWarningVisible(false)}
        onConfirmCancel={handleConfirmCancel}
      />
      {wizardContextValue.hideForm ? (
        wizardContextValue.success ? (
          <Wizard
            title={intl.formatMessage(messages.addPermissions)}
            isOpen
            steps={[
              {
                name: 'success',
                component: new AddRolePermissionSuccess({ currentRoleID }),
                isFinishedStep: true,
              },
            ]}
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
