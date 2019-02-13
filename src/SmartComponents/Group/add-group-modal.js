import React from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import Select from 'react-select';
import FormRenderer from '../Common/FormRenderer';
import { Modal, Grid, GridItem, TextContent, Text, TextVariants } from '@patternfly/react-core';
import { addNotification } from '@red-hat-insights/insights-frontend-components/components/Notifications';
import { addGroup, fetchGroups, updateGroup } from '../../redux/Actions/GroupActions';
import { pipe } from 'rxjs';

const AddGroupModal = ({
  history: { goBack },
  addGroup,
  addNotification,
  fetchGroups,
  initialValues,
  users,
  updateGroup
}) => {
  const onSubmit = data => {
    data.user_ids = selectedUsers;
    initialValues
      ? updateGroup(data).then(() => fetchGroups()).then(goBack)
      : addGroup(data).then(() => fetchGroups()).then(goBack);
  };

  const onCancel = () => pipe(
    addNotification({
      variant: 'warning',
      title: initialValues ? 'Editing group' : 'Adding group',
      description: initialValues ? 'Edit group was cancelled by the user.' : 'Adding group was cancelled by the user.'
    }),
    goBack()
  );

  let selectedUsers = [];

  const onOptionSelect = (selectedValues = []) =>
  { selectedUsers = selectedValues.map(val => val.value); };

  const dropdownItems = users.map(user => ({ value: user.id, label: `${user.first_name} ${user.last_name}`, id: user.id }));

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
            onChange={ onOptionSelect }
            closeMenuOnSelect={ false }
          />
        </GridItem>
      </Grid>
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
  users: PropTypes.array,
  updateGroup: PropTypes.func.isRequired
};

const mapStateToProps = (state, { match: { params: { id }}}) => {
  let groups = state.groupReducer.groups;
  return {
    users: state.userReducer.users,
    initialValues: id && groups.find(item => item.id === id),
    groupId: id
  };
};

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  addGroup,
  updateGroup,
  fetchGroups
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddGroupModal));
