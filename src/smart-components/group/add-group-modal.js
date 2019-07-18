import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import CreatableSelect from 'react-select/creatable';
import FormRenderer from '../common/form-renderer';
import { Modal, Grid, GridItem, TextContent, Text, TextVariants } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { addGroup, fetchGroups, fetchGroup, updateGroup } from '../../redux/actions/group-actions';

const components = {
  DropdownIndicator: null
};

const AddGroupWizard = ({
  history: { push },
  match: { params: { id }},
  addNotification,
  addGroup,
  updateGroup
}) => {
  const [ selectedGroup, setSelectedGroup ] = useState({});
  const [ inputValue, setInputValue ] = useState('');
  const [ selectedUsers, setSelectedUsers ] = useState([]);
  const [ optionIdx, setOptionIdx ] = useState(0);

  const createOption = (label) => {
    let idx = optionIdx;
    setOptionIdx(optionIdx + 1);
    return {
      label,
      value: `${label}_${idx}`
    };
  };

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
    const user_data = { ...data, user_list: selectedUsers.map(user => ({ username: user.label })) };
    id ? updateGroup(user_data).then(() => fetchGroups()).then(push('/groups'))
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

  const handleChange = (value) => {
    setSelectedUsers(value);
  };

  const handleInputChange = (val) => {
    setInputValue(val);
  };

  const handleKeyDown = (event) => {
    if (!inputValue) {return;}

    switch (event.key) {
      case 'Enter':
      case 'Tab':
        if (selectedUsers) {
          if (!selectedUsers.find(user => (user.label === inputValue))) {
            setSelectedUsers([ ...selectedUsers, createOption(inputValue) ]);
          }
        }
        else {
          setSelectedUsers([ createOption(inputValue) ]);
        }

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

AddGroupWizard.defaultProps = {
  users: [],
  inputValue: '',
  selectedGroup: undefined,
  selectedUsers: []
};

AddGroupWizard.propTypes = {
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

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddGroupWizard));
