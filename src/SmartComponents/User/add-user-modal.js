import React from 'react';
import PropTypes from 'prop-types';
import Select from 'react-select';
import FormRenderer from '../Common/FormRenderer';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import { Modal, Grid, GridItem, TextContent, Text, TextVariants } from '@patternfly/react-core';
import { addNotification } from '@red-hat-insights/insights-frontend-components/components/Notifications';
import { addUser, fetchUsers, updateUser } from '../../redux/Actions/UserActions';

const AddUserModal = ({
  history: { goBack },
  addUser,
  addNotification,
  fetchUsers,
  initialValues,
  groups,
  updateUser
}) => {
  const onSubmit = data => {
    data.group_ids = selectedGroups;
    initialValues
      ? updateUser(data).then(() => fetchUsers()).then(goBack)
      : addUser(data).then(() => fetchUsers()).then(goBack);
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: initialValues ? 'Editing approver' : 'Adding approver',
      description: initialValues ? 'Edit approver was cancelled by the user.' : 'Adding approver was cancelled by the user.'
    });
    goBack();
  };

  let selectedGroups = [];

  const onOptionSelect = (selectedValues = []) =>
  { selectedGroups = selectedValues.map(val => val.value); };

  const dropdownItems = groups.map(group => ({ value: group.id, label: group.name, id: group.id }));

  const schema = {
    type: 'object',
    properties: {
      email: { title: initialValues ? 'Email' : 'New Email', type: 'string' },
      first_name: { title: 'First Name', type: 'string' },
      last_name: { title: 'Last Name', type: 'string' }
    },
    required: [ 'email' ]
  };

  return (
    <Modal
      isLarge
      title={ initialValues ? 'Update approver' : 'Create approver' }
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
            <Text component={ TextVariants.h6 }>Select the groups for this user.</Text>
          </TextContent>
          <Select
            isMulti={ true }
            placeholders={ 'Select groups' }
            options={ dropdownItems }
            onChange={ onOptionSelect }
            closeMenuOnSelect={ false }
          />
        </GridItem>
      </Grid>
    </Modal>
  );
};

AddUserModal.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired
  }).isRequired,
  addUser: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchUsers: PropTypes.func.isRequired,
  initialValues: PropTypes.object,
  groups: PropTypes.array,
  updateUser: PropTypes.func.isRequired
};

const mapStateToProps = (state, { match: { params: { id }}}) => {
  let users = state.userReducer.users;
  return {
    groups: state.groupReducer.groups,
    initialValues: id && users.find(item => item.id === id),
    userId: id
  };
};

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  addUser,
  updateUser,
  fetchUsers
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddUserModal));
