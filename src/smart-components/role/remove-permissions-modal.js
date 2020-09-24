import React from 'react';
import PropTypes from 'prop-types';
import RemoveModal from '../../presentational-components/shared/RemoveModal';

const RemovePermissionsModal = ({ title, text, onClose, onSubmit, isOpen, confirmButtonLabel }) => (
  <RemoveModal text={text} title={title} isOpen={isOpen} confirmButtonLabel={confirmButtonLabel} onClose={onClose} onSubmit={onSubmit} />
);

RemovePermissionsModal.propTypes = {
  text: PropTypes.any,
  title: PropTypes.string,
  confirmButtonLabel: PropTypes.string,
  onSubmit: PropTypes.func,
  onClose: PropTypes.func,
  isOpen: PropTypes.bool,
};

export default RemovePermissionsModal;
