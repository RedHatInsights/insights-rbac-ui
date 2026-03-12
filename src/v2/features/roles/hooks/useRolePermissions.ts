import { useCallback, useMemo } from 'react';
import { useRolesAccess } from '../../../hooks/useRbacAccess';

export interface RolePermissions {
  edit: boolean;
  delete: boolean;
}

interface Role {
  id?: string;
  org_id?: string;
}

/**
 * Per-role permission check.
 *
 * Combines two checks:
 * 1. **Tenant-scoped Kessel check** (`rbac_roles_write` on the org) — does
 *    the user have write permission for roles at all?
 * 2. **`org_id` guard** — is this a user-created role? System/canned roles
 *    have `org_id === undefined` and are never editable/deletable regardless of
 *    tenant permission.
 *
 * `canEdit(roleId) = tenantCanWrite && role.org_id !== undefined`
 */
export function useRolePermissions(roles: Role[]) {
  const { canUpdate, canDelete: canDeleteTenant, isLoading } = useRolesAccess();

  const userCreatedIds = useMemo(() => new Set(roles.filter((r) => r.id && r.org_id !== undefined).map((r) => r.id!)), [roles]);

  const permissionsFor = useCallback(
    (roleId: string): RolePermissions => ({
      edit: canUpdate && userCreatedIds.has(roleId),
      delete: canDeleteTenant && userCreatedIds.has(roleId),
    }),
    [canUpdate, canDeleteTenant, userCreatedIds],
  );

  const canEdit = useCallback((roleId: string): boolean => canUpdate && userCreatedIds.has(roleId), [canUpdate, userCreatedIds]);
  const canDelete = useCallback((roleId: string): boolean => canDeleteTenant && userCreatedIds.has(roleId), [canDeleteTenant, userCreatedIds]);
  const canWriteAny = canUpdate && userCreatedIds.size > 0;

  return { permissionsFor, canEdit, canDelete, canWriteAny, isLoading };
}
