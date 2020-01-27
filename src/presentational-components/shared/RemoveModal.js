import React from 'react';
import PropTypes from 'prop-types';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';

import {
  Modal,
  Button,
  Split,
  SplitItem,
  Stack,
  TextContent
} from '@patternfly/react-core';

const RemoveModal = ({ title, text, onClose, onSubmit, isOpen, confirmButtonLabel }) => {

  return (
    <Modal className="ins-c-rbac__dialog--warning"

      title={ <div> <ExclamationTriangleIcon className="ins-m-alert ins-c-rbac__delete-icon" /> { `${title}` } </div> }
      isOpen={ isOpen }
      isSmall
      onClose={ onClose }
      actions={ [
        <Button
          key="confirm"
          variant="danger"
          onClick={ onSubmit }>
          { confirmButtonLabel }
        </Button>,
        <Button
          key="cancel"
          variant="link"
          onClick={ onClose }
        >
          { 'Cancel' }
        </Button>
      ] }
      isFooterLeftAligned
    >
      <Split gutter="md">
        <SplitItem isFilled>
          <Stack gutter="md">
            <TextContent>
              { text }
            </TextContent>
          </Stack>
        </SplitItem>
      </Split>
    </Modal>
  );
};

RemoveModal.propTypes = {
  text: PropTypes.string,
  title: PropTypes.string,
  confirmButtonLabel: PropTypes.string,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  isOpen: PropTypes.bool
};

export default RemoveModal;
