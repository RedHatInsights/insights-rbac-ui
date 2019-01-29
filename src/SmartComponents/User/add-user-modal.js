import React from 'react';
import PropTypes from 'prop-types';
import FormRenderer from '../Common/FormRenderer';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal } from '@patternfly/react-core';
import { addNotification } from '@red-hat-insights/insights-frontend-components/components/Notifications';
import { addUser, fetchUsers, updateUser } from '../../redux/Actions/UserActions';
import { pipe } from 'rxjs';

const AddUserModal = ({
  history: { goBack },
  addUser,
  addNotification,
  fetchUsers,
  initialValues,
  updateUser
}) => {
  const onSubmit = data => initialValues
    ? updateUser(data).then(() => fetchUsers()).then(goBack)
    : addUser(data).then(() => fetchUsers()).then(goBack);

  const onCancel = () => pipe(
    addNotification({
      variant: 'warning',
      title: initialValues ? 'Editing user' : 'Adding user',
      description: initialValues ? 'Edit user was cancelled by the user.' : 'Adding user was cancelled by the user.'
    }),
    goBack()
  );

  const schema = {
    type: 'object',
    properties: {
      name: { title: initialValues ? 'User Name' : 'New User Name', type: 'string' },
      description: { title: 'Description', type: 'string' }
    },
    required: [ 'name', 'description' ]
  };

  return (
    <Modal
      title={ initialValues ? 'Edit user' : 'Add user' }
      isOpen
      onClose={ onCancel }
    >
      <FormRenderer
        schema={ schema }
        schemaType="mozilla"
        onSubmit={ onSubmit }
        onCancel={ onCancel }
        initialValues={ { ...initialValues } }
      />
    </Modal>
  );
};

AddUserModal.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired
  }).isRequired,
  addUser: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchUsers: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
  updateUser: PropTypes.func.isRequired
};

const mapStateToProps = ({ userReducer: { users }}, { match: { params: { id }}}) => ({
  initialValues: id && users.find(item => item.id === id),
  userId: id
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  addUser,
  updateUser,
  fetchUsers
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddUserModal));
