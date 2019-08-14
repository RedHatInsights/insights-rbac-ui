import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Wizard } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { fetchGroupPolicies, fetchPolicy, createPolicy } from '../../../../redux/actions/policy-actions';
import { fetchRoles } from '../../../../redux/actions/role-actions';
import SummaryContent from './summary-content';
import PolicyInformation from './policy-information';
import PolicyContent from './policy-content';

const AddPolicyWizard = ({
  history: { push },
  match: { params: { id }},
  addNotification,
  createPolicy
}) => {
  const [ selectedPolicy, setSelectedPolicy ] = useState({});
  const [ roles, setRoles ] = useState([]);
  const [ selectedRoles, setSelectedRoles ] = useState([]);
  const [ optionIdx, setOptionIdx ] = useState(0);
  const [ formData, setValues ] = useState({});

  const handleChange = data => {
    setValues({ ...formData,  ...data });
  };

  const createOption = (label) => {
    let idx = optionIdx;
    setOptionIdx(optionIdx + 1);
    return {
      label,
      value: `${label}_${idx}`
    };
  };

  const setPolicyData = (policyData) => {
    setSelectedPolicy(policyData);
    if (policyData && policyData.roles) {
      setSelectedRoles(policyData.roles.map(role => (createOption(role.name))));
    }
  };

  const steps = [
    { name: 'General Information', component: new PolicyInformation(formData, handleChange) },
    { name: 'Set Roles', component: new PolicyContent(formData, handleChange, selectedRoles, setSelectedRoles, roles) },
    { name: 'Review', component: new SummaryContent({ values: formData, selectedRoles }),
      nextButtonText: 'Confirm' }
  ];
  const fetchData = () => {
    fetchPolicy(id).payload.then((data) => setPolicyData(data)).catch(() => setPolicyData(undefined));
    fetchRoles().payload.then((data) => setRoles(data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const  onSubmit =  async() => {
    const role_data = { ...formData, role_list: selectedRoles.map(role => ({ name: role.label })) };
    const policy = await createPolicy(role_data);
    const policy_data = { name: formData.policyName,
      description: formData.policyDescription,
      policy: policy.value.uuid,
      roles: selectedRoles.map(role => role.value) };
    // TODO - only create the policy if the user selected a policy name and at least a role
    createPolicy(policy_data).payload.then(() => fetchGroupPolicies()).then(push('/policies'));
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: selectedPolicy ? 'Editing policy' : 'Adding policy',
      description: selectedPolicy ? 'Edit policy was cancelled by the user.' : 'Adding policy was cancelled by the user.'
    });
    push('/policies');
  };

  return (
    <Wizard
      isLarge
      title={ selectedPolicy ? 'Edit policy' : 'Add policy' }
      isOpen
      onClose={ onCancel }
      onSave={ onSubmit }
      steps={ steps }
    />);

};

AddPolicyWizard.defaultProps = {
  users: [],
  inputValue: '',
  selectedPolicy: undefined,
  selectedUsers: [],
  selectedRoles: []
};

AddPolicyWizard.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired
  }).isRequired,
  createPolicy: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchGroupPolicies: PropTypes.func.isRequired,
  fetchPolicy: PropTypes.func.isRequired,
  createPolicies: PropTypes.func.isRequired,

  selectedPolicy: PropTypes.object,
  inputValue: PropTypes.string,
  users: PropTypes.array,
  selectedUsers: PropTypes.array,
  match: PropTypes.object
};

const mapStateToProps = ({ roleReducer: { roles, filterValue, isLoading }}) => ({
  roles: roles.data,
  pagination: roles.meta,
  isLoading,
  searchFilter: filterValue
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  createPolicy,
  fetchPolicy,
  fetchGroupPolicies,
  fetchRoles
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddPolicyWizard));
