import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Wizard } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { addGroup, fetchGroup } from '../../../redux/actions/group-actions';
import { fetchRoles } from '../../../redux/actions/role-actions';
import { fetchUsers } from '../../../redux/actions/user-actions';
import SummaryContent from './summary-content';
import GroupInformation from './group-information';
import PolicySetUsers from './policy-set-users';
import PolicySetRoles from './policy-set-roles';

const AddGroupWizard = ({
  history: { push },
  match: { params: { id }},
  addNotification,
  addGroup,
  postMethod,
  closeUrl
}) => {
  const [ selectedUsers, setSelectedUsers ] = useState([]);
  const [ roles, setRoles ] = useState([]);
  const [ users, setUsers ] = useState([]);
  const [ selectedRoles, setSelectedRoles ] = useState([]);
  const [ optionIdx, setOptionIdx ] = useState(0);
  const [ formData, setValues ] = useState({});
  const [ isGroupInfoValid, setIsGroupInfoValid ] = useState(false);

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

  const setGroupUsers = (groupData) => {
    if (groupData && groupData.principals) {
      setSelectedUsers(groupData.principals.map(user => (createOption(user.username))));
    }
  };

  const steps = [
    { name: 'General information',
      component: new GroupInformation(formData, handleChange, setIsGroupInfoValid),
      enableNext: isGroupInfoValid
    },
    { name: 'Add members',
      component: new PolicySetUsers({ formData, selectedUsers, setSelectedUsers, users })
    },
    {
      name: 'Assign roles',
      component: new PolicySetRoles({ formData, selectedRoles, setSelectedRoles, roles })
    },
    { name: 'Review',
      component: new SummaryContent({ values: formData, selectedUsers, selectedRoles }),
      nextButtonText: 'Confirm',
      enableNext: isGroupInfoValid
    }
  ];
  const fetchData = () => {
    fetchGroup(id).payload.then((data) => setGroupUsers(data)).catch(() => setGroupUsers(undefined));
    fetchRoles().payload.then((data) => setRoles(data));
    fetchUsers().payload.then((data) => setUsers(data));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const  onSubmit =  async() => {
    const user_data = { ...formData, user_list: selectedUsers ? selectedUsers.map(user => ({ username: user.label })) : undefined };
    const group = await addGroup(user_data);
    if (postMethod) {
      postMethod();
    }

    push(closeUrl);
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: 'Adding group',
      dismissable: true,
      description: 'Adding group was cancelled by the user.'
    });
    push('/groups');
  };

  return (
    <Wizard
      isLarge
      title={ 'Add group' }
      isOpen
      onClose={ onCancel }
      onSave={ onSubmit }
      steps={ steps }
    />);

};

AddGroupWizard.defaultProps = {
  users: [],
  inputValue: '',
  selectedUsers: [],
  selectedRoles: [],
  closeUrl: '/groups'
};

AddGroupWizard.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired
  }).isRequired,
  addGroup: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  inputValue: PropTypes.string,
  users: PropTypes.array,
  selectedUsers: PropTypes.array,
  match: PropTypes.object,
  postMethod: PropTypes.func,
  closeUrl: PropTypes.string
};

const mapStateToProps = ({ roleReducer: { roles, filterValue, isLoading }, userReducer: { users }}) => (
  {
    roles: roles.data,
    users: users.data,
    pagination: roles.meta,
    isLoading,
    searchFilter: filterValue
  });

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  addGroup,
  fetchGroup,
  fetchRoles,
  fetchUsers
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddGroupWizard));
