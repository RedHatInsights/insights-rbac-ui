import React from 'react';
import { useIntl } from 'react-intl';
import { ButtonVariant } from '@patternfly/react-core/dist/dynamic/components/Button';
import { List } from '@patternfly/react-core/dist/dynamic/components/List';
import { ListItem } from '@patternfly/react-core/dist/dynamic/components/List';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';

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
      title={intl.formatMessage({
        id: 'deactivateUsersConfirmationModalTitle',
        defaultMessage: 'Deactivate users',
        description: 'deactivate users confirmation modal title text',
      })}
      confirmButtonLabel={intl.formatMessage({
        id: 'deactivateUsersConfirmationButton',
        defaultMessage: 'Deactivate user(s)',
        description: 'deactivate users confirmation button text',
      })}
      confirmButtonVariant={ButtonVariant.danger}
      onClose={onClose}
      onConfirm={onConfirm}
      withCheckbox
      checkboxLabel={intl.formatMessage({
        id: 'deactivateUsersConfirmationModalCheckboxText',
        defaultMessage: 'Yes, I confirm that I want to deactivate these users',
        description: 'deactivate users confirmation modal checkbox text',
      })}
    >
      {intl.formatMessage({
        id: 'deactivateUsersConfirmationModalDescription',
        defaultMessage: 'Are you sure you want to deactivate the user(s) below from your Red Hat organization?',
        description: 'deactivate users confirmation modal description text',
      })}
      <List isPlain isBordered className="pf-u-p-md">
        {usernames.map((username, index) => (
          <ListItem key={index}>{username}</ListItem>
        ))}
      </List>
    </WarningModal>
  );
};
