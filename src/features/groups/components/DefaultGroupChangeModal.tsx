import { Content } from '@patternfly/react-core/dist/dynamic/components/Content';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../../Messages';
import { getModalContainer } from '../../../helpers/modal-container';

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
      title={intl.formatMessage(messages.warning)}
      checkboxLabel={intl.formatMessage(messages.confirmCheckMessage)}
      confirmButtonLabel={intl.formatMessage(messages.continue)}
      onClose={onClose}
      onConfirm={onSubmit}
      appendTo={getModalContainer()}
    >
      <Content>
        <Content component="p">
          <FormattedMessage
            {...messages.defaultAccessGroupEditWarning}
            values={{
              b: (text) => <b>{text}</b>,
            }}
          />
        </Content>
      </Content>
    </WarningModal>
  );
};
