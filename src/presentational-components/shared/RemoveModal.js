import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';

import {
  Button,
  Checkbox,
  Modal,
  ModalVariant,
  Split,
  SplitItem,
  Stack,
  TextContent
} from '@patternfly/react-core';

const RemoveModal = ({ title, text, onClose, onSubmit, isOpen, confirmButtonLabel, withCheckbox }) => {
  const [ checked, setChecked ] = useState(false);

  return (
    <Modal className="ins-c-rbac__dialog--warning"

      title={ <div> <ExclamationTriangleIcon className="ins-m-alert ins-c-rbac__delete-icon" /> { title } </div> }
      isOpen={ isOpen }
      variant={ ModalVariant.small }
      onClose={ onClose }
      actions={ [
        <Button
          key="confirm"
          isDisabled={ withCheckbox && !checked }
          variant="danger"
          onClick={ onSubmit }>
          { confirmButtonLabel }
        </Button>,
        <Button
          key="cancel"
          variant="link"
          onClick={ onClose }
        >
          Cancel
        </Button>
      ] }
      isFooterLeftAligned
    >
      <Split hasGutter>
        <SplitItem isFilled>
          <Stack hasGutter>
            <TextContent>
              { text }
            </TextContent>
          </Stack>

        </SplitItem>
      </Split>
      { withCheckbox
        ? <Checkbox
          isChecked={ checked }
          onChange={ () => setChecked(!checked) }
          label="I understand, and I want to continue."
          id="remove-modal-check"
          className="pf-u-mt-lg"
        />
        : null }
    </Modal>
  );
};

RemoveModal.propTypes = {
  text: PropTypes.string,
  title: PropTypes.string,
  confirmButtonLabel: PropTypes.string,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  isOpen: PropTypes.bool,
  withCheckbox: PropTypes.bool
};

RemoveModal.defaultProps = {
  withCheckbox: false
};

export default RemoveModal;
