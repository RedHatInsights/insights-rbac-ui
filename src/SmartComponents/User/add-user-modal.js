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
      title: initialValues ? 'Editing approver' : 'Adding approver',
      description: initialValues ? 'Edit approver was cancelled by the user.' : 'Adding approver was cancelled by the user.'
    }),
    goBack()
  );

  const schema = {
    type: 'object',
    properties: {
      email: { title: initialValues ? 'Email' : 'New Email', type: 'string' },
      first_name: { title: 'First Name', type: 'string' },
      last_name: { title: 'Last Name', type: 'string' }
    },
    required: [ 'email' ]
  };

  return (
    <Modal
      title={ initialValues ? 'Edit approver' : 'Add approver' }
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
