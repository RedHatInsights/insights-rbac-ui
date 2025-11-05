import React, { useState } from 'react';
import WarningModal from '@patternfly/react-component-groups/dist/dynamic/WarningModal';
import { DefaultGroupChangeModal } from '../../components/DefaultGroupChangeModal';
import { ButtonVariant } from '@patternfly/react-core';
import { getModalContainer } from '../../../../helpers/modal-container';

interface RemoveRolesProps {
  title: React.ReactNode;
  text: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  isOpen: boolean;
  confirmButtonLabel: string;
  isDefault?: boolean;
  isChanged?: boolean;
}

export const RemoveRoleModal: React.FC<RemoveRolesProps> = ({
  title,
  text,
  onClose,
  onSubmit,
  isOpen,
  confirmButtonLabel,
  isDefault = false,
  isChanged = false,
}) => {
  const [showConfirmModal, setShowConfirmModal] = useState<boolean>(false);

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
      appendTo={getModalContainer()}
    >
      {text}
    </WarningModal>
  );
};
