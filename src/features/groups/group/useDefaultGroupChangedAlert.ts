import { useCallback, useState } from 'react';
import { Group } from '../../../redux/groups/reducer';

/**
 * Hook to manage the "Default group changed" alert visibility
 *
 * This alert shows when:
 * - The group is a modified default group (platform_default=true, system=false)
 * - The user hasn't dismissed it for this specific group
 *
 * The dismissal is tracked per-group, so if the user dismisses it for one group,
 * it won't affect other groups.
 */
export const useDefaultGroupChangedAlert = (group: Group | undefined) => {
  const [dismissedGroups, setDismissedGroups] = useState<Set<string>>(new Set());

  // The alert is visible if:
  // 1. The group is a modified default group (platform_default && !system)
  // 2. The user hasn't dismissed it for this group
  const isVisible = Boolean(group?.platform_default && !group?.system && group?.uuid && !dismissedGroups.has(group.uuid));

  const dismiss = useCallback(() => {
    if (group?.uuid) {
      setDismissedGroups((prev) => new Set(prev).add(group.uuid));
    }
  }, [group?.uuid]);

  return {
    isVisible,
    dismiss,
  };
};
