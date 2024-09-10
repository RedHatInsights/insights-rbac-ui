import React from 'react';
import { UsersIcon } from '@patternfly/react-icons';
import { Alert, Switch } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import Messages from '../../Messages';
import EnableWorkspacesModal from '../workspaces/EnableWorkspacesModal/enable-workspaces-modal';
import './enable-workspaces-alert.scss';

const EnableWorkspacesAlert: React.FunctionComponent = () => {
  const [isChecked] = React.useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const intl = useIntl();

  const handleModalToggle = (_event: KeyboardEvent | React.MouseEvent) => {
    setIsModalOpen((prevIsModalOpen) => !prevIsModalOpen);
  };

  const onConfirm = () => {
    setIsModalOpen(false);
  };

  return (
    <div>
      <Alert
        variant="custom"
        title={intl.formatMessage(Messages.workspacesAlertTitle)}
        customIcon={<UsersIcon />}
        ouiaId="enable-workspaces-alert"
        className="pf-v5-enable-workspace-alert"
      >
        <Switch
          id="enable-workspaces-switch"
          label="Enable workspaces"
          isChecked={isChecked}
          defaultChecked={false}
          ouiaId="enable-workspaces-switch"
          onChange={(_e, value) => (value ? setIsModalOpen(value) : null)}
        />
      </Alert>

      <EnableWorkspacesModal isModalOpen={isModalOpen} onClose={handleModalToggle} onConfirm={onConfirm} />
    </div>
  );
};

export default EnableWorkspacesAlert;
