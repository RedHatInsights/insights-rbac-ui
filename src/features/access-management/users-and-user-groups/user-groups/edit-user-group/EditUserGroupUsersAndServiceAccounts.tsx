import { FormGroup, Tab, Tabs } from '@patternfly/react-core';
import React, { useEffect, useState } from 'react';
import { UseFieldApiConfig, useFieldApi, useFormApi } from '@data-driven-forms/react-form-renderer';
import { EditGroupServiceAccountsTable } from './EditUserGroupServiceAccounts';
import { EditGroupUsersTable } from './EditUserGroupUsers';
import { useIntl } from 'react-intl';
import Messages from '../../../../../Messages';

export interface TableState {
  initial: string[];
  updated: string[];
}

interface ExtendedUseFieldApiConfig extends UseFieldApiConfig {
  initialUsers?: string[];
  initialServiceAccounts?: string[];
}

export const EditGroupUsersAndServiceAccounts: React.FunctionComponent<ExtendedUseFieldApiConfig> = (props) => {
  const [activeTabKey, setActiveTabKey] = useState(0);
  const formOptions = useFormApi();
  const { input, groupId, initialUsers = [], initialServiceAccounts = [] } = useFieldApi(props);
  const intl = useIntl();

  // Initialize form values once when the component mounts
  useEffect(() => {
    const initialState = {
      users: {
        initial: initialUsers,
        updated: initialUsers,
      },
      serviceAccounts: {
        initial: initialServiceAccounts,
        updated: initialServiceAccounts,
      },
    };

    if (!formOptions.getState().values[input.name]) {
      input.onChange(initialState);
    }
  }, [initialUsers, initialServiceAccounts]);

  const handleUserChange = (users: TableState) => {
    const currentValue = formOptions.getState().values[input.name] || {};
    input.onChange({
      ...currentValue,
      users,
    });
  };

  const handleServiceAccountsChange = (serviceAccounts: TableState) => {
    const currentValue = formOptions.getState().values[input.name] || {};
    input.onChange({
      ...currentValue,
      serviceAccounts,
    });
  };

  const handleTabSelect = (_: React.MouseEvent<HTMLElement, MouseEvent>, key: string | number) => {
    setActiveTabKey(Number(key));
  };

  return (
    <div data-testid="users-and-service-accounts-component">
      <FormGroup label={intl.formatMessage(Messages.selectUsersAndOrServiceAccounts)}>
        <Tabs activeKey={activeTabKey} onSelect={handleTabSelect}>
          <Tab eventKey={0} title={intl.formatMessage(Messages.users)}>
            {/* Empty tab content - actual content rendered below */}
          </Tab>
          <Tab eventKey={1} title={intl.formatMessage(Messages.serviceAccounts)}>
            {/* Empty tab content - actual content rendered below */}
          </Tab>
        </Tabs>

        {/* Always render both components but show/hide based on active tab */}
        <div style={{ display: activeTabKey === 0 ? 'block' : 'none' }}>
          <EditGroupUsersTable groupId={groupId} onChange={handleUserChange} initialUserIds={initialUsers} />
        </div>
        <div style={{ display: activeTabKey === 1 ? 'block' : 'none' }}>
          <EditGroupServiceAccountsTable groupId={groupId} onChange={handleServiceAccountsChange} initialServiceAccountIds={initialServiceAccounts} />
        </div>
      </FormGroup>
    </div>
  );
};

// Component uses named export only
