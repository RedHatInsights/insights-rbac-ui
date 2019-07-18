import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Wizard } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { addGroup, fetchGroups, fetchGroup } from '../../../redux/actions/group-actions';
import { createPolicy } from '../../../redux/actions/policy-actions';
import { fetchRoles } from '../../../redux/actions/role-actions';
import SummaryContent from './summary-content';
import GroupInformation from './group-information';
import SetUsers from './set-users';
import PolicyStep from './policy-step';

const AddGroupModal = ({
  history: { push },
  match: { params: { id }},
  addNotification,
  addGroup
}) => {
  const [ selectedGroup, setSelectedGroup ] = useState({});
  const [ selectedUsers, setSelectedUsers ] = useState([]);
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

  const setGroupData = (groupData) => {
    setSelectedGroup(groupData);
    if (groupData && groupData.principals) {
      setSelectedUsers(groupData.principals.map(user => (createOption(user.username))));
    }
  };

  const steps = [
    { name: 'General Information', component: new GroupInformation(formData, handleChange) },
    { name: 'Set Users', component: new SetUsers(setGroupData, selectedUsers, setSelectedUsers,
      optionIdx, setOptionIdx, createOption, handleChange) },
    { name: 'Policy Step', component: new PolicyStep(formData, handleChange, selectedRoles, setSelectedRoles, roles) },
    { name: 'Review', component: new SummaryContent({ values: formData, selectedUsers, selectedRoles }),
      nextButtonText: 'Confirm' }
  ];
  const fetchData = () => {
    fetchGroup(id).payload.then((data) => setGroupData(data)).catch(() => setGroupData(undefined));
    fetchRoles().payload.then((data) => setRoles(data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const  onSubmit =  async() => {
    const user_data = { ...formData, user_list: selectedUsers.map(user => ({ username: user.label })) };
    const group = await addGroup(user_data);
    const policy_data = { name: formData.policyName,
      description: formData.policyDescription,
      group: group.value.uuid,
      roles: selectedRoles.map(role => role.value) };
    // TODO - only create the policy if the user selected a policy name and at least a role
    createPolicy(policy_data).payload.then(() => fetchGroups()).then(push('/groups'));
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: selectedGroup ? 'Editing group' : 'Adding group',
      description: selectedGroup ? 'Edit group was cancelled by the user.' : 'Adding group was cancelled by the user.'
    });
    push('/groups');
  };

  return (
    <Wizard
      isLarge
      title={ selectedGroup ? 'Edit group' : 'Add group' }
      isOpen
      onClose={ onCancel }
      onSave={ onSubmit }
      steps={ steps }
    />);

};

AddGroupModal.defaultProps = {
  users: [],
  inputValue: '',
  selectedGroup: undefined,
  selectedUsers: [],
  selectedRoles: []
};

AddGroupModal.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired
  }).isRequired,
  addGroup: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  createPolicies: PropTypes.func.isRequired,

  selectedGroup: PropTypes.object,
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
  addGroup,
  fetchGroup,
  fetchGroups,
  fetchRoles
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddGroupModal));
