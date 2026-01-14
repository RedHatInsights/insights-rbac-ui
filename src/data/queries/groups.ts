import { useQuery } from '@tanstack/react-query';
import { type GroupOut, groupsApi } from '../api/groups';

// ============================================================================
// Query Keys Factory
// ============================================================================

export const groupsKeys = {
  all: ['groups'] as const,
  lists: () => [...groupsKeys.all, 'list'] as const,
  adminGroup: () => [...groupsKeys.all, 'admin'] as const,
  details: () => [...groupsKeys.all, 'detail'] as const,
  detail: (id: string) => [...groupsKeys.details(), id] as const,
};

// ============================================================================
// Query Hooks
// ============================================================================

/**
 * Fetch the admin default group.
 * This is used by the Roles page to check if a group is the admin group.
 */
export function useAdminGroupQuery(options?: { enabled?: boolean }) {
  return useQuery({
    queryKey: groupsKeys.adminGroup(),
    queryFn: async () => {
      const response = await groupsApi.listGroups({
        limit: 1,
        adminDefault: true,
      });
      // Extract the first admin_default group from the response
      const adminGroup = response.data?.data?.find((group: GroupOut) => group.admin_default);
      return adminGroup ?? null;
    },
    staleTime: 5 * 60 * 1000, // Admin group rarely changes, cache for 5 minutes
    enabled: options?.enabled ?? true,
  });
}

/**
 * Fetch a single group by ID.
 */
export function useGroupQuery(id: string) {
  return useQuery({
    queryKey: groupsKeys.detail(id),
    queryFn: async () => {
      const response = await groupsApi.getGroup({ uuid: id });
      return response.data;
    },
    enabled: !!id,
  });
}

// Re-export types
export type { GroupOut } from '../api/groups';
