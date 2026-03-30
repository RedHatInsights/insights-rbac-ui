import React, { Suspense, lazy, useCallback, useMemo } from 'react';
import { Navigate, Route, Routes, useParams } from 'react-router-dom';
import { v2WorkspaceGuard } from '../../../components/V2WorkspacePermissionGuard';
import { v2RoleBindingGuard } from '../../../components/V2RoleBindingPermissionGuard';
import useAppNavigate from '../../../../shared/hooks/useAppNavigate';
import pathnames from '../../../utilities/pathnames';

const DirectRolesTab = lazy(() => import('./DirectRolesTab'));
const InheritedRolesTab = lazy(() => import('./InheritedRolesTab'));
const AssetsTab = lazy(() => import('./AssetsTab'));
const EditWorkspaceModal = lazy(() => import('../EditWorkspaceModal'));
const RoutedMoveDialog = lazy(() => import('../components/RoutedMoveDialog'));
const RoutedDeleteModal = lazy(() => import('../components/RoutedDeleteModal'));
const RoutedGrantAccessWizard = lazy(() => import('../grant-access/RoutedGrantAccessWizard'));
const RoleAccessModal = lazy(() => import('./components/RoleAccessModal').then((m) => ({ default: m.RoleAccessModal })));

/**
 * Router-only shell for the workspace detail page.
 *
 * Tab content is rendered via conditional logic driven by URL parsing —
 * not via `<Routes>` — so tabs stay mounted when modal routes activate.
 *
 * Modals use a separate `<Routes>` block that matches independently.
 */
export const WorkspaceDetailShell: React.FC = () => {
  const { workspaceId = '', '*': splat = '' } = useParams<{ workspaceId: string; '*': string }>();
  const navigate = useAppNavigate();

  const activeTab = useMemo<'direct-roles' | 'inherited-roles' | 'assets'>(() => {
    if (splat.startsWith('inherited-roles')) return 'inherited-roles';
    if (splat.startsWith('assets')) return 'assets';
    return 'direct-roles';
  }, [splat]);

  const groupId = useMemo(() => {
    const match = splat.match(/^direct-roles\/([^/]+)/);
    return match?.[1];
  }, [splat]);

  const goToDirectRoles = useCallback(() => navigate(pathnames['workspace-detail-direct-roles'].link(workspaceId)), [navigate, workspaceId]);

  const goToList = useCallback(() => navigate(pathnames['access-management-workspaces'].link()), [navigate]);

  if (!splat) {
    return <Navigate to="direct-roles" replace />;
  }

  return (
    <>
      {/* Tab content: conditional render, stays mounted across modal navigation */}
      <Suspense fallback={null}>
        {activeTab === 'direct-roles' && <DirectRolesTab groupId={groupId} />}
        {activeTab === 'inherited-roles' && <InheritedRolesTab />}
        {activeTab === 'assets' && <AssetsTab />}
      </Suspense>

      {/* Modal overlay routes: independent match */}
      <Suspense fallback={null}>
        <Routes>
          <Route {...v2WorkspaceGuard('edit')}>
            <Route path="edit" element={<EditWorkspaceModal afterSubmit={goToDirectRoles} onCancel={goToDirectRoles} />} />
          </Route>
          <Route {...v2WorkspaceGuard('move')}>
            <Route path="move" element={<RoutedMoveDialog afterSubmit={goToDirectRoles} onCancel={goToDirectRoles} />} />
          </Route>
          <Route {...v2WorkspaceGuard('delete')}>
            <Route path="delete" element={<RoutedDeleteModal afterSubmit={goToList} onCancel={goToDirectRoles} />} />
          </Route>
          <Route {...v2RoleBindingGuard('grant')}>
            <Route path="grant-access" element={<RoutedGrantAccessWizard />} />
            <Route path="direct-roles/:groupId/edit-access" element={<RoleAccessModal />} />
          </Route>
        </Routes>
      </Suspense>
    </>
  );
};

export default WorkspaceDetailShell;
