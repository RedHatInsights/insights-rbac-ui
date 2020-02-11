import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button, Text, TextContent, Checkbox } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import { fetchGroup, removeGroups } from '../../redux/actions/group-actions';
import { FormItemLoader } from '../../presentational-components/shared/loader-placeholders';

const RemoveGroupModal = ({
  history: { goBack, push },
  removeGroups,
  group,
  isLoading,
  fetchGroup,
  groupsUuid,
  isModalOpen,
  postMethod,
  closeUrl
}) => {
  useEffect(() => {
    if (groupsUuid.length === 1) {
      fetchGroup(groupsUuid[0].uuid);
    }
  }, []);

  const [ checked, setChecked ] = useState(false);

  const multipleGroups = groupsUuid.length > 1;

  const onSubmit = () => {
    const uuids = groupsUuid.map((group) => group.uuid);
    removeGroups(uuids).then(() => postMethod(uuids)).then(push(closeUrl));
  };

  const onCancel = () => goBack();

  return (
    <Modal
      isOpen={ isModalOpen }
      isSmall
      title = {
        <Text>
          <ExclamationTriangleIcon className="delete-group-warning-icon" />
        &nbsp; { multipleGroups ? 'Delete groups?' : 'Delete group?' }
        </Text> }
      onClose={ onCancel }
      actions={ [
        <Button key="submit" isDisabled={ !checked }  variant="danger" type="button" onClick={ onSubmit }>
          { multipleGroups ? 'Delete groups' : 'Delete group' }
        </Button>,
        <Button key="cancel" variant="link" type="button" onClick={ onCancel }>
          Cancel
        </Button>
      ] }
      isFooterLeftAligned
    >
      <TextContent>
        { multipleGroups ?
          <Text>
          Deleting these <b>{ groupsUuid.length }</b> groups removes all roles
          from the members inside the group.
          </Text> :
          isLoading ?
            <FormItemLoader/> :
            <Text>
          Deleting the <b>{ group.name }</b> group removes all roles
          from the members inside the group.
            </Text>
        }
      </TextContent>
      &nbsp;
      <Checkbox
        isChecked={ checked }
        onChange={ ()=> setChecked(!checked) }
        label="I understand that this action cannot be undone."
        id="delete-group-check"
      />
    </Modal>
  );
};

RemoveGroupModal.defaultProps = {
  isModalOpen: false,
  group: {},
  groupsUuid: [],
  isLoading: true,
  closeUrl: '/groups'
};

RemoveGroupModal.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }).isRequired,
  isModalOpen: PropTypes.bool,
  removeGroups: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  postMethod: PropTypes.func,
  isLoading: PropTypes.bool,
  group: PropTypes.object,
  groupsUuid: PropTypes.array,
  closeUrl: PropTypes.string
};

const mapStateToProps = ({ groupReducer: { selectedGroup }}) => ({
  group: selectedGroup,
  isLoading: !selectedGroup.loaded
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchGroup,
  removeGroups
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(RemoveGroupModal));
