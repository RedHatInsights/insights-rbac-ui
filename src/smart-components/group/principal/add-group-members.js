import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Button, Modal, StackItem, Stack } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { addGroup, addMembersToGroup, fetchMembersForGroup } from '../../../redux/actions/group-actions';
import { CompactUsersList } from '../add-group/users-list';
import ActiveUser from '../../../presentational-components/shared/ActiveUsers';

const AddGroupMembers = ({
  history: { push },
  match: { params: { uuid }},
  addNotification,
  closeUrl,
  addMembersToGroup,
  fetchMembersForGroup
}) => {
  const [ selectedUsers, setSelectedUsers ] = useState([]);

  const onSubmit = () => {
    const userList = selectedUsers.map(user => ({ username: user.label }));
    if (userList.length > 0) {
      addNotification({
        variant: 'info',
        title: `Adding member${userList.length > 1 ? 's' : ''} to group`,
        dismissDelay: 8000,
        dismissable: false,
        description: `Adding member${userList.length > 1 ? 's' : ''} to group initiated.`
      });
      addMembersToGroup(uuid, userList).then(() => fetchMembersForGroup(uuid));
    }

    push(closeUrl);
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: `Adding member${selectedUsers.length > 1 ? 's' : ''} to group`,
      dismissDelay: 8000,
      dismissable: false,
      description: `Adding member${selectedUsers.length > 1 ? 's' : ''} to group was canceled by the user.`
    });
    push(closeUrl);
  };

  return (
    <Modal
      title="Add members to the group"
      width={ '75%' }
      isOpen
      isFooterLeftAligned
      actions={ [
        <Button key="confirm" isDisabled={ selectedUsers.length === 0 } variant="primary" onClick={ onSubmit }>
          Add to group
        </Button>,
        <Button key="cancel" variant="link" onClick={ onCancel }>
          Cancel
        </Button>
      ] }
      onClose={ onCancel }>
        <Stack hasGutter>
          <StackItem>
            <ActiveUser description="These are all of the users in your Red Hat organization. To manage users, go to your"/>
          </StackItem>
          <StackItem>
            <CompactUsersList selectedUsers={ selectedUsers } setSelectedUsers={ setSelectedUsers } />
          </StackItem>
        </Stack>
    </Modal>
  );
};

AddGroupMembers.defaultProps = {
  users: [],
  inputValue: '',
  closeUrl: '/groups',
  selectedUsers: []
};

AddGroupMembers.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func
  }).isRequired,
  addGroup: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchData: PropTypes.func.isRequired,
  fetchMembersForGroup: PropTypes.func.isRequired,
  inputValue: PropTypes.string,
  users: PropTypes.array,
  selectedUsers: PropTypes.array,
  match: PropTypes.object,
  closeUrl: PropTypes.string,
  addMembersToGroup: PropTypes.func.isRequired
};

const mapStateToProps = ({ groupReducer: { isLoading }}) => ({
  isLoading
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  addGroup,
  addMembersToGroup,
  fetchMembersForGroup
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddGroupMembers));
