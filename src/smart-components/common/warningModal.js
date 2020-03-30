import React from 'react';
import PropTypes from 'prop-types';
import { Modal, Button } from '@patternfly/react-core';
import { ExclamationTriangleIcon } from '@patternfly/react-icons';
import './warningModal.scss';

export const WarningModal = ({ type, isOpen, onModalCancel, onConfirmCancel }) => (
  <Modal
    title={ <span className='ins-c-wizard__cancel-warning-header'>
        <ExclamationTriangleIcon size='md' className='ins-c-wizard__cancel-warning-header--icon'/>
        Exit { type } creation
      </span> }
    isSmall
    className='ins-c-wizard__cancel-warning'
    isOpen={ isOpen }
    onClose={ onModalCancel }
    actions={ [
      <Button key="confirm" variant="danger" onClick={ onConfirmCancel }>
        Yes, I want to exit
      </Button>,
      <Button key="cancel" variant="link" onClick={ onModalCancel }>
        No, I want to continue
      </Button>
    ] }
    isFooterLeftAligned>
    <span> Are you sure you want to stop creating a { type } in user access? </span>
    <span> All inputs will be discarded.</span>
  </Modal>
);

WarningModal.propTypes = {
  type: PropTypes.string,
  isOpen: PropTypes.bool,
  onModalCancel: PropTypes.func,
  onConfirmCancel: PropTypes.func
};
