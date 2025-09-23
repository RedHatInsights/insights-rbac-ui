import { useEffect, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { fetchGroup, fetchSystemGroup } from '../../../redux/groups/actions';

interface UseGroupDataLoadProps {
  groupId?: string;
  systemGroupUuid?: string;
  isPlatformDefault: boolean;
  chrome: any;
}

/**
 * Custom hook for loading Group component data
 * Handles data fetching, Chrome app object ID, and cleanup
 */
export const useGroupDataLoad = ({ groupId, systemGroupUuid, isPlatformDefault, chrome }: UseGroupDataLoadProps) => {
  const dispatch = useDispatch();
  const currentAppObjectId = useRef<string>('');

  // Fetch system group and current group, set Chrome app object ID
  useEffect(() => {
    dispatch(fetchSystemGroup({ chrome }));
    const currId = !isPlatformDefault ? groupId : systemGroupUuid;

    if (currId && currId !== currentAppObjectId.current) {
      dispatch(fetchGroup(currId));
      chrome.appObjectId(currId);
      currentAppObjectId.current = currId;
    }

    return () => {
      if (currentAppObjectId.current) {
        chrome.appObjectId('');
        currentAppObjectId.current = '';
      }
    };
  }, [groupId, systemGroupUuid, dispatch, isPlatformDefault]);
};
