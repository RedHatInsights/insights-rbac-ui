import useChrome from '@redhat-cloud-services/frontend-components/useChrome';
import { ResourceDefinition } from '@redhat-cloud-services/rbac-client/types';
import { useEffect, useState } from 'react';

export enum WorkspacePermissions {
  AllPermission = 'inventory:groups:*',
  ReadPermission = 'inventory:groups:read',
  WritePermission = 'inventory:groups:write',
}

export type WorkspacePermissionsValues = `${WorkspacePermissions}`;

export type WorkspacePermissionsObject = Partial<Record<WorkspacePermissions, ResourceDefinition[]>>;

export const useWorkspacePermissions = (): [WorkspacePermissionsObject, Error | undefined] => {
  const { getUserPermissions } = useChrome();
  const [workspacePermissions, setWorkspacePermissions] = useState<WorkspacePermissionsObject>({});
  const [workspacePermissionsError, setWorkspacePermissionsError] = useState<Error>();

  useEffect(() => {
    getUserPermissions()
      .then((userPermissions) => {
        const result: WorkspacePermissionsObject = {};

        // Gather ALL resource definitions for each permission type (not just the first match)
        // Multiple roles can grant the same permission with different resource definitions
        const allPermissions = userPermissions.filter(({ permission }) => permission === WorkspacePermissions.AllPermission);
        const readPermissions = userPermissions.filter(({ permission }) => permission === WorkspacePermissions.ReadPermission);
        const writePermissions = userPermissions.filter(({ permission }) => permission === WorkspacePermissions.WritePermission);
        // Check if ANY role grants unrestricted access (empty resourceDefinitions array)
        // If so, we return an empty array as a marker meaning "all access"
        // Otherwise, flatten all resource definitions from all matching roles
        const hasUnrestrictedAll = allPermissions.some((p) => !p.resourceDefinitions || p.resourceDefinitions.length === 0);
        const hasUnrestrictedRead = readPermissions.some((p) => !p.resourceDefinitions || p.resourceDefinitions.length === 0);
        const hasUnrestrictedWrite = writePermissions.some((p) => !p.resourceDefinitions || p.resourceDefinitions.length === 0);
        result[WorkspacePermissions.AllPermission] = hasUnrestrictedAll ? [] : allPermissions.flatMap((p) => p.resourceDefinitions || []);
        result[WorkspacePermissions.ReadPermission] = hasUnrestrictedRead ? [] : readPermissions.flatMap((p) => p.resourceDefinitions || []);
        result[WorkspacePermissions.WritePermission] = hasUnrestrictedWrite ? [] : writePermissions.flatMap((p) => p.resourceDefinitions || []);

        setWorkspacePermissions(result);
      })
      .catch((error) => setWorkspacePermissionsError(new Error('Error fetching user workspace permissions', error)));
  }, []);

  return [workspacePermissions, workspacePermissionsError];
};

export const canViewWorkspaceById = (workspaceId: string, workspacePermissions: WorkspacePermissionsObject): boolean => {
  // Check if user has all permissions wildcard
  const hasAllPermission = workspacePermissions[WorkspacePermissions.AllPermission];
  if (hasAllPermission && hasAllPermission.length > 0) {
    return true;
  }

  // Check read permissions
  const readPermissions = workspacePermissions[WorkspacePermissions.ReadPermission];
  if (!readPermissions) {
    return false;
  }

  // If no resource definitions were collected (length === 0), but the permission exists,
  // it means at least one role granted this permission with an empty resourceDefinitions array
  // which means access to ALL workspaces
  if (readPermissions.length === 0) {
    // Permission exists but no specific restrictions - means all access
    // This happens when a role grants the permission with resourceDefinitions: []
    return true;
  }

  // Check if any resource definition grants access to this specific workspace
  return readPermissions.some((resourceDef) => {
    // If there's no attributeFilter, this resource definition grants access to all
    if (!resourceDef.attributeFilter) {
      return true;
    }

    // Check if the workspace ID is in the allowed values
    const allowedValues = resourceDef.attributeFilter.value;
    if (Array.isArray(allowedValues)) {
      return allowedValues.includes(workspaceId);
    }

    return false;
  });
};
