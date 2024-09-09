import React from 'react';
import { Alert, Switch } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import Messages from '../../Messages';
import { UsersIcon } from '@patternfly/react-icons';

const EnableWorkspacesAlert: React.FunctionComponent = () => {
  const [isChecked, setIsChecked] = React.useState<boolean>(true);
  const intl = useIntl();

  return (
    <Alert title={intl.formatMessage(Messages.workspacesAlertTitle)} customIcon={<UsersIcon />} ouiaId="enable-workspaces-alert">
      <Switch
        id="enable-workspaces-switch"
        label="Enable workspaces"
        isChecked={isChecked}
        defaultChecked={false}
        ouiaId="enable-workspaces-switch"
        onChange={(_e, value) => (value ? console.log('here the modal will open') : null)}
      />
    </Alert>
  );
};

export default EnableWorkspacesAlert;
