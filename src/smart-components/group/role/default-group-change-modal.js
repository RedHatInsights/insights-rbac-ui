import React from 'react';
import PropTypes from 'prop-types';
import { Text, TextContent } from '@patternfly/react-core';

import RemoveModal from '../../../presentational-components/shared/RemoveModal';

const DefaultGroupChange = ({ isOpen, onClose, onSubmit }) => {
  return (<RemoveModal
    text={ <TextContent>
        <Text>
          Once you edit the <b>Default user access</b> group, the system will no longer update it with new default access roles.
              The group name will change to <b>Custom default user access</b>.
        </Text>
      </TextContent> }
    title={ 'Warning' }
    withCheckbox
    isOpen={ isOpen }
    confirmButtonLabel={ 'Continue' }
    onClose={ onClose }
    onSubmit={ onSubmit }
  />);
};

DefaultGroupChange.propTypes = {
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  isOpen: PropTypes.bool
};

export default DefaultGroupChange;

