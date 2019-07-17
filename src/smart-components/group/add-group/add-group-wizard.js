import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Wizard } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { addGroup, fetchGroups, fetchGroup, updateGroup } from '../../../redux/actions/group-actions';
import { fetchRoles } from '../../../redux/actions/role-actions';
import SummaryContent from './summary-content';
import GroupInformation from './group-information';
import SetUsers from './set-users';
import PolicyStep from './policy-step';

const AddGroupModal = ({
  history: { push },
  match: { params: { id }},
  addNotification,
  addGroup,
  updateGroup
}) => {
  const [ selectedGroup, setSelectedGroup ] = useState({});
  const [ selectedUsers, setSelectedUsers ] = useState([]);
  const [ selectedPolicies, setSelectedPolicies ] = useState([]);
  const [ roles, setRoles ] = useState([]);
  const [ selectedRoles, setSelectedRoles ] = useState({});
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

    if (groupData && groupData.policies) {
      setSelectedPolicies(groupData.policies.map(policy => (createOption(policy.name))));
    }
  };

  const steps = [
    { name: 'General Information', component: new GroupInformation(formData, handleChange) },
    { name: 'Set Users', component: new SetUsers(setGroupData, selectedUsers, setSelectedUsers,
      optionIdx, setOptionIdx, createOption, handleChange) },
    { name: 'Policy Step', component: new PolicyStep(formData, handleChange, setGroupData,
      selectedPolicies, setSelectedPolicies, selectedRoles, setSelectedRoles, roles) },
    { name: 'Review', component: new SummaryContent({ values: formData, selectedUsers }),
      nextButtonText: 'Confirm' }
  ];

  const fetchData = () => {
    fetchGroup(id).payload.then((data) => setGroupData(data)).catch(() => setGroupData(undefined));
    fetchRoles().payload.then((data) => setRoles(data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = () => {
    const user_data = { ...formData, user_list: selectedUsers.map(user => ({ username: user.label })) };
    id ? updateGroup(user_data).then(() => fetchGroups()).then(push('/groups'))
      : addGroup(user_data).then(() => fetchGroups()).then(push('/groups'));
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
    />
  );
};

AddGroupModal.defaultProps = {
  users: [],
  inputValue: '',
  selectedGroup: undefined,
  selectedUsers: []
};

AddGroupModal.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired
  }).isRequired,
  addGroup: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  selectedGroup: PropTypes.object,
  inputValue: PropTypes.string,
  users: PropTypes.array,
  selectedUsers: PropTypes.array,
  match: PropTypes.object,
  updateGroup: PropTypes.func.isRequired
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
  updateGroup,
  fetchGroup,
  fetchGroups,
  fetchRoles
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddGroupModal));
