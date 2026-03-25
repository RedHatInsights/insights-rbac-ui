import { z } from 'zod';
import { useQuery } from '@tanstack/react-query';
import type { RoleBindingsRoleBinding } from '../api/workspaces';
import { createWorkspacesApi } from '../api/workspaces';
import { useAppServices } from '../../../shared/contexts/ServiceContext';
import { roleBindingsKeys } from './workspaces';

// =============================================================================
// Strict domain type + zod schema
// =============================================================================

const roleBindingSchema = z.object({
  role: z.object({ id: z.string(), name: z.string() }),
  subject: z.object({
    id: z.string(),
    type: z.string(),
    groupName: z.string().optional(),
  }),
  resource: z.object({ id: z.string(), name: z.string(), type: z.string() }),
});

export type RoleBinding = z.infer<typeof roleBindingSchema>;

function mapApiBinding(b: RoleBindingsRoleBinding): RoleBinding {
  return {
    role: { id: b.role?.id ?? '', name: b.role?.name ?? '' },
    subject: {
      id: b.subject?.id ?? '',
      type: b.subject?.type ?? '',
      groupName: (b.subject as { group?: { name?: string } })?.group?.name,
    },
    resource: { id: b.resource?.id ?? '', name: b.resource?.name ?? '', type: b.resource?.type ?? '' },
  };
}

function parseBindings(raw: RoleBindingsRoleBinding[]): RoleBinding[] {
  const mapped = raw.map(mapApiBinding);
  if (process.env.NODE_ENV !== 'production') {
    return z.array(roleBindingSchema).parse(mapped);
  }
  return mapped.flatMap((b) => {
    const result = roleBindingSchema.safeParse(b);
    if (!result.success) {
      console.warn('[RoleBinding] Invalid binding filtered out:', result.error.format());
      return [];
    }
    return [result.data];
  });
}

// =============================================================================
// Query hooks
// =============================================================================

const FIELDS = 'role(id,name),subject(id,type,group.name),resource(id,name,type)';

/** Fetch all role bindings for a group (across all workspaces). */
export function useGroupRoleBindingsQuery(groupId: string, options?: { enabled?: boolean }) {
  const { axios } = useAppServices();
  const api = createWorkspacesApi(axios);

  return useQuery({
    queryKey: [...roleBindingsKeys.all, 'group', groupId],
    queryFn: async (): Promise<RoleBinding[]> => {
      const response = await api.roleBindingsList({
        subjectType: 'group',
        subjectId: groupId,
        resourceType: 'workspace',
        limit: 1000,
        fields: FIELDS,
      });
      return parseBindings(response.data?.data ?? []);
    },
    enabled: (options?.enabled ?? true) && !!groupId,
  });
}

/** Fetch role bindings granted to a user, scoped to workspaces. Optionally filtered to a single workspace via `resourceId`. */
export function useUserRoleBindingsQuery(userId: string | undefined, options?: { enabled?: boolean; resourceId?: string }) {
  const { axios } = useAppServices();
  const api = createWorkspacesApi(axios);

  return useQuery({
    queryKey: [...roleBindingsKeys.all, 'user', userId, options?.resourceId],
    queryFn: async (): Promise<RoleBinding[]> => {
      // TODO: replace with typed params once @redhat-cloud-services/rbac-client supports granted_subject_*
      const response = await api.roleBindingsList({
        resourceType: 'workspace',
        resourceId: options?.resourceId,
        limit: 1000,
        fields: FIELDS,
        options: {
          params: {
            granted_subject_type: 'user',
            granted_subject_id: userId!,
          },
        },
      });
      return parseBindings(response.data?.data ?? []);
    },
    enabled: (options?.enabled ?? true) && !!userId,
  });
}

/** Fetch role bindings for the current authenticated user. Resolves identity internally so consumers don't need to. */
export function useCurrentUserRoleBindingsQuery(options?: { enabled?: boolean; resourceId?: string }) {
  const { identity } = useAppServices();
  const userId = identity?.account_id;
  return useUserRoleBindingsQuery(userId, options);
}
