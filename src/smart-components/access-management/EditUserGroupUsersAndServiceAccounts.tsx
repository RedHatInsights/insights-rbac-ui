import { FormGroup, Tab, Tabs } from '@patternfly/react-core';
import React, { useState } from 'react';
import { UseFieldApiConfig, useFieldApi, useFormApi } from '@data-driven-forms/react-form-renderer';
import EditGroupServiceAccountsTable from './EditUserGroupServiceAccounts';
import EditGroupUsersTable from './EditUserGroupUsers';

export interface Diff {
  added: string[];
  removed: string[];
}

export const EditGroupUsersAndServiceAccounts: React.FunctionComponent<UseFieldApiConfig> = (props) => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const formOptions = useFormApi();
  const { input, groupId } = useFieldApi(props);
  const values = formOptions.getState().values[input.name];

  const handleUserChange = (users: Diff) => {
    input.onChange({
      users,
      serviceAccounts: values?.serviceAccounts,
    });
  };

  const handleServiceAccountsChange = (serviceAccounts: Diff) => {
    input.onChange({
      users: values?.users,
      serviceAccounts,
    });
  };

  const handleTabSelect = (_: React.MouseEvent<HTMLElement, MouseEvent>, key: string | number) => {
    setActiveTabKey(Number(key));
  };

  return (
    <React.Fragment>
      <FormGroup label="Select users and/or service accounts">
        <Tabs activeKey={activeTabKey} onSelect={handleTabSelect}>
          <Tab eventKey={0} title="Users">
            <EditGroupUsersTable groupId={groupId} onChange={handleUserChange} />
          </Tab>
          <Tab eventKey={1} title="Service accounts">
            <EditGroupServiceAccountsTable groupId={groupId} onChange={handleServiceAccountsChange} />
          </Tab>
        </Tabs>
      </FormGroup>
    </React.Fragment>
  );
};
