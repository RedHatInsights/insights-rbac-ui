/**
 * Shared configuration for member removal confirmation modal.
 *
 * This module centralizes the member-specific configuration used by both
 * GroupMembers.tsx and useGroupMembers.tsx to avoid duplication and
 * ensure consistency.
 */

import type { UseConfirmItemsModalConfig } from '../../../../hooks/useConfirmItemsModal';
import messages from '../../../../Messages';
import type { Member } from './types';

/**
 * Configuration options for member removal modal
 */
export interface MemberRemovalConfigOptions {
  /** Group name for display in modal text */
  groupName: string;
}

/**
 * Creates the shared configuration for member removal confirmation modal.
 *
 * Note: The `onConfirm` callback must be provided by the caller since it
 * contains component-specific logic (dispatch, fetchData, etc.)
 *
 * @example
 * ```tsx
 * const memberConfig = getMemberRemovalConfig({ groupName: group?.name || '' });
 *
 * const { openModal, modalState } = useConfirmItemsModal<Member>({
 *   ...memberConfig,
 *   onConfirm: async (members) => {
 *     // Component-specific removal logic
 *   },
 * });
 * ```
 */
export function getMemberRemovalConfig(options: MemberRemovalConfigOptions): Omit<UseConfirmItemsModalConfig<Member>, 'onConfirm'> {
  const { groupName } = options;

  return {
    singularTitle: messages.removeMemberQuestion,
    pluralTitle: messages.removeMembersQuestion,
    singularBody: messages.removeMemberText,
    pluralBody: messages.removeMembersText,
    singularConfirmLabel: messages.removeMember,
    pluralConfirmLabel: messages.remove,
    getItemLabel: (member) => member.username,
    extraValues: { group: groupName },
    itemValueKey: 'name',
    // Members use 'name' for count in plural messages (legacy i18n pattern)
    countValueKey: 'name',
  };
}
