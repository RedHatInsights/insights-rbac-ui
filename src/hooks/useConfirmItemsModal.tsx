/**
 * useConfirmItemsModal
 *
 * A generic hook for managing confirmation modal state for item removal operations.
 * Centralizes the modal open/close logic, singular/plural text generation, and
 * confirmation handling to eliminate duplication across different entity types.
 *
 * @example
 * ```tsx
 * const { openRemoveModal, removeModalState } = useConfirmItemsModal<Role>({
 *   onConfirm: async (rolesToRemove) => {
 *     await dispatch(removeRolesFromGroup(groupId, rolesToRemove.map(r => r.uuid)));
 *   },
 *   singularTitle: messages.removeRoleQuestion,
 *   pluralTitle: messages.removeRolesQuestion,
 *   singularBody: messages.removeRoleModalText,
 *   pluralBody: messages.removeRolesModalText,
 *   singularConfirmLabel: messages.removeRole,
 *   pluralConfirmLabel: messages.removeRoles,
 *   getItemLabel: (role) => role.display_name || role.name,
 *   bodyValues: { name: group?.name || '' },
 * });
 * ```
 */

import React, { useCallback, useMemo, useState } from 'react';
import { FormattedMessage, MessageDescriptor, useIntl } from 'react-intl';
import { addNotification } from '@redhat-cloud-services/frontend-components-notifications/';

import messages from '../Messages';

/**
 * Configuration options for the useConfirmItemsModal hook
 */
export interface UseConfirmItemsModalConfig<T> {
  /**
   * Callback invoked when the user confirms the removal.
   * Should perform the actual removal operation (e.g., API call).
   * If this function throws, the error will be handled and displayed to the user.
   */
  onConfirm: (items: T[]) => Promise<void>;

  /**
   * Optional callback invoked after successful removal.
   * Use this to refresh data, clear selections, etc.
   */
  onSuccess?: () => void;

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
   * Message descriptor for singular confirm button label (e.g., "Remove role")
   */
  singularConfirmLabel: MessageDescriptor;

  /**
   * Message descriptor for plural confirm button label (e.g., "Remove roles")
   */
  pluralConfirmLabel: MessageDescriptor;

  /**
   * Function to extract a display label from an item.
   * Used for single-item removal to show the item name in the modal.
   */
  getItemLabel: (item: T) => string;

  /**
   * Additional values to pass to FormattedMessage for body text.
   * Common values like {b} for bold are automatically included.
   */
  bodyValues?: Record<string, unknown>;

  /**
   * Key name for the item label in singular body message (default: 'name')
   */
  singularLabelKey?: string;

  /**
   * Key name for the count in plural body message (default: 'count')
   */
  pluralCountKey?: string;
}

/**
 * Return type for the useConfirmItemsModal hook
 */
export interface UseConfirmItemsModalReturn<T> {
  /**
   * Opens the confirmation modal with the specified items
   */
  openRemoveModal: (items: T[]) => void;

  /**
   * Closes the confirmation modal and clears the items
   */
  closeRemoveModal: () => void;

  /**
   * State object for rendering the confirmation modal
   */
  removeModalState: {
    isOpen: boolean;
    itemsToRemove: T[];
    title: string;
    text: React.ReactNode;
    confirmButtonLabel: string;
    onClose: () => void;
    onConfirm: () => void;
    isSubmitting: boolean;
  };

  /**
   * Whether the modal is currently open
   */
  isOpen: boolean;

  /**
   * The items currently staged for removal
   */
  itemsToRemove: T[];
}

/**
 * Custom hook for managing confirmation modal state for item removal operations.
 * Provides a generic, reusable pattern for confirming destructive actions.
 */
