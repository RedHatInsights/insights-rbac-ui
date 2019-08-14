import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { bindActionCreators } from 'redux';
import PropTypes from 'prop-types';
import CreatableSelect from 'react-select/creatable';
import FormRenderer from '../../../common/form-renderer';
import { Modal, Grid, GridItem, TextContent, Text, TextVariants } from '@patternfly/react-core';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import { fetchGroupPolicies, fetchPolicy, updatePolicy } from '../../../../redux/actions/policy-actions';

const components = {
  DropdownIndicator: null
};

const EditPolicyModal = ({
  history: { push },
  match: { params: { id }},
  addNotification,
  updatePolicy
}) => {
  const [ selectedPolicy, setSelectedPolicy ] = useState({});
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

  const setPolicyData = (policyData) => {
    setSelectedPolicy(policyData);
    if (policyData) {
      setSelectedUsers(policyData.principals.map(user => (createOption(user.username))));
    }
  };

  const fetchData = () => {
    fetchPolicy(id).payload.then((data) => setPolicyData(data)).catch(() => setPolicyData(undefined));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const onSubmit = data => {
    const user_data = { ...data, user_list: selectedUsers.map(user => ({ username: user.label })) };
    updatePolicy(user_data).then(() => fetchGroupPolicies()).then(push('/policies'));
  };

  const onCancel = () => {
    addNotification({
      variant: 'warning',
      title: selectedPolicy ? 'Editing policy' : 'Adding policy',
      description: selectedPolicy ? 'Edit policy was cancelled by the user.' : 'Adding policy was cancelled by the user.'
    });
    push('/policies');
  };

  const schema = {
    type: 'object',
    properties: {
      name: { title: selectedPolicy ? 'Policy Name' : 'New Policy Name', type: 'string' },
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
      title={ selectedPolicy ? 'Edit policy' : 'Add policy' }
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
            initialValues={ { ...selectedPolicy } }
          />
        </GridItem>
        <GridItem sm={ 6 }>
          <TextContent>
            <Text component={ TextVariants.h6 }>Select Members for this policy.</Text>
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

EditPolicyModal.defaultProps = {
  users: [],
  inputValue: '',
  selectedPolicy: undefined,
  selectedUsers: []
};

EditPolicyModal.propTypes = {
  history: PropTypes.shape({
    goBack: PropTypes.func.isRequired
  }).isRequired,
  addPolicy: PropTypes.func.isRequired,
  addNotification: PropTypes.func.isRequired,
  fetchGroupPolicies: PropTypes.func.isRequired,
  fetchPolicy: PropTypes.func.isRequired,
  selectedPolicy: PropTypes.object,
  inputValue: PropTypes.string,
  users: PropTypes.array,
  selectedUsers: PropTypes.array,
  match: PropTypes.object,
  updatePolicy: PropTypes.func.isRequired
};

const mapStateToProps = ({ policyReducer: { isLoading }}) => ({
  isLoading
});

const mapDispatchToProps = (dispatch) => bindActionCreators({
  addNotification,
  updatePolicy,
  fetchPolicy,
  fetchGroupPolicies
}, dispatch);

export default withRouter(connect(mapStateToProps, mapDispatchToProps)(EditPolicyModal));
