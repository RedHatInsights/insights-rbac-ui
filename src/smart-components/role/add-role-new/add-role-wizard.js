import React, { useState, useEffect, useRef, createContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import FormRenderer from '@data-driven-forms/react-form-renderer/dist/esm/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/dist/esm/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/dist/esm/component-mapper';
import { Wizard } from '@patternfly/react-core';
import schemaBuilder from './schema';
import { createRole, fetchRolesWithPolicies } from '../../../redux/actions/role-actions';
import { WarningModal } from '../../../smart-components/common/warningModal';
import AddRoleSuccess from './add-role-success';
import BaseRoleTable from './base-role-table';
import AddPermissionsTable from './add-permissions';
import ReviewStep from './review';
import CostResources from './cost-resources';
import TypeSelector from './type-selector';
import './add-role-wizard.scss';

export const AddRoleWizardContext = createContext({
  success: false,
  submitting: false,
  error: undefined,
});

const FormTemplate = (props) => <Pf4FormTemplate {...props} showFormControls={false} />;

const Description = ({ Content, ...rest }) => <Content {...rest} />;
Description.propTypes = {
  Content: PropTypes.elementType.isRequired,
};

export const mapperExtension = {
  'base-role-table': BaseRoleTable,
  'add-permissions-table': AddPermissionsTable,
  'cost-resources': CostResources,
  review: ReviewStep,
  description: Description,
  'type-selector': TypeSelector,
};

const AddRoleWizard = ({ history: { push } }) => {
  const dispatch = useDispatch();
  const [wizardContextValue, setWizardContextValue] = useState({
    success: false,
    submitting: false,
    error: undefined,
    hideForm: false,
  });
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const container = useRef(document.createElement('div'));
  const [schema, setSchema] = useState({});

  useEffect(() => {
    setSchema(schemaBuilder(container.current));
  }, []);

  useEffect(() => {
    container.current.hidden = cancelWarningVisible;
  }, [cancelWarningVisible]);

  const onCancel = () => {
    if (!wizardContextValue.success) {
      dispatch(
        addNotification({
          variant: 'warning',
          title: 'Creating role was canceled by the user',
          dismissDelay: 8000,
          dismissable: false,
        })
      );
    }

    push('/roles');
  };

  const setWizardError = (error) => setWizardContextValue((prev) => ({ ...prev, error }));
  const setWizardSuccess = (success) => setWizardContextValue((prev) => ({ ...prev, success }));
  const setHideForm = (hideForm) => setWizardContextValue((prev) => ({ ...prev, hideForm }));

  const onSubmit = (formData) => {
    const {
      'role-name': name,
      'role-description': description,
      'role-copy-name': copyName,
      'role-copy-description': copyDescription,
      'add-permissions-table': permissions,
      'cost-resources': resourceDefinitions,
      'role-type': type,
    } = formData;
    setWizardContextValue((prev) => ({ ...prev, submitting: true }));
    const roleData = {
      applications: [...new Set(permissions.map(({ uuid: permission }) => permission.split(':')[0]))],
      description: (type === 'create' ? description : copyDescription) || null,
      name: type === 'create' ? name : copyName,
      access: permissions.map(({ uuid: permission }) => ({
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
    };
    return dispatch(createRole(roleData)).then(() => {
      setWizardContextValue((prev) => ({ ...prev, submitting: false, success: true, hideForm: true }));
      dispatch(fetchRolesWithPolicies());
    });
  };

  return (
    <AddRoleWizardContext.Provider value={{ ...wizardContextValue, setWizardError, setWizardSuccess, setHideForm }}>
      <WarningModal type="role" isOpen={cancelWarningVisible} onModalCancel={() => setCancelWarningVisible(false)} onConfirmCancel={onCancel} />
      {wizardContextValue.hideForm ? (
        <Wizard
          title="Create role"
          isOpen
          onClose={() => push('/roles')}
          steps={[
            {
              name: 'success',
              component: <AddRoleSuccess />,
              isFinishedStep: true,
            },
          ]}
        />
      ) : (
        <FormRenderer
          schema={schema}
          container={container}
          subscription={{ values: true }}
          FormTemplate={FormTemplate}
          componentMapper={{ ...componentMapper, ...mapperExtension }}
          onSubmit={onSubmit}
          onCancel={(values) => {
            const showWarning = Boolean((values && values['role-name']) || values['role-description'] || values['copy-base-role']);
            if (showWarning) {
              setCancelWarningVisible(true);
            } else {
              onCancel();
            }
          }}
        />
      )}
    </AddRoleWizardContext.Provider>
  );
};

AddRoleWizard.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

export default AddRoleWizard;