export function useConfirmItemsModal<T>(config: UseConfirmItemsModalConfig<T>): UseConfirmItemsModalReturn<T> {
  const {
    onConfirm,
    onSuccess,
    singularTitle,
    pluralTitle,
    singularBody,
    pluralBody,
    singularConfirmLabel,
    pluralConfirmLabel,
    getItemLabel,
    bodyValues = {},
    singularLabelKey = 'name',
    pluralCountKey = 'count',
  } = config;

  const intl = useIntl();

  // Modal state
  const [isOpen, setIsOpen] = useState(false);
  const [itemsToRemove, setItemsToRemove] = useState<T[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Opens the confirmation modal with the specified items
   */
  const openRemoveModal = useCallback((items: T[]) => {
    setItemsToRemove(items);
    setIsOpen(true);
  }, []);

  /**
   * Closes the confirmation modal and clears state
   */
  const closeRemoveModal = useCallback(() => {
    setIsOpen(false);
    setItemsToRemove([]);
    setIsSubmitting(false);
  }, []);

  /**
   * Handles the confirmation action with error handling
   */
  const handleConfirm = useCallback(async () => {
    if (itemsToRemove.length === 0 || isSubmitting) return;

    setIsSubmitting(true);

    try {
      await onConfirm(itemsToRemove);

      // Close modal on success
      setIsOpen(false);
      setItemsToRemove([]);

      // Call success callback if provided
      onSuccess?.();
    } catch (error: unknown) {
      // Handle specific error cases
      const apiError = error as { response?: { status?: number }; errors?: Array<{ detail?: string }> };
      const status = apiError?.response?.status;

      if (status === 404) {
        // Item(s) were already removed by another user
        addNotification({
          variant: 'warning',
          title: intl.formatMessage(messages.itemAlreadyRemovedTitle),
          description: intl.formatMessage(messages.itemAlreadyRemovedDescription),
          dismissable: true,
        });
      } else if (status === 403) {
        // Permission denied
        addNotification({
          variant: 'danger',
          title: intl.formatMessage(messages.insufficientPermissionsTitle),
          description: intl.formatMessage(messages.insufficientPermissionsDescription),
          dismissable: true,
        });
      } else {
        // Generic error
        const errorDetail = apiError?.errors?.[0]?.detail;
        addNotification({
          variant: 'danger',
          title: intl.formatMessage(messages.removeItemErrorTitle),
          description: errorDetail || intl.formatMessage(messages.removeItemErrorDescription),
          dismissable: true,
        });
      }

      // Close modal on error
      setIsOpen(false);
      setItemsToRemove([]);
    } finally {
      setIsSubmitting(false);
    }
  }, [itemsToRemove, isSubmitting, onConfirm, onSuccess, intl]);

  /**
   * Memoized modal state for rendering
   */
  const removeModalState = useMemo(() => {
    const isSingular = itemsToRemove.length === 1;
    const itemLabel = isSingular && itemsToRemove[0] ? getItemLabel(itemsToRemove[0]) : '';

    // Build body values with automatic bold support and item-specific values
    const bodyMessageValues = {
      ...bodyValues,
      b: (text: React.ReactNode) => <b>{text}</b>,
      [singularLabelKey]: itemLabel,
      [pluralCountKey]: itemsToRemove.length,
    };

    return {
      isOpen,
      itemsToRemove,
      title: intl.formatMessage(isSingular ? singularTitle : pluralTitle),
      text: <FormattedMessage {...(isSingular ? singularBody : pluralBody)} values={bodyMessageValues} />,
      confirmButtonLabel: intl.formatMessage(isSingular ? singularConfirmLabel : pluralConfirmLabel),
      onClose: closeRemoveModal,
      onConfirm: handleConfirm,
      isSubmitting,
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
    bodyValues,
    singularLabelKey,
    pluralCountKey,
    closeRemoveModal,
    handleConfirm,
    isSubmitting,
  ]);

  return {
    openRemoveModal,
    closeRemoveModal,
    removeModalState,
    isOpen,
    itemsToRemove,
  };
}

export default useConfirmItemsModal;
