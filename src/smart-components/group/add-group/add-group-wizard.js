import React, { useState } from 'react';
import { useHistory } from 'react-router-dom';
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
import SetUsers from './set-users';
import SetRoles from './set-roles';

const AddGroupWizard = ({
  addNotification,
  addGroup,
  postMethod,
  closeUrl
}) => {
  const [ selectedUsers, setSelectedUsers ] = useState([]);
  const [ selectedRoles, setSelectedRoles ] = useState([]);
  const [ formData, setValues ] = useState({});
  const [ isGroupInfoValid, setIsGroupInfoValid ] = useState(false);

  const history = useHistory();

  const handleChange = data => {
    setValues({ ...formData,  ...data });
  };

  const steps = [
    { name: 'General information',
      component: new GroupInformation(formData, handleChange, setIsGroupInfoValid),
      enableNext: isGroupInfoValid
    },
    { name: 'Add members',
      component: new SetUsers({ formData, selectedUsers, setSelectedUsers })
    },
    {
      name: 'Assign roles',
      component: new SetRoles({ formData, selectedRoles, setSelectedRoles })
    },
    { name: 'Review',
      component: new SummaryContent({ values: formData, selectedUsers, selectedRoles }),
      nextButtonText: 'Confirm',
      enableNext: isGroupInfoValid
    }
  ];

  const  onSubmit =  async() => {
    const user_data = {
      ...formData,
      user_list: selectedUsers ? selectedUsers.map(user => ({ username: user.label })) : undefined,
      roles_list: selectedRoles ? selectedRoles.map(role => role.uuid) : undefined
    };
    await addGroup(user_data);
    postMethod();
    history.push(closeUrl);
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: 'Adding group',
      dismissDelay: 8000,
      dismissable: false,
      description: 'Adding group was canceled by the user.'
    });
    history.push('/groups');
  };

  return (
    <Wizard
      isLarge
      isCompactNav
      title="Create and configure a group"
      description="To give users access permissions, create a group and assign roles to it."
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
  closeUrl: '/groups',
  postMethod: () => undefined
};

AddGroupWizard.propTypes = {
  addGroup: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  inputValue: PropTypes.string,
  selectedUsers: PropTypes.array,
  match: PropTypes.object,
  postMethod: PropTypes.func,
  closeUrl: PropTypes.string
};

const mapStateToProps = ({ roleReducer: { roles: { meta }, filterValue, isLoading }}) => {
  return {
    pagination: meta,
    isLoading,
    searchFilter: filterValue
  };
};

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  addGroup,
  fetchGroup,
  fetchRoles,
  fetchUsers
}, dispatch);

export default connect(mapStateToProps, mapDispatchToProps)(AddGroupWizard);
