import React, { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, matchPath, useLocation } from 'react-router-dom';
import { useAppLink } from '../shared/hooks/useAppLink';
import { usePlatformTracking } from '../shared/hooks/usePlatformTracking';
import { AppPlaceholder } from '../shared/components/ui-states/LoaderPlaceholders';
import ElementWrapper from '../shared/components/ElementWrapper';
import { groups, principals, roles, v2Guard, v2GuardOrgAdmin } from './components/V2PermissionGuard';
import { v2WorkspaceGuard } from './components/V2WorkspacePermissionGuard';
import pathnames from './utilities/pathnames';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- outlet context props are injected at runtime via ElementWrapper/cloneElement
const outletElement = (Component: React.ComponentType<any>, path?: string) => (
  <ElementWrapper path={path}>
    <Component />
  </ElementWrapper>
);

const UsersAndUserGroups = lazy(() => import('./features/users-and-user-groups/users-and-user-groups/UsersAndUserGroups'));
const AccessManagementUsers = lazy(() => import('./features/users-and-user-groups/users-and-user-groups/users/Users'));
const AccessManagementUserGroups = lazy(() => import('./features/users-and-user-groups/users-and-user-groups/user-groups/UserGroups'));
const EditUserGroup = lazy(() => import('./features/users-and-user-groups/users-and-user-groups/user-groups/edit-user-group/EditUserGroup'));
const AddGroupWizard = lazy(() => import('../v1/features/groups/add-group/AddGroupWizard'));

const RolesWithWorkspaces = lazy(() => import('./features/roles/RolesWithWorkspaces'));
const AddRoleWizard = lazy(() => import('./features/roles/add-role/AddRoleWizard'));
const EditRole = lazy(() => import('./features/roles/edit-role/EditRole'));

const WorkspaceList = lazy(() => import('./features/workspaces/WorkspaceList'));
const WorkspaceDetail = lazy(() => import('./features/workspaces/workspace-detail/WorkspaceDetail'));
const CreateWorkspaceWizard = lazy(() => import('./features/workspaces/create-workspace/CreateWorkspaceWizard'));
const EditWorkspaceModal = lazy(() => import('./features/workspaces/EditWorkspaceModal'));

const InviteUsersModalCommonAuth = lazy(() => import('../v1/features/users/invite-users/invite-users-modal-common-auth'));

const V2Overview = lazy(() => import('./features/overview/Overview'));

const MyAccess = lazy(() => import('./features/my-access/MyAccess'));
const MyGroups = lazy(() => import('./features/my-access/my-groups/MyGroups'));
const MyWorkspaces = lazy(() => import('./features/my-access/my-workspaces/MyWorkspaces'));

const OrganizationManagement = lazy(() => import('./features/organization-management/OrganizationManagement'));
const AuditLog = lazy(() => import('./features/audit-log/AuditLog'));
const RoleAccessModal = lazy(() =>
  import('./features/workspaces/workspace-detail/components/RoleAccessModal').then((m) => ({ default: m.RoleAccessModal })),
);

const CreateUserGroup = () => <EditUserGroup createNewGroup />;

export const V2Routing = () => {
  const location = useLocation();
  const { setDocumentTitle } = usePlatformTracking();
  const toAppLink = useAppLink();

  useEffect(() => {
    const currPath = Object.values(pathnames).find((item) => !!matchPath({ path: item.path, end: true }, location.pathname));
    if (currPath?.title) setDocumentTitle(`${currPath.title} - Access Management`);
  }, [location.pathname, setDocumentTitle]);

  return (
    <Suspense fallback={<AppPlaceholder />}>
      <Routes>
        {/* Overview — require roles read (any RBAC read as existence check) */}
        <Route {...v2Guard([roles.canView])}>
          <Route path={pathnames.overview.path} element={<V2Overview />} />
        </Route>

        {/* My Access — public (user sees their own access) */}
        <Route path={pathnames['my-access'].path} element={<MyAccess />}>
          <Route path={pathnames['my-access-groups'].path} element={<MyGroups />} />
          <Route path={pathnames['my-access-workspaces'].path} element={<MyWorkspaces />} />
        </Route>

        {/* Users & User Groups — require principal list OR group view */}
        <Route {...v2Guard([principals.canList, groups.canView], { checkAll: false })}>
          <Route path={pathnames['users-and-user-groups'].path} element={<UsersAndUserGroups />}>
            <Route {...v2Guard([principals.canList])}>
              <Route path={pathnames['users-new'].path} element={<AccessManagementUsers />}>
                <Route {...v2GuardOrgAdmin()}>
                  <Route path={pathnames['invite-group-users'].path} element={outletElement(InviteUsersModalCommonAuth)} />
                </Route>
              </Route>
            </Route>
            <Route {...v2Guard([groups.canView])}>
              <Route path={pathnames['user-groups'].path} element={<AccessManagementUserGroups />}>
                <Route path={pathnames['create-user-group'].path} element={<AddGroupWizard />} />
              </Route>
            </Route>
          </Route>
        </Route>
        <Route {...v2Guard([groups.canCreate])}>
          <Route path={pathnames['users-and-user-groups-edit-group'].path} element={<EditUserGroup />} />
          <Route path={pathnames['users-and-user-groups-create-group'].path} element={<CreateUserGroup />} />
        </Route>

        {/* Roles — require roles view */}
        <Route {...v2Guard([roles.canView])}>
          <Route path={pathnames['access-management-roles'].path} element={<RolesWithWorkspaces />}>
            <Route {...v2Guard([roles.canCreate])}>
              <Route
                path={pathnames['access-management-add-role'].path}
                element={outletElement(AddRoleWizard, pathnames['access-management-add-role'].path)}
              />
            </Route>
          </Route>
        </Route>
        <Route {...v2Guard([roles.canUpdate])}>
          <Route path={`${pathnames['access-management-roles'].link()}/${pathnames['access-management-edit-role'].path}`} element={<EditRole />} />
        </Route>

        {/* Workspaces — view gate disabled (new orgs may have zero standard workspaces) */}
        <Route path={pathnames['workspace-detail'].path} element={<WorkspaceDetail />}>
          <Route {...v2WorkspaceGuard('edit')}>
            <Route path={pathnames['edit-workspace'].path} element={outletElement(EditWorkspaceModal, pathnames['edit-workspace'].path)} />
            <Route path={pathnames['workspace-role-access'].path} element={outletElement(RoleAccessModal, pathnames['workspace-role-access'].path)} />
          </Route>
        </Route>
        <Route path={pathnames['access-management-workspaces'].path} element={<WorkspaceList />}>
          <Route {...v2WorkspaceGuard('create')}>
            <Route path={pathnames['create-workspace'].path} element={<CreateWorkspaceWizard />} />
          </Route>
          <Route {...v2WorkspaceGuard('edit')}>
            <Route
              path={pathnames['edit-workspaces-list'].path}
              element={outletElement(EditWorkspaceModal, pathnames['edit-workspaces-list'].path)}
            />
          </Route>
        </Route>

        {/* Audit Log — org admin only */}
        <Route {...v2GuardOrgAdmin()}>
          <Route path={pathnames['access-management-audit-log'].path} element={<AuditLog />} />
        </Route>

        {/* Organization Management — requires orgAdmin */}
        <Route {...v2GuardOrgAdmin()}>
          <Route path={pathnames['organization-management'].path} element={<OrganizationManagement />} />
        </Route>

        <Route path="*" element={<Navigate to={toAppLink(pathnames['my-access'].link())} />} />
      </Routes>
    </Suspense>
  );
};

export default V2Routing;
