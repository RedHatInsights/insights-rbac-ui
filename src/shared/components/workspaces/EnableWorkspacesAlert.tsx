import React from 'react';
import UsersIcon from '@patternfly/react-icons/dist/js/icons/users-icon';
import { Alert } from '@patternfly/react-core/dist/dynamic/components/Alert';
import { Button } from '@patternfly/react-core/dist/dynamic/components/Button';
import { ButtonVariant } from '@patternfly/react-core/dist/dynamic/components/Button';
import { TitleSizes } from '@patternfly/react-core/dist/dynamic/components/Title';
import { Stack, StackItem } from '@patternfly/react-core/dist/dynamic/layouts/Stack';
import { Checkbox } from '@patternfly/react-core/dist/dynamic/components/Checkbox';
import { Modal } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { ModalVariant } from '@patternfly/react-core/dist/dynamic/deprecated/components/Modal';
import { Switch } from '@patternfly/react-core/dist/dynamic/components/Switch';
import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import { ContentVariants } from '@patternfly/react-core/dist/dynamic/components/Content';
import { Title } from '@patternfly/react-core/dist/dynamic/components/Title';
import { useIntl } from 'react-intl';

import { getModalContainer } from '../../helpers/modal-container';
import { commonMessages } from '../../messages/common';

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
        {intl.formatMessage({
          id: 'enableWorkspacesWizardTitle',
          defaultMessage: 'Enable workspaces',
          description: 'Title for Enable Workspaces wizard',
        })}
      </Title>
      <Content component={ContentVariants.p} ouiaId="enable-workspaces-modal-description">
        {intl.formatMessage({
          id: 'enableWorkspacesWizardDesc',
          defaultMessage: 'Enable "workspaces" for your organization to enhance access management (assets, roles, users, groups, etc.)',
          description: 'Description for Enable Workspaces wizard',
        })}
      </Content>
    </React.Fragment>
  );

  const EnableWorkspacesModal = (
    <React.Fragment>
      <Modal
        appendTo={getModalContainer()}
        variant={ModalVariant.large}
        header={header}
        aria-label={intl.formatMessage({
          id: 'enableWorkspacesWizardTitle',
          defaultMessage: 'Enable workspaces',
          description: 'Title for Enable Workspaces wizard',
        })}
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
            {intl.formatMessage({ id: 'confirm', defaultMessage: 'Confirm', description: 'Confirm button text' })}
          </Button>,
          <Button key="cancel" ouiaId="enable-workspace-modal-cancel-button" variant={ButtonVariant.link} onClick={onClose}>
            {intl.formatMessage(commonMessages.cancel)}
          </Button>,
        ]}
      >
        <Stack hasGutter>
          <StackItem>
            <span>
              {intl.formatMessage({
                id: 'enableWorkspacesWizardBodyPart1',
                defaultMessage:
                  'Securely manage user access and organize assets within your organization using workspaces. Implement granular access controls to streamline       permission management and ensure efficient, secure access to resources. View assets and roles organization diagram.',
                description: 'First part of the Enable Workspaces wizard body',
              })}
            </span>
          </StackItem>
          <StackItem>
            <span>
              <b>
                {intl.formatMessage({
                  id: 'enableWorkspacesWizardBodyPart2Header',
                  defaultMessage: 'Workspaces: ',
                  description: 'Header for second part of the Enable Workspaces wizard body',
                })}
              </b>{' '}
              {intl.formatMessage({
                id: 'enableWorkspacesWizardBodyPart2',
                defaultMessage:
                  'Configure workspaces to fit your organizational structure. They can be structured in a hierarchy (parent-child          relationships). Permissions assigned to a parent workspace are automatically inherited by its child workspaces, saving you configuration          time. Learn more about workspace hierarchy and use cases for them in your organization.',
                description: 'Second part of the Enable Workspaces wizard body',
              })}
            </span>
          </StackItem>
          <StackItem>
            <span>
              <b>
                {intl.formatMessage({
                  id: 'enableWorkspacesWizardBodyPart3Header',
                  defaultMessage: 'Groups, roles, and role bindings: ',
                  description: 'Header for third part of the Enable Workspaces wizard body',
                })}
              </b>{' '}
              {intl.formatMessage({
                id: 'enableWorkspacesWizardBodyPart3',
                defaultMessage:
                  "Create user groups of both end users and service accounts. Tailor these groups to mirror your          organization's structure. Explore predefined roles to see if they fit your needs. If not, create custom roles with specific          permissions. Grant access to your workspaces. This connects roles and user groups to specific workspaces. These bindings determine who can          access what, and the actions they're allowed to perform. Learn more about access management.",
                description: 'Third part of the Enable Workspaces wizard body',
              })}
            </span>
          </StackItem>
          <StackItem>
            <Checkbox
              isChecked={checked}
              onChange={(_event, value) => setChecked(value)}
              label={intl.formatMessage({
                id: 'enableWorkspacesWizardCheckboxLabel',
                defaultMessage: 'By checking this box, I acknowledge that this action cannot be undone.',
                description: 'Checkbox label for Enable Workspaces wizard',
              })}
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
          title={intl.formatMessage({
            id: 'workspacesAlertTitle',
            defaultMessage: 'You are qualified to opt into the workspace user access model for your organization.',
            description: 'Title for workspaces alert on overview page',
          })}
          customIcon={<UsersIcon />}
          ouiaId="enable-workspaces-alert"
          className="enable-workspace-alert"
        >
          <Switch
            className="pf-v6-u-mt-xs"
            label={intl.formatMessage({ id: 'workspacesAlertSwitchLabel', defaultMessage: 'Enable workspaces', description: 'Enable workspaces' })}
            isChecked={isModalOpen || isConfirmed}
            ouiaId="enable-workspaces-switch"
            onChange={(_e, value) => setIsModalOpen(value)}
            id="enable-workspaces-switch"
          />
        </Alert>
      ) : (
        <Alert
          ouiaId="enable-workspaces-success-alert"
          variant="success"
          title={intl.formatMessage({
            id: 'workspacesSuccessAlertTitle',
            defaultMessage: 'Your workspace migration is complete and ready to manage!',
            description: 'Title for success alert for workspaces enablement',
          })}
        ></Alert>
      )}
      {EnableWorkspacesModal}
    </div>
  );
};
