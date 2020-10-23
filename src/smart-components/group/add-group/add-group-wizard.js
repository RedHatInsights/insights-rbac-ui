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
import { WarningModal } from '../../common/warningModal';
import GroupNameErrorState from './group-name-error-state';
import '../../common/hideWizard.scss';

const AddGroupWizard = ({ addNotification, addGroup, postMethod, closeUrl }) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedRoles, setSelectedRoles] = useState([]);
  const [formData, setValues] = useState({});
  const [isGroupInfoValid, setIsGroupInfoValid] = useState(false);
  const [hideFooter, setHideFooter] = useState(false);
  const [isValidating, setIsValidating] = useState(false);

  const history = useHistory();

  const handleChange = (data) => {
    setValues({ ...formData, ...data });
  };

  const steps = [
    {
      name: 'Name and description',
      component: new GroupInformation(formData, handleChange, setIsGroupInfoValid, isGroupInfoValid, isValidating, setIsValidating),
      enableNext: isGroupInfoValid && !isValidating,
    },
    {
      name: 'Add roles',
      component: new SetRoles({ formData, selectedRoles, setSelectedRoles }),
      canJumpTo: isGroupInfoValid && !isValidating,
    },
    { name: 'Add members', component: new SetUsers({ formData, selectedUsers, setSelectedUsers }), canJumpTo: isGroupInfoValid && !isValidating },
    {
      name: 'Review details',
      component: isGroupInfoValid ? (
        new SummaryContent({ values: formData, selectedUsers, selectedRoles, setHideFooter })
      ) : (
        <GroupNameErrorState setHideFooter={setHideFooter} />
      ),
      nextButtonText: 'Confirm',
      enableNext: isGroupInfoValid && !isValidating,
      canJumpTo: isGroupInfoValid && !isValidating,
    },
  ];

  const onSubmit = async () => {
    const user_data = {
      ...formData,
      user_list: selectedUsers ? selectedUsers.map((user) => ({ username: user.label })) : undefined,
      roles_list: selectedRoles ? selectedRoles.map((role) => role.uuid) : undefined,
    };
    const response = await addGroup(user_data);
    if (response?.value?.error === true) {
      setIsGroupInfoValid(false);
    } else {
      postMethod();
      addNotification({
        variant: 'success',
        title: 'Success adding group',
        dismissDelay: 8000,
        dismissable: false,
        description: 'The group was added successfully.',
      });
      history.push(closeUrl);
    }
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: 'Adding group',
      dismissDelay: 8000,
      dismissable: false,
      description: 'Adding group was canceled by the user.',
    });
    history.push('/groups');
  };

  const [cancelWarningVisible, setCancelWarningVisible] = useState(false);

  return (
    <React.Fragment>
      <Wizard
        className={cancelWarningVisible && 'ins-m-wizard__hidden'}
        title="Create group"
        description="To give users access permissions, create a group and add roles and members to it."
        isOpen
        onClose={() => {
          if (Object.values(formData).filter(Boolean).length > 0 || selectedRoles.length > 0 || selectedUsers.length > 0) {
            setCancelWarningVisible(true);
          } else {
            onCancel();
          }
        }}
        onSave={onSubmit}
        steps={steps}
        footer={hideFooter ? <div /> : undefined}
      />
      <WarningModal type="group" isOpen={cancelWarningVisible} onModalCancel={() => setCancelWarningVisible(false)} onConfirmCancel={onCancel} />
    </React.Fragment>
  );
};

AddGroupWizard.defaultProps = {
  users: [],
  inputValue: '',
  selectedUsers: [],
  selectedRoles: [],
  closeUrl: '/groups',
  postMethod: () => undefined,
};

AddGroupWizard.propTypes = {
  addGroup: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  inputValue: PropTypes.string,
  selectedUsers: PropTypes.array,
  match: PropTypes.object,
  postMethod: PropTypes.func,
  closeUrl: PropTypes.string,
};

const mapStateToProps = ({
  roleReducer: {
    roles: { meta },
    filterValue,
    isLoading,
  },
}) => {
  return {
    pagination: meta,
    isLoading,
    searchFilter: filterValue,
  };
};

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      addNotification,
      addGroup,
      fetchGroup,
      fetchRoles,
      fetchUsers,
    },
    dispatch
  );

export default connect(mapStateToProps, mapDispatchToProps)(AddGroupWizard);
