import React from 'react';
import { useIntl } from 'react-intl';
import { ButtonVariant } from '@patternfly/react-core';
import { List } from '@patternfly/react-core/dist/dynamic/components/List';
import { ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import { WarningModal } from '@patternfly/react-component-groups';
import messages from '../../../../../Messages';

interface BulkDeactivateUsersModalProps {
  isOpen: boolean;
  usernames: string[];
  onClose: () => void;
  onConfirm: () => void;
  ouiaId?: string;
}

export const BulkDeactivateUsersModal: React.FC<BulkDeactivateUsersModalProps> = ({
  isOpen,
  usernames,
  onClose,
  onConfirm,
  ouiaId = 'bulk-deactivate-users-modal',
}) => {
  const intl = useIntl();

  return (
    <WarningModal
      ouiaId={ouiaId}
      isOpen={isOpen}
      title={intl.formatMessage(messages.deactivateUsersConfirmationModalTitle)}
      confirmButtonLabel={intl.formatMessage(messages.deactivateUsersConfirmationButton)}
      confirmButtonVariant={ButtonVariant.danger}
      onClose={onClose}
      onConfirm={onConfirm}
      withCheckbox
      checkboxLabel={intl.formatMessage(messages.deactivateUsersConfirmationModalCheckboxText)}
    >
      {intl.formatMessage(messages.deactivateUsersConfirmationModalDescription)}
      <List isPlain isBordered className="pf-u-p-md">
        {usernames.map((username, index) => (
          <ListItem key={index}>{username}</ListItem>
        ))}
      </List>
    </WarningModal>
  );
};
