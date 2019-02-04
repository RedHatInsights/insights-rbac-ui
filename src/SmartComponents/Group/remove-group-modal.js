import React from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button, Title, Bullseye } from '@patternfly/react-core';
import { addNotification } from '@red-hat-insights/insights-frontend-components/components/Notifications';
import { fetchGroups, removeGroup } from '../../redux/Actions/GroupActions';
import { pipe } from 'rxjs';
import './group.scss';

const RemoveGroupModal = ({
  history: { goBack, push },
  removeGroup,
  addNotification,
  fetchGroups,
  groupId,
  groupName
}) => {
  const onSubmit = () => removeGroup(groupId)
  .then(() => pipe(fetchGroups(), push('/groups')));

  const onCancel = () => pipe(
    addNotification({
      variant: 'warning',
      title: 'Removing group',
      description: 'Removing group was cancelled by the user.'
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
            Removing Group:  { groupName }
          </Title>
        </div>
      </Bullseye>
    </Modal>
  );
};

RemoveGroupModal.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }).isRequired,
  removeGroup: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  groupId: PropTypes.string,
  groupName: PropTypes.string
};

const groupDetailsFromState = (state, id) =>
  state.groupReducer.groups.find(group => group.id  === id);

const mapStateToProps = (state, { match: { params: { id }}}) => {
  let group = groupDetailsFromState(state, id);
  return {
    groupId: group.id,
    groupName: group.name
  };
};

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  fetchGroups,
  removeGroup
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(RemoveGroupModal));
