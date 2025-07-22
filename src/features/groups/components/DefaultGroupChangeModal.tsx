import { Text, TextContent } from '@patternfly/react-core/dist/dynamic/components/Text';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import React from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../../Messages';

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
    >
      <TextContent>
        <Text>
          <FormattedMessage
            {...messages.defaultAccessGroupEditWarning}
            values={{
              b: (text) => <b>{text}</b>,
            }}
          />
        </Text>
      </TextContent>
    </WarningModal>
  );
};
