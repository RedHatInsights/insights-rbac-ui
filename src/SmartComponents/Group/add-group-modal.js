import React, { useEffect } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import Select from 'react-select';
import FormRenderer from '../Common/FormRenderer';
import { Modal, Grid, GridItem, TextContent, Text, TextVariants } from '@patternfly/react-core';
import { addNotification } from '@red-hat-insights/insights-frontend-components/components/Notifications';
import { addGroup, fetchGroups, fetchGroup, updateGroup } from '../../redux/Actions/GroupActions';

const AddGroupModal = ({
  history: { goBack },
  addGroup,
  addNotification,
  fetchGroups,
  fetchGroup,
  initialValues,
  users,
  groupId,
  updateGroup
}) => {
  useEffect(() => {
    if (groupId) {
      fetchGroup(groupId);
    }
  }, []);

  const onSubmit = data => {
    const user_data = { ...data, user_list: selectedUsers.map(user => ({ username: user })) };
    initialValues
      ? updateGroup(user_data).then(() => fetchGroups()).then(goBack)
      : addGroup(user_data).then(() => fetchGroups()).then(goBack);
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: initialValues ? 'Editing group' : 'Adding group',
      description: initialValues ? 'Edit group was cancelled by the user.' : 'Adding group was cancelled by the user.'
    });
    goBack();
  };

  let selectedUsers = [];

  const onOptionSelect = (selectedValues = []) =>
  { selectedUsers = selectedValues.map(val => val.value); };

  const dropdownItems = users.map(user => ({ value: user.username, label: user.username, id: user.username }));

  const schema = {
    type: 'object',
    properties: {
      name: { title: initialValues ? 'Group Name' : 'New Group Name', type: 'string' },
      description: { title: 'Description', type: 'string' }
    },
    required: [ 'name' ]
  };

  return (
    <Modal
      isLarge
      title={ initialValues ? 'Edit group' : 'Add group' }
      isOpen
      onClose={ onCancel }
    >
      <Grid gutter="md" style={ { minWidth: '800px' } }>
        <GridItem sm={ 6 }>
          <FormRenderer
            schema={ schema }
            schemaType="mozilla"
            onSubmit={ onSubmit }
            onCancel={ onCancel }
            formContainer="modal"
            initialValues={ { ...initialValues } }
          />
        </GridItem>
        <GridItem sm={ 6 }>
          <TextContent>
            <Text component={ TextVariants.h6 }>Select Members for this group.</Text>
          </TextContent>
          <Select
            isMulti={ true }
            placeholders={ 'Select Members' }
            options={ dropdownItems }
            defaultValue={ (initialValues && initialValues.members) ? initialValues.members.map(
              user => ({ value: user.username, label: `${user.username}`, id: user.username })) : [] }
            onChange={ onOptionSelect }
            closeMenuOnSelect={ false }
          />
        </GridItem>
      </Grid>
    </Modal>
  );
};

AddGroupModal.defaultProps = {
  users: []
};

AddGroupModal.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired
  }).isRequired,
  addGroup: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
  groupId: PropTypes.string,
  users: PropTypes.array,
  updateGroup: PropTypes.func.isRequired
};

const mapStateToProps = (state, { match: { params: { id }}}) => {
  let selectedGroup = state.groupReducer.selectedGroup;
  return {
    users: state.userReducer.users,
    initialValues: id && selectedGroup,
    groupId: id
  };
};

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  addGroup,
  updateGroup,
  fetchGroup,
  fetchGroups
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddGroupModal));
