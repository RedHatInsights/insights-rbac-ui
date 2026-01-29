import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useQueryClient } from '@tanstack/react-query';
import useAppNavigate from '../../../hooks/useAppNavigate';
import { rolesKeys, useRoleQuery, useUpdateRoleMutation } from '../../../data/queries/roles';
import type { ResourceDefinition, RoleWithAccess } from '@redhat-cloud-services/rbac-client/types';
import pathnames from '../../../utilities/pathnames';

interface FilteredPermission {
  uuid: string;
  permission: string;
  resourceDefinitions: ResourceDefinition[];
  modified: string;
}

interface UseRolePermissionsReturn {
  role: RoleWithAccess | undefined;
  isRecordLoading: boolean;
  filteredPermissions: FilteredPermission[];
  applications: string[];
  resources: Array<{ label: string; value: string }>;
  operations: Array<{ label: string; value: string }>;
  showResourceDefinitions: boolean;
  onRemovePermissions: (permissions: Array<{ uuid: string }>) => Promise<void>;
  onNavigateToAddPermissions: () => void;
}

export const useRolePermissions = (filters: { applications: string[]; resources: string[]; operations: string[] }): UseRolePermissionsReturn => {
  const navigate = useAppNavigate();
  const queryClient = useQueryClient();
  const { roleId } = useParams<{ roleId: string }>();

  // roleId must exist - this hook should only be used on role detail routes
  if (!roleId) {
    throw new Error('useRolePermissions must be used on a route with :roleId param');
  }

  // Use TanStack Query for role data
  const { data: role, isLoading: isRecordLoading } = useRoleQuery(roleId);
  const updateRoleMutation = useUpdateRoleMutation();

  const [showResourceDefinitions, setShowResourceDefinitions] = useState(true);

  // Extract unique resources and operations from role permissions
  const { resources, operations } = useMemo(() => {
    if (!role || !role.access || role.access.length === 0) {
      return { resources: [], operations: [] };
    }

    const extracted = role.access.reduce(
      (acc, { permission }) => {
        const [, resource, operation] = permission.split(':');
        return {
          resources: acc.resources.includes(resource) ? acc.resources : [...acc.resources, resource],
          operations: acc.operations.includes(operation) ? acc.operations : [...acc.operations, operation],
        };
      },
      { resources: [] as string[], operations: [] as string[] },
    );

    return {
      resources: extracted.resources.map((item) => ({ label: item, value: item })),
      operations: extracted.operations.map((item) => ({ label: item, value: item })),
    };
  }, [role]);

  // Determine if resource definitions column should be shown
  useEffect(() => {
    if (role?.access) {
      const hasResourceDefinitions = role.access.some((a) => a.permission.includes('cost-management') || a.permission.includes('inventory'));
      setShowResourceDefinitions(hasResourceDefinitions);
    }
  }, [role]);

  // Filter permissions based on selected filters
  const filteredPermissions = useMemo(() => {
    if (!role || !role.access) {
      return [];
    }

    return role.access
      .filter(({ permission }) => {
        const [application, resource, operation] = permission.split(':');
        return (
          (filters.applications.length > 0 ? filters.applications.includes(application) : true) &&
          (filters.resources.length > 0 ? filters.resources.includes(resource) : true) &&
          (filters.operations.length > 0 ? filters.operations.includes(operation) : true)
        );
      })
      .map((perm) => ({
        uuid: perm.permission,
        permission: perm.permission,
        resourceDefinitions: perm.resourceDefinitions,
        modified: role.modified,
      }));
  }, [role, filters]);

  // Remove permissions from role - throws if role not loaded (caller should check isRecordLoading)
  const onRemovePermissions = async (permissions: Array<{ uuid: string }>) => {
    if (!role) {
      throw new Error('Cannot remove permissions: role data not loaded. Check isRecordLoading before calling.');
    }

    const permissionsToRemove = new Set(permissions.map((p) => p.uuid));
    const updatedAccess = (role.access ?? []).filter((a) => !permissionsToRemove.has(a.permission));

    await updateRoleMutation.mutateAsync({
      uuid: roleId,
      rolePut: {
        name: role.name,
        display_name: role.display_name ?? role.name,
        description: role.description,
        access: updatedAccess,
      },
    });
    // Success notification handled by mutation, refresh role data
    queryClient.invalidateQueries({ queryKey: rolesKeys.detail(roleId) });
  };

  // Navigate to add permissions wizard
  const onNavigateToAddPermissions = () => {
    if (!role) {
      throw new Error('Cannot navigate: role data not loaded. Check isRecordLoading before calling.');
    }
    navigate(pathnames['role-add-permission'].link(role.uuid));
  };

  return {
    role,
    isRecordLoading,
    filteredPermissions,
    applications: role?.applications || [],
    resources,
    operations,
    showResourceDefinitions,
    onRemovePermissions,
    onNavigateToAddPermissions,
  };
};
