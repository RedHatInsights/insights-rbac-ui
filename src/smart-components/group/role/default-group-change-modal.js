import React from 'react';
import PropTypes from 'prop-types';
import { Text, TextContent } from '@patternfly/react-core';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../../Messages';

const DefaultGroupChange = ({ isOpen, onClose, onSubmit }) => {
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

DefaultGroupChange.propTypes = {
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  isOpen: PropTypes.bool,
};

export default DefaultGroupChange;
