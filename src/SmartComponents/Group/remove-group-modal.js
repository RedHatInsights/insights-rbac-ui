import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button, Bullseye, Text, TextContent, TextVariants } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { fetchGroups, fetchGroup, removeGroup } from '../../redux/Actions/GroupActions';

const RemoveGroupModal = ({
  history: { goBack, push },
  removeGroup,
  fetchGroup,
  fetchGroups,
  groupId,
  group
}) => {
  useEffect(() => {
    if (groupId) {
      fetchGroup(groupId);
    }
  }, []);

  if (!group) {
    return null;
  }

  const onSubmit = () => removeGroup(groupId)
  .then(() => {
    fetchGroups();
    push('/groups');
  });

  const onCancel = () => goBack();

  return (
    <Modal
      isOpen
      isSmall
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
        <TextContent>
          <Text component={ TextVariants.h1 }>
            Removing Group:  { group.name }
          </Text>
        </TextContent>
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
  fetchGroup: PropTypes.func.isRequired,
  groupId: PropTypes.string,
  group: PropTypes.object
};

const mapStateToProps = ({ groupReducer: { selectedGroup, isLoading }},
  { match: { params: { id }}}) => ({
  groupId: id,
  group: selectedGroup,
  isLoading
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  fetchGroup,
  fetchGroups,
  removeGroup
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(RemoveGroupModal));
