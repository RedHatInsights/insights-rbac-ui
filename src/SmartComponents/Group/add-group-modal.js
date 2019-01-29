import React from 'react';
import PropTypes from 'prop-types';
import FormRenderer from '../Common/FormRenderer';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal } from '@patternfly/react-core';
import { addNotification } from '@red-hat-insights/insights-frontend-components/components/Notifications';
import { addGroup, fetchGroups, updateGroup } from '../../redux/Actions/GroupActions';
import { pipe } from 'rxjs';

const AddGroupModal = ({
  history: { goBack },
  addGroup,
  addNotification,
  fetchGroups,
  initialValues,
  updateGroup
}) => {
  const onSubmit = data => initialValues
    ? updateGroup(data).then(() => fetchGroups()).then(goBack)
    : addGroup(data).then(() => fetchGroups()).then(goBack);

  const onCancel = () => pipe(
    addNotification({
      variant: 'warning',
      title: initialValues ? 'Editing group' : 'Adding group',
      description: initialValues ? 'Edit group was cancelled by the user.' : 'Adding group was cancelled by the user.'
    }),
    goBack()
  );

  const schema = {
    type: 'object',
    properties: {
      name: { title: initialValues ? 'Group Name' : 'New Group Name', type: 'string' },
      description: { title: 'Description', type: 'string' }
    },
    required: [ 'name', 'description' ]
  };

  return (
    <Modal
      title={ initialValues ? 'Edit group' : 'Add group' }
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

AddGroupModal.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired
  }).isRequired,
  addGroup: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
  updateGroup: PropTypes.func.isRequired
};

const mapStateToProps = ({ groupReducer: { groups }}, { match: { params: { id }}}) => ({
  initialValues: id && groups.find(item => item.id === id),
  groupId: id
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  addGroup,
  updateGroup,
  fetchGroups
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddGroupModal));
