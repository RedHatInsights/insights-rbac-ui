/**
 * Simple confirmation modal hook for removing items from groups.
 *
 * This hook is specific to the Groups feature and handles all the
 * intl/copy internally. The only customization is the item names
 * and the confirmation callback.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import messages from '../../../Messages';

type ItemType = 'role' | 'member';

interface UseGroupRemoveModalConfig {
  /** Type of item being removed */
  itemType: ItemType;
  /** Name of the group items are being removed from */
  groupName: string;
  /** Callback when user confirms removal */
  onConfirm: () => Promise<void>;
}

interface UseGroupRemoveModalReturn {
  /** Open the modal with the specified item names */
  openModal: (names: string[]) => void;
  /** Close the modal */
  closeModal: () => void;
  /** Modal state for rendering */
  modalState: {
    isOpen: boolean;
    title: string;
    text: React.ReactNode;
    confirmButtonLabel: string;
    onClose: () => void;
    onConfirm: () => Promise<void>;
  };
  /** Whether confirmation is in progress */
  isLoading: boolean;
  /** Names of items currently selected for removal */
  names: string[];
}

// Message configs per item type
const messageConfig = {
  role: {
    singularTitle: messages.removeRoleQuestion,
    pluralTitle: messages.removeRolesQuestion,
    singularBody: messages.removeRoleModalText,
    pluralBody: messages.removeRolesModalText,
    singularConfirmLabel: messages.removeRole,
    pluralConfirmLabel: messages.removeRoles,
    // Message value keys for this item type
    itemKey: 'role',
    countKey: 'roles',
  },
  member: {
    singularTitle: messages.removeMemberQuestion,
    pluralTitle: messages.removeMembersQuestion,
    singularBody: messages.removeMemberText,
    pluralBody: messages.removeMembersText,
    singularConfirmLabel: messages.removeMember,
    pluralConfirmLabel: messages.remove,
    // Message value keys for this item type
    itemKey: 'name',
    countKey: 'name',
  },
} as const;

/**
 * Error response structure from API
 */
interface ApiError {
  response?: { status?: number };
  status?: number;
}

function isNotFoundError(error: unknown): boolean {
  const e = error as ApiError;
  return e?.response?.status === 404 || e?.status === 404;
}

function isForbiddenError(error: unknown): boolean {
  const e = error as ApiError;
  return e?.response?.status === 403 || e?.status === 403;
}

/**
 * Hook for managing a confirmation modal when removing items from a group.
 *
 * @example
 * ```tsx
 * const removeModal = useGroupRemoveModal({
 *   itemType: 'role',
 *   groupName: group?.name || '',
 *   onConfirm: async () => {
 *     await dispatch(removeRolesFromGroup(groupId, roleIds));
 *     fetchData();
 *   },
 * });
 *
 * // To trigger removal:
 * removeModal.openModal(['Admin Role', 'User Role']);
 *
 * // In render:
 * <WarningModal {...removeModal.modalState} />
 * ```
 */
export function useGroupRemoveModal(config: UseGroupRemoveModalConfig): UseGroupRemoveModalReturn {
  const { itemType, groupName, onConfirm } = config;

  const intl = useIntl();
  const addNotification = useAddNotification();

  const [isOpen, setIsOpen] = useState(false);
  const [names, setNames] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const openModal = useCallback((itemNames: string[]) => {
    setNames(itemNames);
    setIsOpen(true);
  }, []);

  const closeModal = useCallback(() => {
    setIsOpen(false);
    setNames([]);
  }, []);

  const handleConfirm = useCallback(async () => {
    if (!names.length) return;

    setIsLoading(true);
    try {
      await onConfirm();
      closeModal();
    } catch (error) {
      if (isNotFoundError(error)) {
        addNotification({
          variant: 'warning',
          title: intl.formatMessage(messages.itemAlreadyRemovedTitle),
          description: intl.formatMessage(messages.itemAlreadyRemovedDescription),
          dismissable: true,
        });
      } else if (isForbiddenError(error)) {
        addNotification({
          variant: 'danger',
          title: intl.formatMessage(messages.insufficientPermissionsTitle),
          description: intl.formatMessage(messages.insufficientPermissionsDescription),
          dismissable: true,
        });
      }
      closeModal();
    } finally {
      setIsLoading(false);
    }
  }, [names, onConfirm, closeModal, addNotification, intl]);

  const modalState = useMemo(() => {
    const isSingular = names.length === 1;
    const cfg = messageConfig[itemType];
    const itemLabel = names.join(', ');

    const messageValues: Record<string, unknown> = {
      b: (text: React.ReactNode) => <b>{text}</b>,
      name: groupName, // group name for roles, member name for members (singular)
      group: groupName, // used in member messages
    };

    // Add item-specific value
    if (isSingular) {
      messageValues[cfg.itemKey] = itemLabel;
    } else {
      messageValues[cfg.countKey] = names.length;
    }

    return {
      isOpen,
      title: intl.formatMessage(isSingular ? cfg.singularTitle : cfg.pluralTitle),
      text: <FormattedMessage {...(isSingular ? cfg.singularBody : cfg.pluralBody)} values={messageValues as Record<string, React.ReactNode>} />,
      confirmButtonLabel: intl.formatMessage(isSingular ? cfg.singularConfirmLabel : cfg.pluralConfirmLabel),
      onClose: closeModal,
      onConfirm: handleConfirm,
    };
  }, [isOpen, names, itemType, groupName, intl, closeModal, handleConfirm]);

  return {
    openModal,
    closeModal,
    modalState,
    isLoading,
    names,
  };
}

export default useGroupRemoveModal;
