import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Wizard } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { createRole, fetchRoles } from '../../../redux/actions/role-actions';
import SummaryContent from './summary-content';
import ResourceDefinitions from './resource-definitions';
import RoleInformation from './role-information';
import PermissionInformation from './permission-information';

const AddRoleWizard = ({
  addNotification,
  createRole,
  history: { push },
  pagination
}) => {
  const [ formData, setValues ] = useState({});
  const [ isRoleFormValid, setIsRoleFormValid ] = useState(false);
  const [ isPermissionFormValid, setIsPermissionFormValid ] = useState(false);
  const [ stepIdReached, setStepIdReached ] = useState(1);

  const handleChange = (data) => {
    setValues({ ...formData,  ...data });
  };

  const handleRoleChange = (data, isValid) => {
    handleChange(data);
    setIsRoleFormValid(isValid);
  };

  const handlePermissionChange = (data, isValid) => {
    handleChange(data);
    setIsPermissionFormValid(isValid);
  };

  const steps = [
    {
      id: 1,
      name: 'Name and Description',
      canJumpTo: stepIdReached >= 1,
      component: new RoleInformation(formData, handleRoleChange),
      enableNext: isRoleFormValid
    },
    {
      id: 2,
      name: 'Permission',
      canJumpTo: stepIdReached >= 2 && isRoleFormValid,
      component: new PermissionInformation(formData, handlePermissionChange),
      enableNext: isPermissionFormValid
    },
    {
      id: 3,
      name: 'Resource definitions',
      canJumpTo: stepIdReached >= 3 && isRoleFormValid && isPermissionFormValid,
      component: new ResourceDefinitions(formData, handleChange)
    },
    {
      id: 4,
      name: 'Review',
      canJumpTo: stepIdReached >= 4 && isRoleFormValid && isPermissionFormValid,
      component: new SummaryContent(formData),
      nextButtonText: 'Confirm'
    }
  ];

  const onNext = ({ id }) => {
    const step = stepIdReached < id ? id : stepIdReached;
    setStepIdReached(step);
  };

  const onSubmit = async() => {
    const roleData = {
      applications: [ formData.application ],
      description: formData.description,
      name: formData.name,
      access: [{
        // Permission must be in the format "application:resource_type:operation"
        permission: `${formData.application}:${formData.resourceType}:${formData.permission}`,
        resourceDefinitions: formData.resourceDefinitions.map(definition => {
          return {
            attributeFilter: {
              key: definition.key,
              operation: definition.operation,
              value: definition.value
            }
          };
        })
      }]
    };
    const role = await createRole(roleData);
    fetchRoles(pagination).then(push('/roles'));
    return role;
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: 'Adding role',
      description: 'Adding role was cancelled by the user.'
    });
    push('/roles');
  };

  return (
    <Wizard
      isLarge
      title="Add role"
      isOpen
      onClose={ onCancel }
      onNext={ onNext }
      onSave={ onSubmit }
      steps={ steps }
    />);
};

AddRoleWizard.defaultProps = {
  users: [],
  inputValue: '',
  selectedGroup: undefined,
  selectedUsers: [],
  selectedRoles: []
};

AddRoleWizard.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }).isRequired,
  addNotification: PropTypes.func.isRequired,
  createRole: PropTypes.func.isRequired,
  fetchRoles: PropTypes.func.isRequired,
  inputValue: PropTypes.string,
  pagination: PropTypes.shape({
    limit: PropTypes.number.isRequired,
    offset: PropTypes.number.isRequired,
    count: PropTypes.number.isRequired
  })
};

const mapStateToProps = ({ roleReducer: { roles, filterValue, isLoading }}) => ({
  roles: roles.data,
  pagination: roles.meta,
  isLoading,
  searchFilter: filterValue
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  createRole,
  fetchRoles
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddRoleWizard));
