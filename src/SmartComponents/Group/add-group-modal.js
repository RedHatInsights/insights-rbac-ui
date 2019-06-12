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
  addGroup,
  addNotification,
  fetchGroups,
  fetchGroup,
  initialValues,
  groupId,
  updateGroup
}) => {
  useEffect(() => {
    if (groupId) {
      fetchGroup(groupId);
    }
  }, []);

  useEffect(() => {
    setValue(initialValues ? initialValues.principals.map(user => (createOption(user.username))) : []);
  }, initialValues);

  const [ inputValue, setInputValue ] = useState('');
  const [ value, setValue ] = useState([]);

  const onSubmit = data => {
    console.log('DEBUG - onSubmit value: ', value);
    const user_data = { ...data, user_list: value.map(user => ({ username: user.label })) };
    console.log('DEBUG - onSubmit user_data: ', user_data);
    initialValues
      ? updateGroup(user_data).then(() => fetchGroups()).then(push('/groups'))
      : addGroup(user_data).then(() => fetchGroups()).then(push('/groups'));
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: initialValues ? 'Editing group' : 'Adding group',
      description: initialValues ? 'Edit group was cancelled by the user.' : 'Adding group was cancelled by the user.'
    });
    push('/groups');
  };

  const schema = {
    type: 'object',
    properties: {
      name: { title: initialValues ? 'Group Name' : 'New Group Name', type: 'string' },
      description: { title: 'Description', type: 'string' }
    },
    required: [ 'name' ]
  };

  const handleChange = (val, actionMeta) => {
    console.log('DEBUG handleChange', `action: ${actionMeta.action}`, 'val: ', val);
    setValue(val);
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
        console.log('DEBUG handleKeyDown - input Value: ', inputValue, 'value: ', value);
        setValue([ ...value, createOption(inputValue) ]);
        console.log('DEBUG handleKeyDown - after: ', 'value: ', value);
        setInputValue('');
        event.preventDefault();
    }
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
          <CreatableSelect
            components={ components }
            inputValue={ inputValue }
            defaultValue={ value }
            isClearable
            isMulti
            menuIsOpen={ false }
            onChange={ handleChange }
            onInputChange={ handleInputChange }
            onKeyDown={ handleKeyDown }
            placeholder="Type the exact user name and press enter..."
            value={ value }
          />
        </GridItem>
      </Grid>
    </Modal>
  );
};

AddGroupModal.defaultProps = {
  users: [],
  value: []
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
  inputValue: PropTypes.string,
  users: PropTypes.array,
  value: PropTypes.array,
  updateGroup: PropTypes.func.isRequired
};

const mapStateToProps = (state, { match: { params: { id }}}) => {
  let selectedGroup = state.groupReducer.selectedGroup;
  return {
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
