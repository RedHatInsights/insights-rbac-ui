/**
 * Generic hook for managing confirmation modal state for removing/deleting items.
 *
 * This hook centralizes the common pattern of:
 * - Managing modal open/close state
 * - Tracking items selected for removal
 * - Providing singular/plural text based on selection count
 * - Handling confirmation with error handling for race conditions and permissions
 */

import React, { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, MessageDescriptor, useIntl } from 'react-intl';
import { useDispatch } from 'react-redux';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';
import messages from '../Messages';

/**
 * Error response structure from API
 */
interface ApiError {
  response?: {
    status?: number;
  };
  status?: number;
}

/**
 * Configuration for the confirmation modal hook
 */
export interface UseConfirmItemsModalConfig<T> {
  /**
   * Callback to execute when user confirms the action.
   * Should return a Promise that resolves on success or rejects on error.
   */
  onConfirm: (items: T[]) => Promise<void>;

  /**
   * Message descriptor for singular item title (e.g., "Remove role?")
   */
  singularTitle: MessageDescriptor;

  /**
   * Message descriptor for plural items title (e.g., "Remove roles?")
   */
  pluralTitle: MessageDescriptor;

  /**
   * Message descriptor for singular item body text
   */
  singularBody: MessageDescriptor;

  /**
   * Message descriptor for plural items body text
   */
  pluralBody: MessageDescriptor;

  /**
   * Message descriptor for confirm button label (singular)
   */
  singularConfirmLabel: MessageDescriptor;

  /**
   * Message descriptor for confirm button label (plural)
   */
  pluralConfirmLabel: MessageDescriptor;

  /**
   * Function to get display label for an item (used in modal body)
   */
  getItemLabel: (item: T) => string;

  /**
   * Extra values to pass to FormattedMessage (e.g., { group: groupName })
   */
  extraValues?: Record<string, string | number>;

  /**
   * Optional callback called after modal closes (success or cancel)
   */
  onClose?: () => void;

  /**
   * Key name for the item in message values (default: 'name')
   * For roles, you might want 'role', for members 'name'
   */
  itemValueKey?: string;

  /**
   * Key name for count in plural messages (default: 'count' for roles, 'name' for members)
   * This handles the different patterns in existing messages
   */
  countValueKey?: string;
}

/**
 * Return type for the confirmation modal hook
 */
export interface UseConfirmItemsModalReturn<T> {
  /**
   * Open the modal with the specified items
   */
  openModal: (items: T[]) => void;

  /**
   * Close the modal without confirming
   */
  closeModal: () => void;

  /**
   * Execute the confirmation action
   */
  confirmAction: () => Promise<void>;

  /**
   * Items currently selected for removal
   */
  itemsToRemove: T[];

  /**
   * Modal state for rendering
   */
  modalState: {
    isOpen: boolean;
    title: string;
    text: React.ReactNode;
    confirmButtonLabel: string;
    onClose: () => void;
    onConfirm: () => Promise<void>;
  };

  /**
   * Whether the confirm action is in progress
   */
  isLoading: boolean;
}

/**
 * Checks if an error is a 404 Not Found error
 */
function isNotFoundError(error: unknown): boolean {
  const apiError = error as ApiError;
  return apiError?.response?.status === 404 || apiError?.status === 404;
}

/**
 * Checks if an error is a 403 Forbidden error
 */
function isForbiddenError(error: unknown): boolean {
  const apiError = error as ApiError;
  return apiError?.response?.status === 403 || apiError?.status === 403;
}

/**
 * Generic hook for managing confirmation modal state for item removal.
 *
 * @example
 * ```tsx
 * const { openModal, modalState } = useConfirmItemsModal<Role>({
 *   onConfirm: async (roles) => {
 *     await dispatch(removeRolesFromGroup(groupId, roles.map(r => r.uuid)));
 *     selection.onSelect(false);
 *     fetchData();
 *   },
 *   singularTitle: messages.removeRoleQuestion,
 *   pluralTitle: messages.removeRolesQuestion,
 *   singularBody: messages.removeRoleModalText,
 *   pluralBody: messages.removeRolesModalText,
 *   singularConfirmLabel: messages.removeRole,
 *   pluralConfirmLabel: messages.removeRoles,
 *   getItemLabel: (role) => role.display_name || role.name,
 *   extraValues: { name: group?.name || '' },
 *   itemValueKey: 'role',
 *   countValueKey: 'roles',
 * });
 * ```
 */
