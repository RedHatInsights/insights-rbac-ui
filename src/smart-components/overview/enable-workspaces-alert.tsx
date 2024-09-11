import React from 'react';
import { UsersIcon } from '@patternfly/react-icons';
import { Alert, Button, ButtonVariant, Checkbox, Modal, ModalVariant, Switch, Title, TitleSizes } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import Messages from '../../Messages';
import './enable-workspaces-alert.scss';

const EnableWorkspacesAlert: React.FunctionComponent = () => {
  const [isToggled, setIsToggled] = React.useState<boolean>(false);
  const [checked, setChecked] = React.useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = React.useState<boolean>(false);
  const intl = useIntl();

  const handleModalToggle = () => {
    setIsToggled(false);
    setIsModalOpen((prevIsModalOpen) => !prevIsModalOpen);
  };

  const handleSwitchChange = (_event: React.FormEvent<HTMLInputElement>, toggled: boolean) => {
    setIsModalOpen(toggled);
  };

  const onConfirm = () => {
    setIsToggled(false);
    setIsModalOpen(false);
    setIsConfirmed(true);
  };

  const checkboxLabel: string = 'By checking this box, I acknowledge that this action cannot be undone.';

  const header = (
    <React.Fragment>
      <Title id="enable-workspaces-modal-header" headingLevel="h1" size={TitleSizes['2xl']}>
        {intl.formatMessage(Messages.enableWorkspacesWizardTitle)}
      </Title>
      <p>{intl.formatMessage(Messages.enableWorkspacesWizardDesc)}</p>
    </React.Fragment>
  );

  const EnableWorkspacesModal = (
    /* eslint-disable react/no-children-prop */
    <React.Fragment>
      <Modal
        variant={ModalVariant.large}
        header={header}
        isOpen={isModalOpen}
        onClose={handleModalToggle}
        onEscapePress={handleModalToggle}
        actions={[
          <Button
            key="confirm"
            variant={ButtonVariant.primary}
            onClick={() => {
              onConfirm?.(), setChecked(false);
            }}
            isDisabled={!checked}
          >
            Confirm
          </Button>,
          <Button key="cancel" variant={ButtonVariant.link} onClick={handleModalToggle}>
            Cancel
          </Button>,
        ]}
      >
        <span>{intl.formatMessage(Messages.enableWorkspacesWizardBodyPart1)}</span>
        <br />
        <br />
        <span>
          <b>Workspaces: </b> {intl.formatMessage(Messages.enableWorkspacesWizardBodyPart2)}
        </span>
        <br />
        <br />
        <span>
          <b>Groups, roles, and role bindings: </b> {intl.formatMessage(Messages.enableWorkspacesWizardBodyPart3)}
        </span>
        <br />
        <br />
        <Checkbox isChecked={checked} onChange={(_event, value) => setChecked(value)} label={checkboxLabel} id="enable-workspace-checkbox" />
      </Modal>
    </React.Fragment>
  );

  const successAlert = <Alert variant="success" title={intl.formatMessage(Messages.workspacesSuccessAlertTitle)}></Alert>;

  return (
    <div>
      {!isConfirmed ? (
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
            isChecked={isToggled}
            defaultChecked={false}
            ouiaId="enable-workspaces-switch"
            onChange={handleSwitchChange}
          />
        </Alert>
      ) : (
        successAlert
      )}

      {EnableWorkspacesModal}
    </div>
  );
};

export default EnableWorkspacesAlert;
