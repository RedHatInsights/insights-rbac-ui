import React from 'react';
import PropTypes from 'prop-types';
import { Text, TextContent } from '@patternfly/react-core';
import RemoveModal from '../../../presentational-components/shared/RemoveModal';
import { FormattedMessage, useIntl } from 'react-intl';
import messages from '../../../Messages';

const DefaultGroupChange = ({ isOpen, onClose, onSubmit }) => {
  const intl = useIntl();
  return (
    <RemoveModal
      text={
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
      }
      title={intl.formatMessage(messages.warning)}
      withCheckbox
      isOpen={isOpen}
      confirmButtonLabel={intl.formatMessage(messages.continue)}
      onClose={onClose}
      onSubmit={onSubmit}
    />
  );
};

DefaultGroupChange.propTypes = {
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  isOpen: PropTypes.bool,
};

export default DefaultGroupChange;
