import React from 'react';
import PropTypes from 'prop-types';
import { Modal, ModalVariant, Button } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import './warningModal.scss';

export const WarningModal = ({ type, isOpen, onModalCancel, onConfirmCancel, customTitle, customDescription }) => (
  <Modal
    title={
      <span className="ins-c-wizard__cancel-warning-header">
        <ExclamationTriangleIcon size="md" className="ins-c-wizard__cancel-warning-header--icon" />
        {customTitle || `Exit ${type} creation?`}
      </span>
    }
    variant={ModalVariant.small}
    className="ins-c-wizard__cancel-warning"
    isOpen={isOpen}
    onClose={onModalCancel}
    actions={[
      <Button ouiaId="primary-exit-button" key="confirm" variant="primary" onClick={onConfirmCancel}>
        Exit
      </Button>,
      <Button ouiaId="secondary-cancel-button" key="cancel" variant="link" onClick={onModalCancel}>
        Stay
      </Button>,
    ]}
  >
    <span>{customDescription || 'All inputs will be discarded.'} </span>
  </Modal>
);

WarningModal.propTypes = {
  type: PropTypes.string,
  customTitle: PropTypes.node,
  customDescription: PropTypes.node,
  isOpen: PropTypes.bool,
  onModalCancel: PropTypes.func,
  onConfirmCancel: PropTypes.func,
};
