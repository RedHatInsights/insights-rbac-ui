import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button, Title, Bullseye } from '@patternfly/react-core';
import { addNotification } from '@red-hat-insights/insights-frontend-components/components/Notifications';
import { fetchUsers, removeUser } from '../../redux/Actions/UserActions';
import { hideModal } from '../../redux/Actions/MainModalActions';
import { pipe } from 'rxjs';
import './user.scss';

const RemoveUserModal = ({
  history: { goBack, push },
  removeUser,
  addNotification,
  fetchUsers,
  userId,
  userName
}) => {
  const onSubmit = () => removeUser(userId)
  .then(() => pipe(fetchUsers(), push('/users')));

  const onCancel = () => pipe(
    addNotification({
      variant: 'warning',
      title: 'Removing user',
      description: 'Removing user was cancelled by the user.'
    }),
    goBack()
  );

  return (
    <Modal
      isOpen
      title = { '' }
      onClose={ onCancel }
      actions={ [
        <Button key="cancel" variant="secondary" type="button" onClick={ onCancel }>
          Cancel
        </Button>,
        <Button key="submit" variant="primary" type="button" onClick={ onSubmit }>
          Confirm
        </Button>
      ] }
    >
      <Bullseye>
        <div className="center_message">
          <Title size={ 'xl' }>
            Removing User:  { userName }
          </Title>
        </div>
      </Bullseye>
    </Modal>
  );
};

RemoveUserModal.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }).isRequired,
  removeUser: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchUsers: PropTypes.func.isRequired,
  userId: PropTypes.string,
  userName: PropTypes.string
};

const userDetailsFromState = (state, id) =>
  state.userReducer.users.find(user => user.id  === id);

const mapStateToProps = (state, { match: { params: { id }}}) => {
  let user = userDetailsFromState(state, id);
  return {
    userId: user.id,
    userName: user.name
  };
};

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  fetchUsers,
  removeUser,
  hideModal
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(RemoveUserModal));
