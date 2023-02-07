import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import { Button, Modal, ModalVariant, StackItem, Stack, TextContent } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { addGroup, addMembersToGroup, fetchMembersForGroup, fetchGroups } from '../../../redux/actions/group-actions';
import UsersList from '../add-group/users-list';
import ActiveUser from '../../../presentational-components/shared/ActiveUsers';
import { useIntl } from 'react-intl';
import messages from '../../../Messages';

const AddGroupMembers = ({
  history: { push },
  match: {
    params: { uuid },
  },
  addNotification,
  closeUrl,
  addMembersToGroup,
  fetchMembersForGroup,
  fetchGroups,
}) => {
  const [selectedUsers, setSelectedUsers] = useState([]);
  const intl = useIntl();
  const onSubmit = () => {
    const userList = selectedUsers.map((user) => ({ username: user.label }));
    if (userList.length > 0) {
      addNotification({
        variant: 'info',
        title: intl.formatMessage(userList.length > 1 ? messages.addingGroupMembersTitle : messages.addingGroupMemberTitle),
        dismissDelay: 8000,
        description: intl.formatMessage(userList.length > 1 ? messages.addingGroupMembersDescription : messages.addingGroupMemberDescription),
      });
      addMembersToGroup(uuid, userList).then(() => {
        fetchMembersForGroup(uuid);
        fetchGroups({ inModal: false });
      });
    }

    push(closeUrl);
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: intl.formatMessage(selectedUsers.length > 1 ? messages.addingGroupMembersTitle : messages.addingGroupMemberTitle),
      dismissDelay: 8000,
      description: intl.formatMessage(selectedUsers.length > 1 ? messages.addingGroupMembersCancelled : messages.addingGroupMemberCancelled),
    });
    push(closeUrl);
  };

  return (
    <Modal
      title={intl.formatMessage(messages.addMembers)}
      variant={ModalVariant.medium}
      isOpen
      actions={[
        <Button key="confirm" ouiaId="primary-confirm-button" isDisabled={selectedUsers.length === 0} variant="primary" onClick={onSubmit}>
          {intl.formatMessage(messages.addToGroup)}
        </Button>,
        <Button id="add-groups-cancel" ouiaId="secondary-cancel-button" key="cancel" variant="link" onClick={onCancel}>
          {intl.formatMessage(messages.cancel)}
        </Button>,
      ]}
      onClose={onCancel}
    >
      <Stack hasGutter>
        <StackItem>
          <TextContent>
            <ActiveUser linkDescription={intl.formatMessage(messages.toManageUsersText)} />
          </TextContent>
        </StackItem>
        <StackItem>
          <UsersList selectedUsers={selectedUsers} setSelectedUsers={setSelectedUsers} inModal />
        </StackItem>
      </Stack>
    </Modal>
  );
};

AddGroupMembers.defaultProps = {
  users: [],
  inputValue: '',
  closeUrl: '/groups',
  selectedUsers: [],
};

AddGroupMembers.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func,
  }).isRequired,
  addGroup: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchData: PropTypes.func,
  fetchMembersForGroup: PropTypes.func.isRequired,
  inputValue: PropTypes.string,
  users: PropTypes.array,
  selectedUsers: PropTypes.array,
  match: PropTypes.object,
  closeUrl: PropTypes.string,
  addMembersToGroup: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
};

const mapStateToProps = ({ groupReducer: { isLoading } }) => ({
  isLoading,
});

const mapDispatchToProps = (dispatch) =>
  bindActionCreators(
    {
      addNotification,
      addGroup,
      addMembersToGroup,
      fetchMembersForGroup,
      fetchGroups,
    },
    dispatch
  );

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddGroupMembers));
