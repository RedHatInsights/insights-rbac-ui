/**
 * V2 User Role Bindings Query
 *
 * Lists role bindings for a specific user using the V2 roleBindingsList API.
 * Each binding includes the role, the subject (user or group through which
 * the role is granted), and the workspace (resource).
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rolesV2Api } from '../api/roles';
import type { RoleBindingsRoleBinding } from '../api/roles';
import { roleBindingsKeys } from './workspaces';

export interface UserRoleRow {
  uuid: string;
  name: string;
  userGroup?: string;
  workspace?: string;
}

function bindingsToUserRoleRows(bindings: RoleBindingsRoleBinding[]): UserRoleRow[] {
  return bindings.map((binding) => {
    const subject = binding.subject as Record<string, unknown> | undefined;
    const group = subject?.group as Record<string, unknown> | undefined;
    return {
      uuid: `${binding.role?.id ?? ''}-${binding.resource?.id ?? ''}`,
      name: binding.role?.name ?? '',
      userGroup: (group?.name as string) ?? (subject?.type === 'group' ? (subject?.id as string) : undefined),
      workspace: binding.resource?.name ?? undefined,
    };
  });
}

export function useUserRoleBindingsQuery(userId: string, options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: [...roleBindingsKeys.all, 'user-roles', userId],
    queryFn: async () => {
      const response = await rolesV2Api.roleBindingsList({
        subjectType: 'user',
        subjectId: userId,
        fields: 'role(id,name),subject(id,type,group.name),resource(id,name,type)',
        limit: 1000,
      });
      return response.data;
    },
    enabled: (options?.enabled ?? true) && !!userId,
  });

  const data = useMemo(() => bindingsToUserRoleRows(query.data?.data ?? []), [query.data]);

  return { data, isLoading: query.isLoading, error: query.error };
}
