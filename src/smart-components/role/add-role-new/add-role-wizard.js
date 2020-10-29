import React, { useState, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import FormRenderer from '@data-driven-forms/react-form-renderer/dist/cjs/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/dist/cjs/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/dist/cjs/component-mapper';
import schemaBuilder from './schema';
import { createRole, fetchRolesWithPolicies } from '../../../redux/actions/role-actions';
import { WarningModal } from '../../../smart-components/common/warningModal';
import BaseRoleTable from './base-role-table';
import AddPermissionsTable from './add-permissions';
import ReviewStep from './review';
import CostResources from './cost-resources';
import TypeSelector from './type-selector';
import './add-role-wizard.scss';

const FormTemplate = (props) => <Pf4FormTemplate {...props} showFormControls={false} />;

// eslint-disable-next-line
const Description = ({ Content, ...rest }) => <Content {...rest} />;

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
  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);
  // const isMounted = useRef(false);
  const container = useRef(document.createElement('div'));
  const [schema, setSchema] = useState({});

  useEffect(() => {
    setSchema(schemaBuilder(container.current));
  }, []);

  useEffect(() => {
    console.log('cancelWarningVisible CHANGED', cancelWarningVisible);
    container.current.hidden = cancelWarningVisible;
  }, [cancelWarningVisible]);

  const onCancel = () => {
    dispatch(
      addNotification({
        variant: 'warning',
        title: 'Creating role was canceled by the user',
        dismissDelay: 8000,
        dismissable: false,
      })
    );
    push('/roles');
  };

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
    dispatch(createRole(roleData)).then(() => {
      dispatch(fetchRolesWithPolicies());
      push('/roles');
    });
  };

  return (
    <React.Fragment>
      <WarningModal type="role" isOpen={cancelWarningVisible} onModalCancel={() => setCancelWarningVisible(false)} onConfirmCancel={onCancel} />
      <FormRenderer
        schema={schema}
        container={container}
        subscription={{ values: true }}
        FormTemplate={FormTemplate}
        componentMapper={{ ...componentMapper, ...mapperExtension }}
        onSubmit={onSubmit}
        onCancel={(values) => {
          console.log(values);
          const showWarning = Boolean((values && values['role-name']) || values['role-description'] || values['copy-base-role']);
          if (showWarning) {
            setCancelWarningVisible(true);
          } else {
            onCancel();
          }
        }}
      />
    </React.Fragment>
  );
};

AddRoleWizard.propTypes = {
  history: PropTypes.shape({
    push: PropTypes.func.isRequired,
  }).isRequired,
};

export default AddRoleWizard;
