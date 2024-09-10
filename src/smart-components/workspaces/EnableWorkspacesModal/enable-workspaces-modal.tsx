import React, { useState } from 'react';
import { Button, ButtonVariant, Checkbox, Modal, ModalVariant, Title, TitleSizes } from '@patternfly/react-core';
import { useIntl } from 'react-intl';
import Messages from '../../../Messages';

export interface EnableWorkspacesModalProps {
  isModalOpen: boolean;
  onClose: (_event: KeyboardEvent | React.MouseEvent) => void;
  onConfirm: () => void;
}

const EnableWorkspacesModal = ({ isModalOpen, onClose, onConfirm }: EnableWorkspacesModalProps) => {
  const [checked, setChecked] = useState(false);
  const [isOpen, setIsOpen] = useState(isModalOpen);
  const intl = useIntl();

  const checkboxLabel: string = 'By checking this box, I acknowledge that this action cannot be undone.';

  const header = (
    <React.Fragment>
      <Title id="enable-workspaces-modal-header" headingLevel="h1" size={TitleSizes['2xl']}>
        {intl.formatMessage(Messages.enableWorkspacesWizardTitle)}
      </Title>
      <p>{intl.formatMessage(Messages.enableWorkspacesWizardDesc)}</p>
    </React.Fragment>
  );

  return (
    /* eslint-disable react/no-children-prop */
    <React.Fragment>
      <Modal
        variant={ModalVariant.large}
        header={header}
        isOpen={isModalOpen}
        onClose={onClose}
        onEscapePress={onClose}
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
          <Button key="cancel" variant={ButtonVariant.link} onClick={onClose}>
            Cancel
          </Button>,
        ]}
      >
        <span>
          Securely manage user access and organize assets wtihin your organization using workspaces. Implement granular access controls to streamline
          permission management and ensure efficient, secure access to resources. View assets and roles organization diagram.
        </span>
        <br />
        <br />
        <span>
          <b>Workspaces: </b> Configure workspaces to fit your organizational structure. They can be structured in a hierarchy (parent-child
          relationships). Permissions assigned to a parent workspace are automatically inherited by its child workspaces, saving you configuration
          time. Learn more about workspace hierarchy and use cases for them in your organziation.
        </span>
        <br />
        <br />
        <span>
          <b>Groups, roles, and role bindings: </b> Create user groups of both end users and service accounts. Tailor these groups to mirror your
          organization`&apos;`s structure. Explore predefined roles to see if they fit your needs. If not, create custom roles with specific
          permissions. Grant access to your workspaces. This connects roles and user groups to specific workspaces. These bindings dtermine who can
          access what, adn the actions they`&apos;`re allowed to perform. Learn more about access managment.
        </span>

        <Checkbox isChecked={checked} onChange={(_event, value) => setChecked(value)} label={checkboxLabel} id="enable-workspace-checkbox" />
      </Modal>
    </React.Fragment>
  );
};

export default EnableWorkspacesModal;
