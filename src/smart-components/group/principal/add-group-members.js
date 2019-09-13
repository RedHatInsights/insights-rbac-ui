import React, { useState } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import CreatableSelect from 'react-select/creatable';
import { ActionGroup,
  Button,
  Modal,
  Split,
  SplitItem,
  Stack,
  StackItem,
  TextContent,
  Text,
  TextVariants } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { addGroup, fetchGroup, addMembersToGroup } from '../../../redux/actions/group-actions';

const components = {
  DropdownIndicator: null
};

const AddGroupMembers = ({
  history: { push },
  match: { params: { uuid }},
  addNotification,
  fetchData,
  closeUrl,
  addMembersToGroup
}) => {
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

  const onSubmit = () => {
    const user_list = selectedUsers.map(user => ({ username: user.label }));
    return addMembersToGroup(uuid, user_list).then(() => {
      fetchData();
      push(closeUrl);
    });
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: 'Adding members to group',
      description: 'Adding members to group was cancelled by the user.'
    });
    push(closeUrl);
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
      title={ 'Add group members' }
      width={ '40%' }
      isOpen
      onClose={ onCancel }>
      <Stack gutter="md">
        <StackItem>
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
        </StackItem>
        <StackItem>
          <ActionGroup>
            <Split gutter="md">
              <SplitItem>
                <Button aria-label={ 'Save' }
                  variant="primary"
                  type="submit"
                  onClick={ onSubmit }>Save</Button>
              </SplitItem>
              <SplitItem>
                <Button  aria-label='Cancel'
                  variant='secondary'
                  type='button'
                  onClick={ onCancel }>Cancel</Button>
              </SplitItem>
            </Split>
          </ActionGroup>
        </StackItem>
      </Stack>
    </Modal>
  );
};

AddGroupMembers.defaultProps = {
  users: [],
  inputValue: '',
  closeUrl: '/groups',
  selectedUsers: []
};

AddGroupMembers.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired
  }).isRequired,
  addGroup: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchData: PropTypes.func.isRequired,
  fetchGroup: PropTypes.func.isRequired,
  inputValue: PropTypes.string,
  users: PropTypes.array,
  selectedUsers: PropTypes.array,
  match: PropTypes.object,
  closeUrl: PropTypes.string,
  addMembersToGroup: PropTypes.func.isRequired
};

const mapStateToProps = ({ groupReducer: { isLoading }}) => ({
  isLoading
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  addGroup,
  addMembersToGroup,
  fetchGroup
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(AddGroupMembers));
