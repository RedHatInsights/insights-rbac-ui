import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Wizard } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { createPolicy } from '../../../../redux/actions/policy-actions';
import { fetchRoles } from '../../../../redux/actions/role-actions';
import SummaryContent from './summary-content';
import PolicyInformation from '../../add-group/policy-information';
import PolicySetRoles from '../../add-group/policy-set-roles';

const AddGroupPolicyWizard = ({
  history: { push },
  match: { params: { uuid }},
  addNotification,
  createPolicy,
  postMethod,
  closeUrl
}) => {
  const [ roles, setRoles ] = useState([]);
  const [ selectedRoles, setSelectedRoles ] = useState([]);
  const [ formData, setValues ] = useState({});
  const [ isPolicyInfoValid, setIsPolicyInfoValid ] = useState(true);

  const handleChange = data => {
    setValues({ ...formData,  ...data });
  };

  const steps = [
    { name: 'Name and description',
      component: new PolicyInformation(
        { title: 'Create policy', formData, onHandleChange: handleChange, setIsPolicyInfoValid }),
      enableNext: isPolicyInfoValid },
    { name: 'Add roles',
      component: new PolicySetRoles({ formValue: formData,
        selectedRoles, setSelectedRoles, roles, title: 'Add roles to policy' }) },
    { name: 'Review', component: new SummaryContent({ values: formData, selectedRoles }),
      enableNext: isPolicyInfoValid,
      nextButtonText: 'Confirm' }
  ];

  const fetchData = () => {
    fetchRoles().payload.then((data) => setRoles(data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const  onSubmit =  async() => {
    if (formData.policy && selectedRoles && selectedRoles.length > 0) {
      const policy_data = {
        name: formData.policy.name,
        description: formData.policy.description,
        group: uuid,
        roles: selectedRoles.map(role => role.value)
      };
      return createPolicy(policy_data).then(() => postMethod()).then(push(closeUrl));
    }
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: 'Add policy',
      dismissable: true,
      description: 'Adding policy was cancelled by the user.'
    });
    push(closeUrl);
  };

  return (
    <Wizard
      title={ 'Add policy' }
      isOpen
      onClose={ onCancel }
      onSave={ onSubmit }
      steps={ steps }
    />);

};

AddGroupPolicyWizard.defaultProps = {
  roles: [],
  selectedRoles: []
};

AddGroupPolicyWizard.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired
  }).isRequired,
  addNotification: PropTypes.func.isRequired,
  createPolicy: PropTypes.func.isRequired,
  postMethod: PropTypes.func,
  match: PropTypes.object,
  closeUrl: PropTypes.string
};

const mapStateToProps = ({ roleReducer: { roles, isLoading }}) => ({
  roles: roles.data,
  pagination: roles.meta,
  isLoading
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  createPolicy,
  fetchRoles
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddGroupPolicyWizard));
