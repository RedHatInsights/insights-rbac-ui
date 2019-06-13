import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import CreatableSelect from 'react-select/creatable';
import FormRenderer from '../Common/FormRenderer';
import { Modal, Grid, GridItem, TextContent, Text, TextVariants } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { addGroup, fetchGroups, fetchGroup, updateGroup } from '../../redux/Actions/GroupActions';

const components = {
  DropdownIndicator: null
};

const createOption = (label) => ({
  label,
  value: label
});

const AddGroupModal = ({
  history: { push },
  match: { params: { id }},
  addNotification
}) => {
  const [ selectedGroup, setSelectedGroup ] = useState({});
  const [ inputValue, setInputValue ] = useState('');
  const [ selectedUsers, setSelectedUsers ] = useState([]);

  const setGroupData = (groupData) => {
    setSelectedGroup(groupData);
    if (groupData) {
      setSelectedUsers(groupData.principals.map(user => (createOption(user.username))));
    }
  };

  const fetchData = () => {
    fetchGroup(id).payload.then((data) => setGroupData(data)).catch(() => setGroupData(undefined));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = data => {
    console.log('DEBUG - onSubmit selectedUsers: ', selectedUsers);
    const user_data = { ...data, user_list: selectedUsers.map(user => ({ username: user.label })) };
    console.log('DEBUG - onSubmit user_data: ', user_data);
    selectedGroup
      ? updateGroup(user_data).then(() => { fetchGroups(); push('/groups'); })
      : addGroup(user_data).then(() => fetchGroups()).then(push('/groups'));
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: selectedGroup ? 'Editing group' : 'Adding group',
      description: selectedGroup ? 'Edit group was cancelled by the user.' : 'Adding group was cancelled by the user.'
    });
    push('/groups');
  };

  const schema = {
    type: 'object',
    properties: {
      name: { title: selectedGroup ? 'Group Name' : 'New Group Name', type: 'string' },
      description: { title: 'Description', type: 'string' }
    },
    required: [ 'name' ]
  };

  const handleChange = (val, actionMeta) => {
    console.log('DEBUG handleChange', `action: ${actionMeta.action}`, 'val: ', val);
    setSelectedUsers([ ...val ]);
  };

  const handleInputChange = (val) => {
    console.log('DEBUG handleInputChange - val: ', val, 'inputValue: ', inputValue);
    setInputValue(val);
  };

  const handleKeyDown = (event) => {
    if (!inputValue) {return;}

    switch (event.key) {
      case 'Enter':
      case 'Tab':
        console.log('DEBUG handleKeyDown - input Value: ', inputValue, 'selectedUsers: ', selectedUsers);
        setSelectedUsers([ ...selectedUsers, { label: inputValue, selectedUsers: inputValue }]);
        console.log('DEBUG handleKeyDown - after: ', 'selectedUsers: ', selectedUsers);
        setInputValue('');
        event.preventDefault();
    }
  };

  return (
    <Modal
      isLarge
      title={ selectedGroup ? 'Edit group' : 'Add group' }
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
            initialValues={ { ...selectedGroup } }
          />
        </GridItem>
        <GridItem sm={ 6 }>
          <TextContent>
            <Text component={ TextVariants.h6 }>Select Members for this group.</Text>
          </TextContent>
          <CreatableSelect
            components={ components }
            inputValue={ inputValue }
            defaultValue={ selectedUsers }
            isClearable
            isMulti
            menuIsOpen={ false }
            onChange={ handleChange }
            onInputChange={ handleInputChange }
            onKeyDown={ handleKeyDown }
            placeholder="Type the exact user name and press enter..."
            value={ selectedUsers }
          />
        </GridItem>
      </Grid>
    </Modal>
  );
};

AddGroupModal.defaultProps = {
  users: [],
  inputValue: '',
  selectedGroup: undefined,
  selectedUsers: []
};

AddGroupModal.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired
  }).isRequired,
  addGroup: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchGroups: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  selectedGroup: PropTypes.object,
  inputValue: PropTypes.string,
  users: PropTypes.array,
  selectedUsers: PropTypes.array,
  match: PropTypes.object,
  updateGroup: PropTypes.func.isRequired
};

const mapStateToProps = ({ groupReducer: { isLoading }}) => ({
  isLoading
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  addGroup,
  updateGroup,
  fetchGroup,
  fetchGroups
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddGroupModal));
