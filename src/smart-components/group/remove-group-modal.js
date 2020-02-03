import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Button, Text, TextContent, Checkbox } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons'
import { fetchGroup, removeGroup } from '../../redux/actions/group-actions';
import { FormItemLoader } from '../../presentational-components/shared/loader-placeholders';

const RemoveGroupModal = ({
  history: { goBack, push },
  match: { params: { id }},
  removeGroup,
  group,
  isLoading,
  fetchGroup,
  postMethod,
  closeUrl
}) => {
  useEffect(() => {
    fetchGroup(id);
  }, []);

  const [checked, setChecked] = useState(false);

  const onSubmit = () =>
    postMethod ? removeGroup(id).then(() => postMethod()).then(push(closeUrl)) :
      removeGroup(id).then(() => push(closeUrl));

  const onCancel = () => goBack();

  return (
    <Modal
      isOpen
      isSmall
      title = { <Text>
                <ExclamationTriangleIcon className="delete-group-warning-icon" />
                &nbsp; Delete group?
              </Text>}
      onClose={ onCancel }
      actions={ [
        <Button key="submit" isDisabled={ !checked }  variant="danger" type="button" onClick={ onSubmit }>
          Delete group
        </Button>,
        <Button key="cancel" variant="link" type="button" onClick={ onCancel }>
          Cancel
        </Button>
      ] }
      isFooterLeftAligned
    >
      <TextContent>
        { isLoading ? <FormItemLoader/> :
          <Text>
            Deleting the <b>{ group.name }</b> group removes all roles
            from the members inside the group.
          </Text>
        }
      </TextContent>
      &nbsp;
      <Checkbox
        isChecked={checked}
        onChange={()=> setChecked(!checked)}
        label="I understand that this action cannot be undone."
        id="delete-group-check"
      />
    </Modal>
  );
};

RemoveGroupModal.defaultProps = {
  group: {},
  isLoading: true,
  closeUrl: '/groups'
};

RemoveGroupModal.propTypes = {
  match: PropTypes.shape({
    params: PropTypes.shape({
      id: PropTypes.string
    }).isRequired
  }).isRequired,
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired,
    push: PropTypes.func.isRequired
  }).isRequired,
  removeGroup: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  postMethod: PropTypes.func,
  isLoading: PropTypes.bool,
  group: PropTypes.object,
  closeUrl: PropTypes.string
};

const mapStateToProps = ({ groupReducer: { selectedGroup }}) => ({
  group: selectedGroup,
  isLoading: !selectedGroup.loaded
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  fetchGroup,
  removeGroup
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(RemoveGroupModal));
