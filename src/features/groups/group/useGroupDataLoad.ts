import { useEffect, useRef } from 'react';

interface UseGroupDataLoadProps {
  groupId?: string;
  systemGroupUuid?: string;
  isPlatformDefault: boolean;
  trackObjectView: (id: string) => void;
}

/**
 * Custom hook for tracking object view (analytics)
 * Data fetching is handled by React Query in useGroupData
 */
export const useGroupDataLoad = ({ groupId, systemGroupUuid, isPlatformDefault, trackObjectView }: UseGroupDataLoadProps) => {
  const currentTrackedId = useRef<string>('');

  // Determine the effective group ID based on whether this is the platform default
  const effectiveGroupId = !isPlatformDefault ? groupId : systemGroupUuid;

  // Track object view when group changes
  useEffect(() => {
    if (effectiveGroupId && effectiveGroupId !== currentTrackedId.current) {
      trackObjectView(effectiveGroupId);
      currentTrackedId.current = effectiveGroupId;
    }

    return () => {
      if (currentTrackedId.current) {
        trackObjectView('');
        currentTrackedId.current = '';
      }
    };
  }, [effectiveGroupId, trackObjectView]);
};
