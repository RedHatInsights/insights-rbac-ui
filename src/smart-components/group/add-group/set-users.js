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
import { TableToolbarView } from '../../../presentational-components/shared/table-toolbar-view';

const components = {
  DropdownIndicator: null
};


const columns = [
  { title: 'Role name', orderBy: 'name' },
  { title: 'Description' }
];

const createRows = (data, expanded, checkedRows = []) => {
  return data ? data.reduce((acc, { uuid, name, description }) => ([
    ...acc, {
      uuid,
      cells: [name, description],
      selected: Boolean(checkedRows && checkedRows.find(row => row.uuid === uuid))
    }
  ]), []) : [];
};

const SetUsers = (setGroupData, selectedUsers, setSelectedUsers, optionIdx, setOptionIdx, createOption) => {
  const [ inputValue, setInputValue ] = useState('');

  return (
    <Fragment>
      <Stack gutter="md">
        <StackItem>
          <Title size="xl">Add members to the group</Title>
        </StackItem>
        <StackItem>
          <TextContent>
            <Text component={ TextVariants.h6 }>Select users from your organization to add to this group.</Text>
          </TextContent>
          <<TableToolbarView
            columns={columns}
            isSelectable={true}
            isCompact={true}
            borders={false}
            createRows={createRows}
            data={roles}
            filterValue={filterValue}
            fetchData={(config) => fetchRoles(mappedProps(config))}
            setFilterValue={({ name }) => setFilterValue(name)}
            isLoading={isLoading}
            pagination={pagination}
            request={fetchRoles}
            checkedRows={selectedRoles}
            setCheckedItems={setCheckedItems}
            titlePlural="roles"
            titleSingular="role"
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
