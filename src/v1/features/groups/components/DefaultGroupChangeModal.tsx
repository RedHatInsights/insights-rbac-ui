import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';

import { getModalContainer } from '../../../../shared/helpers/modal-container';

interface DefaultGroupChangeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: () => void;
}

export const DefaultGroupChangeModal: React.FC<DefaultGroupChangeModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const intl = useIntl();
  return (
    <WarningModal
      withCheckbox
      isOpen={isOpen}
      title={intl.formatMessage({ id: 'warning', defaultMessage: 'Warning', description: 'Waring label' })}
      checkboxLabel={intl.formatMessage({
        id: 'confirmCheckMessage',
        defaultMessage: 'I understand, and I want to continue',
        description: 'Confirm modal check message',
      })}
      confirmButtonLabel={intl.formatMessage({ id: 'continue', defaultMessage: 'Continue', description: 'Continue label' })}
      onClose={onClose}
      onConfirm={onSubmit}
      appendTo={getModalContainer()}
    >
      <Content>
        <Content component="p">
          <FormattedMessage
            id={'defaultAccessGroupEditWarning'}
            defaultMessage={
              'Once you edit the <b>Default access</b> group, the system will no longer update it with new default access roles. The group name will change to <b>Custom default access</b>.'
            }
            description={'Message warning that editing a Default access group will rename it'}
            values={{
              b: (text) => <b>{text}</b>,
            }}
          />
        </Content>
      </Content>
    </WarningModal>
  );
};
