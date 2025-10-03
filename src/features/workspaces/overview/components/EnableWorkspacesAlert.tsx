import React from 'react';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ButtonVariant } from '@patternfly/react-core';
import { Checkbox } from '@patternfly/react-core/dist/dynamic/components/Checkbox';
import { Modal } from '@patternfly/react-core/dist/dynamic/components/Modal';
import { ModalVariant } from '@patternfly/react-core';
import { Stack } from '@patternfly/react-core';
import { StackItem } from '@patternfly/react-core';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';
import { Text } from '@patternfly/react-core/dist/dynamic/components/Text';
import { TextVariants } from '@patternfly/react-core/dist/dynamic/components/Text';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { TitleSizes } from '@patternfly/react-core';
import {} from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import messages from '../../../../Messages';
import './EnableWorkspacesAlert.scss';

export const EnableWorkspacesAlert: React.FC = () => {
  const [checked, setChecked] = React.useState<boolean>(false);
  const [isModalOpen, setIsModalOpen] = React.useState<boolean>(false);
  const [isConfirmed, setIsConfirmed] = React.useState<boolean>(false);
  const intl = useIntl();

  const onClose = () => {
    setChecked(false);
    setIsModalOpen(false);
  };

  const onConfirm = () => {
    setIsModalOpen(false);
    setIsConfirmed(true);
  };

  const header = (
    <React.Fragment>
      <Title ouiaId="enable-workspaces-modal-header" headingLevel="h1" size={TitleSizes['2xl']}>
        {intl.formatMessage(messages.enableWorkspacesWizardTitle)}
      </Title>
      <Text component={TextVariants.p} ouiaId="enable-workspaces-modal-description">
        {intl.formatMessage(messages.enableWorkspacesWizardDesc)}
      </Text>
    </React.Fragment>
  );

  const EnableWorkspacesModal = (
    <React.Fragment>
      <Modal
        variant={ModalVariant.large}
        header={header}
        aria-label={intl.formatMessage(messages.enableWorkspacesWizardTitle)}
        isOpen={isModalOpen}
        onClose={onClose}
        onEscapePress={onClose}
        actions={[
          <Button
            key="confirm"
            ouiaId="enable-workspace-modal-confirm-button"
            variant={ButtonVariant.primary}
            onClick={() => {
              onConfirm?.();
              setChecked(false);
            }}
            isDisabled={!checked}
          >
            {intl.formatMessage(messages.confirm)}
          </Button>,
          <Button key="cancel" ouiaId="enable-workspace-modal-cancel-button" variant={ButtonVariant.link} onClick={onClose}>
            {intl.formatMessage(messages.cancel)}
          </Button>,
        ]}
      >
        <Stack hasGutter>
          <StackItem>
            <span>{intl.formatMessage(messages.enableWorkspacesWizardBodyPart1)}</span>
          </StackItem>
          <StackItem>
            <span>
              <b>{intl.formatMessage(messages.enableWorkspacesWizardBodyPart2Header)}</b>{' '}
              {intl.formatMessage(messages.enableWorkspacesWizardBodyPart2)}
            </span>
          </StackItem>
          <StackItem>
            <span>
              <b>{intl.formatMessage(messages.enableWorkspacesWizardBodyPart3Header)}</b>{' '}
              {intl.formatMessage(messages.enableWorkspacesWizardBodyPart3)}
            </span>
          </StackItem>
          <StackItem>
            <Checkbox
              isChecked={checked}
              onChange={(_event, value) => setChecked(value)}
              label={intl.formatMessage(messages.enableWorkspacesWizardCheckboxLabel)}
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
          title={intl.formatMessage(messages.workspacesAlertTitle)}
          customIcon={<UsersIcon />}
          ouiaId="enable-workspaces-alert"
          className="enable-workspace-alert"
        >
          <Switch
            className="pf-v5-u-mt-xs"
            label={intl.formatMessage(messages.workspacesAlertSwitchLabel)}
            isChecked={isModalOpen || isConfirmed}
            ouiaId="enable-workspaces-switch"
            onChange={(_e, value) => setIsModalOpen(value)}
            id="enable-workspaces-switch"
          />
        </Alert>
      ) : (
        <Alert ouiaId="enable-workspaces-success-alert" variant="success" title={intl.formatMessage(messages.workspacesSuccessAlertTitle)}></Alert>
      )}
      {EnableWorkspacesModal}
    </div>
  );
};
