import React, { useState } from 'react';
import PropTypes from 'prop-types';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { DefaultGroupChangeModal } from '../../components/DefaultGroupChangeModal';
import { ButtonVariant } from '@patternfly/react-core';

const RemoveRoles = ({ title, text, onClose, onSubmit, isOpen, confirmButtonLabel, isDefault, isChanged }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);

  return isDefault && !isChanged && showConfirmModal ? (
    <DefaultGroupChangeModal
      isOpen={showConfirmModal && isOpen}
      onClose={() => {
        onClose();
        setShowConfirmModal(false);
      }}
      onSubmit={onSubmit}
    />
  ) : (
    <WarningModal
      title={title}
      isOpen={isOpen}
      confirmButtonLabel={confirmButtonLabel}
      confirmButtonVariant={ButtonVariant.danger}
      onClose={onClose}
      onConfirm={() => {
        setShowConfirmModal(true);
        (!isDefault || isChanged) && onSubmit();
      }}
    >
      {text}
    </WarningModal>
  );
};

RemoveRoles.propTypes = {
  text: PropTypes.node,
  title: PropTypes.node,
  confirmButtonLabel: PropTypes.string,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  isOpen: PropTypes.bool,
  isDefault: PropTypes.bool,
  isChanged: PropTypes.bool,
};

RemoveRoles.defaultProps = {
  isDefault: false,
  isChanged: false,
};

export default RemoveRoles;
