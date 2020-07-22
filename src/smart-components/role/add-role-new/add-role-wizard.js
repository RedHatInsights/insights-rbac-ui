import React from 'react';
import PropTypes from 'prop-types';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import FormRenderer from '@data-driven-forms/react-form-renderer/dist/cjs/form-renderer';
import Pf4FormTemplate from '@data-driven-forms/pf4-component-mapper/dist/cjs/form-template';
import componentMapper from '@data-driven-forms/pf4-component-mapper/dist/cjs/component-mapper';
import schema from './schema';

import BaseRoleTable from './base-role-table';
import AddPermissionsTable from './add-permissions';
import './add-role-wizard.scss';

const FormTemplate = (props) => <Pf4FormTemplate { ...props } showFormControls={ false } />;

export const mapperExtension = {
    'base-role-table': BaseRoleTable,
    'add-permissions-table': AddPermissionsTable
};

const AddRoleWizard = ({
    history: { push }
}) => {

    const dispatch = useDispatch();

    const onCancel = () => {
        dispatch(addNotification({
            variant: 'warning',
            title: 'Creating role was canceled by the user',
            dismissDelay: 8000,
            dismissable: false
        }));
        push('/roles');
    };

    return <FormRenderer
        schema={ schema }
        subscription={ { values: true } }
        FormTemplate={ FormTemplate }
        componentMapper={ { ...componentMapper, ...mapperExtension } }
        onSubmit={ console.log }
        onCancel={ onCancel }
    />;
};

AddRoleWizard.propTypes = {
    history: PropTypes.shape({
        push: PropTypes.func.isRequired
    }).isRequired
};

export default AddRoleWizard;
