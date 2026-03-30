import React, { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { WorkspaceListTable } from './components/WorkspaceListTable';
import { useWorkspacesWithPermissions } from './hooks/useWorkspacesWithPermissions';
import useAppNavigate from '../../../shared/hooks/useAppNavigate';
import { useAppLink } from '../../../shared/hooks/useAppLink';
import pathnames from '../../utilities/pathnames';

export const WorkspaceList = () => {
  const { workspaces, hasPermission, canCreateAny, status, isError } = useWorkspacesWithPermissions();
  const error: string | null = isError ? 'Failed to fetch workspaces' : null;
  const navigate = useAppNavigate();
  const toAppLink = useAppLink();

  const navigateToList = () => navigate(toAppLink(pathnames['access-management-workspaces'].link()));

  return (
    <>
      <WorkspaceListTable
        workspaces={workspaces}
        isLoading={status === 'loading'}
        error={error}
        hasPermission={hasPermission}
        canCreateAny={canCreateAny}
      />
      <Suspense fallback={null}>
        <Outlet
          context={{
            [pathnames['move-workspace'].path]: {
              afterSubmit: navigateToList,
              onCancel: navigateToList,
            },
            [pathnames['delete-workspace'].path]: {
              afterSubmit: navigateToList,
              onCancel: navigateToList,
            },
            [pathnames['create-sub-workspace'].path]: {
              afterSubmit: navigateToList,
              onCancel: navigateToList,
            },
            [pathnames['create-sibling-workspace'].path]: {
              afterSubmit: navigateToList,
              onCancel: navigateToList,
            },
            [pathnames['edit-workspaces-list'].path]: {
              afterSubmit: navigateToList,
              onCancel: navigateToList,
            },
          }}
        />
      </Suspense>
    </>
  );
};

export default WorkspaceList;
