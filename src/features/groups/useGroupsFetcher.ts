/**
 * useGroupsFetcher Hook
 *
 * Extracts data fetching logic from the Groups component.
 * Handles fetching groups, admin groups, and system groups.
 */

import { useCallback } from 'react';
import { useDispatch } from 'react-redux';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import { fetchAdminGroup, fetchGroups, fetchSystemGroup } from '../../redux/groups/actions';

export interface FetchGroupsParams {
  offset: number;
  limit: number;
  orderBy?: string;
  filters: Record<string, string | string[]>;
}

export function useGroupsFetcher() {
  const dispatch = useDispatch();
  const chrome = useChrome();

  return useCallback(
    (params: FetchGroupsParams) => {
      const nameFilter = typeof params.filters.name === 'string' ? params.filters.name : '';

      dispatch(
        fetchGroups({
          limit: params.limit,
          offset: params.offset,
          filters: { name: nameFilter },
          orderBy: params.orderBy as any,
          usesMetaInURL: true,
          chrome,
          platformDefault: false,
          adminDefault: false,
        }) as any,
      );

      // Also fetch admin and system default groups
      dispatch(fetchAdminGroup({ filterValue: nameFilter, chrome }) as any);
      dispatch(fetchSystemGroup({ filterValue: nameFilter, chrome }) as any);
    },
    [dispatch, chrome],
  );
}