export function useConfirmItemsModal<T>(config: UseConfirmItemsModalConfig<T>): UseConfirmItemsModalReturn<T> {
  const {
    onConfirm,
    singularTitle,
    pluralTitle,
    singularBody,
    pluralBody,
    singularConfirmLabel,
    pluralConfirmLabel,
    getItemLabel,
    extraValues = {},
    onClose: onCloseCallback,
    itemValueKey = 'name',
    countValueKey = 'name',
  } = config;

  const intl = useIntl();
  const dispatch = useDispatch();

  // State
  const [isOpen, setIsOpen] = useState(false);
  const [itemsToRemove, setItemsToRemove] = useState<T[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  // Open modal with items
  const openModal = useCallback((items: T[]) => {
    setItemsToRemove(items);
    setIsOpen(true);
  }, []);

  // Close modal
  const closeModal = useCallback(() => {
    setIsOpen(false);
    setItemsToRemove([]);
    onCloseCallback?.();
  }, [onCloseCallback]);

  // Confirm action with error handling
  const confirmAction = useCallback(async () => {
    if (itemsToRemove.length === 0) return;

    setIsLoading(true);
    try {
      await onConfirm(itemsToRemove);
      closeModal();
    } catch (error) {
      // Handle specific error cases with user-friendly messages
      if (isNotFoundError(error)) {
        dispatch(
          addNotification({
            variant: 'warning',
            title: intl.formatMessage(messages.itemAlreadyRemovedTitle),
            description: intl.formatMessage(messages.itemAlreadyRemovedDescription),
            dismissable: true,
          }),
        );
      } else if (isForbiddenError(error)) {
        dispatch(
          addNotification({
            variant: 'danger',
            title: intl.formatMessage(messages.insufficientPermissionsTitle),
            description: intl.formatMessage(messages.insufficientPermissionsDescription),
            dismissable: true,
          }),
        );
      }
      // Note: Other errors are handled by redux middleware notifications
      // We still close the modal on error to avoid stuck state
      closeModal();
    } finally {
      setIsLoading(false);
    }
  }, [onConfirm, itemsToRemove, closeModal, dispatch, intl]);

  // Compute modal state with singular/plural logic
  const modalState = useMemo(() => {
    const isSingular = itemsToRemove.length === 1;
    const itemLabels = itemsToRemove.map(getItemLabel).join(', ');

    // Build values for FormattedMessage
    const messageValues: Record<string, unknown> = {
      b: (text: React.ReactNode) => <b>{text}</b>,
      ...extraValues,
    };

    // Add item-specific values
    if (isSingular) {
      messageValues[itemValueKey] = itemLabels;
    } else {
      messageValues[countValueKey] = itemsToRemove.length;
    }

    return {
      isOpen,
      title: intl.formatMessage(isSingular ? singularTitle : pluralTitle),
      text: <FormattedMessage {...(isSingular ? singularBody : pluralBody)} values={messageValues as Record<string, React.ReactNode>} />,
      confirmButtonLabel: intl.formatMessage(isSingular ? singularConfirmLabel : pluralConfirmLabel),
      onClose: closeModal,
      onConfirm: confirmAction,
    };
  }, [
    isOpen,
    itemsToRemove,
    intl,
    singularTitle,
    pluralTitle,
    singularBody,
    pluralBody,
    singularConfirmLabel,
    pluralConfirmLabel,
    getItemLabel,
    extraValues,
    itemValueKey,
    countValueKey,
    closeModal,
    confirmAction,
  ]);

  return {
    openModal,
    closeModal,
    confirmAction,
    itemsToRemove,
    modalState,
    isLoading,
  };
}

export default useConfirmItemsModal;
