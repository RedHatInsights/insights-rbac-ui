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
        result[WorkspacePermissions.AllPermission] = userPermissions.find(
          ({ permission }) => permission === WorkspacePermissions.AllPermission,
        )?.resourceDefinitions;
        result[WorkspacePermissions.ReadPermission] = userPermissions.find(
          ({ permission }) => permission === WorkspacePermissions.ReadPermission,
        )?.resourceDefinitions;
        result[WorkspacePermissions.WritePermission] = userPermissions.find(
          ({ permission }) => permission === WorkspacePermissions.WritePermission,
        )?.resourceDefinitions;
        setWorkspacePermissions(result);
      })
      .catch((error) => setWorkspacePermissionsError(new Error('Error fetching user workspace permissions', error)));
  }, []);

  return [workspacePermissions, workspacePermissionsError];
};

export const canViewWorkspaceById = (workspaceId: string, workspacePermissions: WorkspacePermissionsObject): boolean => {
  return (
    !!workspacePermissions[WorkspacePermissions.AllPermission] ||
    (!!workspacePermissions[WorkspacePermissions.ReadPermission] &&
      workspacePermissions[WorkspacePermissions.ReadPermission].some((item) => item.attributeFilter.value.includes(workspaceId)))
  );
};
