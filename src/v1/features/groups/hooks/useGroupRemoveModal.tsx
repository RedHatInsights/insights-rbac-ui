/**
 * Simple confirmation modal hook for removing items from groups.
 *
 * This hook is specific to the Groups feature and handles all the
 * intl/copy internally. The only customization is the item names
 * and the confirmation callback.
 */

import React, { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, defineMessages, useIntl } from 'react-intl';
import { useAddNotification } from '@redhat-cloud-services/frontend-components-notifications/hooks';
import { commonMessages } from '../../../../shared/messages/common';

const messages = defineMessages({
  removeRoleQuestion: { id: 'removeRoleQuestion', defaultMessage: 'Remove role?', description: 'Remove role question label' },
  removeRolesQuestion: { id: 'removeRolesQuestion', defaultMessage: 'Remove roles?', description: 'Remove roles question label' },
  removeRoleModalText: {
    id: 'removeRoleModalText',
    defaultMessage: 'Role <b>{role}</b> will be removed from the group <b>{name}</b>. This action cannot be undone.',
    description: 'Remove role message warning about irreversible action',
  },
  removeRolesModalText: {
    id: 'removeRolesModalText',
    defaultMessage: '<b>{roles}</b> selected roles will be removed from the group <b>{name}</b>. This action cannot be undone.',
    description: 'Remove roles message warning about irreversible action',
  },
  removeRole: { id: 'removeRole', defaultMessage: 'Remove role', description: 'Remove role label' },
  removeRoles: { id: 'removeRoles', defaultMessage: 'Remove roles', description: 'Remove roles label' },
  removeMemberQuestion: { id: 'removeMemberQuestion', defaultMessage: 'Remove member?', description: 'Remove member question' },
  removeMembersQuestion: { id: 'removeMembersQuestion', defaultMessage: 'Remove members?', description: 'Remove members question' },
  removeMemberText: {
    id: 'removeMemberText',
    defaultMessage: 'Member <b>{name}</b> will be removed from the group <b>{group}</b>. This action cannot be undone.',
    description: 'Remove member text warning about irreversible action',
  },
  removeMembersText: {
    id: 'removeMembersText',
    defaultMessage: '<b>{name}</b> selected members will be removed from the group <b>{group}</b>. This action cannot be undone.',
    description: 'Remove members plural text warning about irreversible action',
  },
  removeMember: { id: 'removeMember', defaultMessage: 'Remove member', description: 'Remove member' },
});

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
    pluralConfirmLabel: commonMessages.remove,
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
          title: intl.formatMessage({
            id: 'itemAlreadyRemovedTitle',
            defaultMessage: 'Item already removed',
            description: 'Title for notification when item was already removed (race condition)',
          }),
          description: intl.formatMessage({
            id: 'itemAlreadyRemovedDescription',
            defaultMessage: 'One or more items were already removed by another user. The list has been refreshed.',
            description: 'Description for notification when item was already removed (race condition)',
          }),
          dismissable: true,
        });
      } else if (isForbiddenError(error)) {
        addNotification({
          variant: 'danger',
          title: intl.formatMessage({
            id: 'insufficientPermissionsTitle',
            defaultMessage: 'Insufficient permissions',
            description: 'Title for notification when user lacks permission',
          }),
          description: intl.formatMessage({
            id: 'insufficientPermissionsDescription',
            defaultMessage: 'You do not have permission to perform this action. Please contact your administrator.',
            description: 'Description for notification when user lacks permission',
          }),
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
