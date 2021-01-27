import React, { useState } from 'react';
import PropTypes from 'prop-types';
import DefaultGroupChange from './default-group-change-modal';
import RemoveModal from '../../../presentational-components/shared/RemoveModal';

const RemoveRoles = ({ title, text, onClose, onSubmit, isOpen, confirmButtonLabel, isDefault, isChanged }) => {
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  console.log(isDefault, isChanged, showConfirmModal);

  return isDefault && !isChanged && showConfirmModal ? (
    <DefaultGroupChange
      isOpen={showConfirmModal && isOpen}
      onClose={() => {
        onClose();
        setShowConfirmModal(false);
      }}
      onSubmit={() => {
        onSubmit();
      }}
    />
  ) : (
    <RemoveModal
      text={text}
      title={title}
      isOpen={isOpen}
      confirmButtonLabel={confirmButtonLabel}
      onClose={() => {
        onClose();
      }}
      onSubmit={() => {
        setShowConfirmModal(true);
        (!isDefault || isChanged) && onSubmit();
      }}
    />
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
