import { useCallback, useMemo } from 'react';
import { useRoleWriteAccess } from '../../../hooks/useRbacAccess';

export interface RolePermissions {
  edit: boolean;
  delete: boolean;
}

interface Role {
  id?: string;
}

/**
 * Per-role permission check.
 *
 * Checks `rbac_roles_write` against each role resource directly via Kessel.
 * Canned roles return false from the backend — no frontend org_id guard needed.
 */
export function useRolePermissions(roles: Role[]) {
  const roleIds = useMemo(() => roles.map((r) => r.id).filter((id): id is string => id != null), [roles]);
  const { writableIds, isLoading } = useRoleWriteAccess(roleIds);

  const permissionsFor = useCallback(
    (roleId: string): RolePermissions => ({
      edit: writableIds.has(roleId),
      delete: writableIds.has(roleId),
    }),
    [writableIds],
  );

  const canEdit = useCallback((roleId: string): boolean => writableIds.has(roleId), [writableIds]);
  const canDelete = useCallback((roleId: string): boolean => writableIds.has(roleId), [writableIds]);
  const canWriteAny = writableIds.size > 0;

  return { permissionsFor, canEdit, canDelete, canWriteAny, isLoading };
}
