import React, { useState, useEffect, useRef, createContext } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import FormRenderer from '@data-driven-forms/react-form-renderer/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/component-mapper';
import { Wizard } from '@patternfly/react-core';
import { schemaBuilder } from './schema';
import { createRole, fetchRolesWithPolicies } from '../../../redux/actions/role-actions';
import { WarningModal } from '../../common/warningModal';
import AddRoleSuccess from './add-role-success';
import BaseRoleTable from './base-role-table';
import AddPermissionsTable from './add-permissions';
import ReviewStep from './review';
import InventoryGroupsRole from './inventory-groups-role';
import CostResources from './cost-resources';
import TypeSelector from './type-selector';
import { useHistory } from 'react-router-dom';
import { createQueryParams } from '../../../helpers/shared/helpers';
import paths from '../../../utilities/pathnames';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

import './add-role-wizard.scss';
import SilentErrorBoundary from '../../common/silent-error-boundary';

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
  'inventory-groups-role': InventoryGroupsRole,
  review: ReviewStep,
  description: Description,
  'type-selector': TypeSelector,
};

const AddRoleWizard = ({ pagination, filters, orderBy }) => {
  const intl = useIntl();
  const dispatch = useDispatch();
  const { push } = useHistory();
  const [wizardContextValue, setWizardContextValue] = useState({
    success: false,
    submitting: false,
    error: undefined,
    hideForm: false,
  });
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  const container = useRef(document.createElement('div'));
  const [schema, setSchema] = useState();

  useEffect(() => {
    setSchema(schemaBuilder(container.current));
  }, []);

  const onClose = () =>
    push({
      pathname: paths.roles.path,
      search: createQueryParams({ page: 1, per_page: pagination.limit }),
    });

  const onCancel = () => {
    if (!wizardContextValue.success) {
      dispatch(
        addNotification({
          variant: 'warning',
          title: intl.formatMessage(messages.creatingRoleCanceled),
          dismissDelay: 8000,
        })
      );
    }

    setCancelWarningVisible(false);
    /**
     * This timeout should force React to wait for the modal close and push to history afterwards.
     * That should fix the runtime error we are seeing in the production version of the code.
     */
    setTimeout(() => {
      push({
        pathname: paths.roles.path,
        search: createQueryParams({ page: 1, per_page: pagination.limit, ...filters }),
      });
    });
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
      'inventory-groups-role': invGroupsRole,
      'cost-resources': resourceDefinitions,
      'role-type': type,
    } = formData;
    const selectedPermissionIds = permissions.map((record) => record.uuid);

    const roleData = {
      applications: [...new Set(permissions.map(({ uuid: permission }) => permission.split(':')[0]))],
      description: (type === 'create' ? description : copyDescription) || null,
      name: type === 'create' ? name : copyName,
      access: permissions.reduce(
        (acc, { uuid: permission, requires = [] }) => [
          ...acc,
          ...[permission, ...requires.filter((require) => !selectedPermissionIds.includes(require))].map((permission) => {
            let attributeFilter = {};

            if (permission.includes('cost-management')) {
              attributeFilter = {
                key: `cost-management.${permission.split(':')[1]}`,
                operation: 'in',
                value: resourceDefinitions?.find((r) => r.permission === permission)?.resources,
              };
            } else if (permission.includes('inventory')) {
              attributeFilter = {
                key: 'groups.id',
                operation: 'in',
                value: invGroupsRole?.find((g) => g.permission === permission)?.groups?.map((group) => group?.id),
              };
            }

            return {
              permission,
              resourceDefinitions: attributeFilter ? [{ attributeFilter }] : [],
            };
          }),
        ],
        []
      ),
    };

    console.log('Role Data: ', roleData);

    return dispatch(createRole(roleData))
      .then(() => {
        setWizardContextValue((prev) => ({ ...prev, submitting: false, success: true, hideForm: true }));
        dispatch(fetchRolesWithPolicies({ limit: pagination.limit, orderBy, inModal: false }));
      })
      .catch(() => {
        setWizardContextValue((prev) => ({ ...prev, submitting: false, success: false, hideForm: true }));
        dispatch(fetchRolesWithPolicies({ limit: pagination.limit, orderBy, inModal: false }));
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
          type="role"
          isOpen={cancelWarningVisible}
          onModalCancel={() => {
            container.current.hidden = false;
            setCancelWarningVisible(false);
          }}
          onConfirmCancel={onCancel}
        />
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
                component: <AddRoleSuccess onClose={onClose} />,
                isFinishedStep: true,
              },
            ]}
          />
        ) : null
      ) : (
        <FormRenderer
          schema={schema}
          container={container}
          subscription={{ values: true }}
          FormTemplate={FormTemplate}
          initialValues={{
            'role-type': 'create',
          }}
          componentMapper={{ ...componentMapper, ...mapperExtension }}
          onSubmit={onSubmit}
          onCancel={(values) => {
            const showWarning = Boolean((values && values['role-name']) || values['role-description'] || values['copy-base-role']);
            if (showWarning) {
              container.current.hidden = true;
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
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
  }).isRequired,
  filters: PropTypes.shape({
    name: PropTypes.string,
  }).isRequired,
  orderBy: PropTypes.string,
};

export default AddRoleWizard;
