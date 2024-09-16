import React from 'react';
import { UsersIcon } from '@patternfly/react-icons';
import {
  Alert,
  Button,
  ButtonVariant,
  Checkbox,
  Modal,
  ModalVariant,
  Stack,
  StackItem,
  Switch,
  Text,
  TextVariants,
  Title,
  TitleSizes,
} from '@patternfly/react-core';
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

  const header = (
    <React.Fragment>
      <Title ouiaId="enable-workspaces-modal-header" headingLevel="h1" size={TitleSizes['2xl']}>
        {intl.formatMessage(Messages.enableWorkspacesWizardTitle)}
      </Title>
      <Text component={TextVariants.p}>{intl.formatMessage(Messages.enableWorkspacesWizardDesc)}</Text>
    </React.Fragment>
  );

  const EnableWorkspacesModal = (
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
            {intl.formatMessage(Messages.confirm)}
          </Button>,
          <Button key="cancel" variant={ButtonVariant.link} onClick={handleModalToggle}>
            {intl.formatMessage(Messages.cancel)}
          </Button>,
        ]}
      >
        <Stack hasGutter>
          <StackItem>
            <span>{intl.formatMessage(Messages.enableWorkspacesWizardBodyPart1)}</span>
          </StackItem>
          <StackItem>
            <span>
              <b>{intl.formatMessage(Messages.enableWorkspacesWizardBodyPart2Header)}</b>{' '}
              {intl.formatMessage(Messages.enableWorkspacesWizardBodyPart2)}
            </span>
          </StackItem>
          <StackItem>
            <span>
              <b>{intl.formatMessage(Messages.enableWorkspacesWizardBodyPart3Header)}</b>{' '}
              {intl.formatMessage(Messages.enableWorkspacesWizardBodyPart3)}
            </span>
          </StackItem>
          <StackItem>
            <Checkbox
              isChecked={checked}
              onChange={(_event, value) => setChecked(value)}
              label={intl.formatMessage(Messages.enableWorkspacesWizardCheckboxLabel)}
              ouiaId="enable-workspace-checkbox"
              id="enable-workspace-checkbox"
            />
          </StackItem>
        </Stack>
      </Modal>
    </React.Fragment>
  );

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
        <Alert variant="success" title={intl.formatMessage(Messages.workspacesSuccessAlertTitle)}></Alert>
      )}
      {EnableWorkspacesModal}
    </div>
  );
};

export default EnableWorkspacesAlert;
