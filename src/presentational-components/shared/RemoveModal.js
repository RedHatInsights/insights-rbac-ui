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

const RemoveModal = ({ title, text, onClose, onSubmit, isOpen }) => {

  return (
    <Modal className="ins-c-rbac__dialog--warning"
      title={ title }
      isOpen={ isOpen }
      isSmall
      onClose={ onClose }
      actions={ [
        <Button
          key="confirm"
          variant="danger"
          onClick={ onSubmit }>
          { 'Remove role' }
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
        <SplitItem><ExclamationTriangleIcon size="xl" className="ins-m-alert ins-c-rbac__delete-icon" /></SplitItem>
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
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  isOpen: PropTypes.bool
};

export default RemoveModal;
