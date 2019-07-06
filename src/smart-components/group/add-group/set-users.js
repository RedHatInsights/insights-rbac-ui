import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import {
  Stack,
  StackItem,
  Text,
  TextContent,
  TextVariants,
  Title
} from '@patternfly/react-core';
import CreatableSelect from 'react-select/creatable';

const components = {
  DropdownIndicator: null
};

const SetUsers = (setGroupData, selectedUsers, setSelectedUsers, optionIdx, setOptionIdx, createOption) => {
  const [ inputValue, setInputValue ] = useState('');

  const handleInputChange = (val) => {
    setInputValue(val);
  };

  const handleUsersChange = (value) => {
    setSelectedUsers(value);
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
    <Fragment>
      <Stack gutter="md">
        <StackItem>
          <Title size="xl">Select members for this group</Title>
        </StackItem>
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
            onChange={ handleUsersChange }
            onInputChange={ handleInputChange }
            onKeyDown={ handleKeyDown }
            placeholder="Type the exact user name and press enter..."
            value={ selectedUsers }
          />
        </StackItem>
      </Stack>
    </Fragment>
  );
};

SetUsers.propTypes = {
  name: PropTypes.string,
  description: PropTypes.string
};

export default SetUsers;
