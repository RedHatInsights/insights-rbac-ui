import React, { useState } from 'react';
import PropTypes from 'prop-types';

import DefaultGroupChange from './default-group-change-modal';
import RemoveModal from '../../../presentational-components/shared/RemoveModal';

const RemoveRoles = ({ title, text, onClose, onSubmit, isOpen, confirmButtonLabel, isDefault, isChanged }) => {
  const [ showConfirmModal, setShowConfirmModal ] = useState(true);

  return (isDefault && !isChanged && showConfirmModal
    ? <DefaultGroupChange
      isOpen={ showConfirmModal && isOpen }
      onClose={ () => {
        onClose();
      } }
      onSubmit={ () => {
        setShowConfirmModal(false);
      } }
    />
    : <RemoveModal
      text={ text }
      title={ title }
      isOpen={ isOpen }
      confirmButtonLabel={ confirmButtonLabel }
      onClose={ () => {
        onClose();
        setShowConfirmModal(true);
      } }
      onSubmit={ () => {
        onSubmit();

      } }
    />);
};

RemoveRoles.propTypes = {
  text: PropTypes.string,
  title: PropTypes.string,
  confirmButtonLabel: PropTypes.string,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  isOpen: PropTypes.bool,
  isDefault: PropTypes.bool,
  isChanged: PropTypes.bool
};

RemoveRoles.defaultProps = {
  isDefault: false,
  isChanged: false
};

export default RemoveRoles;
