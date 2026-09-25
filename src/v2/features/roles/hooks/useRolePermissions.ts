import { useCallback, useMemo } from 'react';
import { useRolesAccess } from '../../../hooks/useRbacAccess';

export interface RolePermissions {
  edit: boolean;
  delete: boolean;
}

interface Role {
  id?: string;
  org_id?: string | null;
}

/**
 * Per-role permission check.
 *
 * Uses org_id to distinguish custom roles (editable) from system/canned roles
 * (immutable), combined with tenant-scoped Kessel permission checks.
 *
 * - org_id: null or undefined -> system/canned role, never editable/deletable
 * - org_id: string -> custom role, editable/deletable if tenant-level permission allows
 */
export function useRolePermissions(roles: Role[]) {
  const { canUpdate, canDelete: tenantCanDelete, isLoading } = useRolesAccess();

  const customRoleIds = useMemo(
    () => new Set(roles.filter((r) => r.org_id != null).map((r) => r.id).filter((id): id is string => id != null)),
    [roles],
  );

  const permissionsFor = useCallback(
    (roleId: string): RolePermissions => ({
      edit: customRoleIds.has(roleId) && canUpdate,
      delete: customRoleIds.has(roleId) && tenantCanDelete,
    }),
    [customRoleIds, canUpdate, tenantCanDelete],
  );

  const canEdit = useCallback((roleId: string): boolean => customRoleIds.has(roleId) && canUpdate, [customRoleIds, canUpdate]);
  const canDelete = useCallback((roleId: string): boolean => customRoleIds.has(roleId) && tenantCanDelete, [customRoleIds, tenantCanDelete]);
  const canWriteAny = customRoleIds.size > 0 && (canUpdate || tenantCanDelete);

  return { permissionsFor, canEdit, canDelete, canWriteAny, isLoading };
}
