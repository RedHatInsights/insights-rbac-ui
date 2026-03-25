/**
 * V2 Group Role Bindings Query
 *
 * Lists role bindings for a specific group across all workspaces
 * using the V2 roleBindingsList API. Replaces V1 listRolesForGroup.
 */

import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { rolesV2Api } from '../api/roles';
import type { RoleBindingsRoleBinding } from '../api/roles';
import { roleBindingsKeys } from './workspaces';

export interface GroupRoleRow {
  uuid: string;
  display_name: string;
  workspace?: string;
}

function bindingsToGroupRoleRows(bindings: RoleBindingsRoleBinding[]): GroupRoleRow[] {
  return bindings.map((binding) => ({
    uuid: `${binding.role?.id ?? ''}-${binding.resource?.id ?? ''}`,
    display_name: binding.role?.name ?? '',
    workspace: binding.resource?.name ?? '—',
  }));
}

export function useGroupRoleBindingsQuery(groupId: string, options?: { enabled?: boolean }) {
  const query = useQuery({
    queryKey: [...roleBindingsKeys.all, 'group-roles', groupId],
    queryFn: async () => {
      const response = await rolesV2Api.roleBindingsList({
        subjectType: 'group',
        subjectId: groupId,
        fields: 'role(id,name),resource(id,name,type)',
        limit: 1000,
      });
      return response.data;
    },
    enabled: (options?.enabled ?? true) && !!groupId,
  });

  const data = useMemo(() => bindingsToGroupRoleRows(query.data?.data ?? []), [query.data]);

  return { data, isLoading: query.isLoading, error: query.error };
}
