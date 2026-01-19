import { useEffect, useRef } from 'react';

interface UseGroupDataLoadProps {
  groupId?: string;
  systemGroupUuid?: string;
  isPlatformDefault: boolean;
  chrome: {
    appObjectId: (id: string) => void;
  };
}

/**
 * Custom hook for Chrome app object ID management
 * Data fetching is handled by React Query in useGroupData
 *
 * Fetching logic is in useGroupData with React Query.
 */
export const useGroupDataLoad = ({ groupId, systemGroupUuid, isPlatformDefault, chrome }: UseGroupDataLoadProps) => {
  const currentAppObjectId = useRef<string>('');

  // Determine the effective group ID based on whether this is the platform default
  const effectiveGroupId = !isPlatformDefault ? groupId : systemGroupUuid;

  // Set Chrome app object ID when group changes
  useEffect(() => {
    if (effectiveGroupId && effectiveGroupId !== currentAppObjectId.current) {
      chrome.appObjectId(effectiveGroupId);
      currentAppObjectId.current = effectiveGroupId;
    }

    return () => {
      if (currentAppObjectId.current) {
        chrome.appObjectId('');
        currentAppObjectId.current = '';
      }
    };
  }, [effectiveGroupId, chrome]);
};
