import { useFlag } from '@unleash/proxy-client-react';
import React, { Suspense, lazy, useEffect } from 'react';
import { Navigate, Route, Routes, matchPath, useLocation, useParams } from 'react-router-dom';
import { mergeToBasename, useAppLink } from '../shared/hooks/useAppLink';
import { useWorkspacesFlag } from '../shared/hooks/useWorkspacesFlag';
import { usePlatformTracking } from '../shared/hooks/usePlatformTracking';
import { AppPlaceholder } from '../shared/components/ui-states/LoaderPlaceholders';
import ElementWrapper from '../shared/components/ElementWrapper';
import { guard } from './components/PermissionGuard';
import pathnames from './utilities/pathnames';
import QuickstartsTestButtons from './utilities/quickstartsTestButtons';

// eslint-disable-next-line @typescript-eslint/no-explicit-any -- outlet context props are injected at runtime via ElementWrapper/cloneElement
const outletElement = (Component: React.ComponentType<any>, path?: string) => (
  <ElementWrapper path={path}>
    <Component />
  </ElementWrapper>
);

const Overview = lazy(() => import('./features/overview/overview'));

const WorkspacesOverview = lazy(() => import('../v2/features/workspaces/overview/WorkspacesOverview'));
const WorkspaceList = lazy(() => import('../v2/features/workspaces/WorkspaceList'));
const CreateWorkspaceWizard = lazy(() => import('../v2/features/workspaces/create-workspace/CreateWorkspaceWizard'));
const WorkspaceDetail = lazy(() => import('../v2/features/workspaces/workspace-detail/WorkspaceDetail'));
const EditWorkspaceModal = lazy(() => import('../v2/features/workspaces/EditWorkspaceModal'));
const Users = lazy(() => import('./features/users/users'));
const UserDetail = lazy(() => import('./features/users/User'));
const AddUserToGroup = lazy(() => import('./features/users/add-user-to-group/AddUserToGroup'));
const InviteUsersModal = lazy(() => import('./features/users/invite-users/InviteUsersModal'));
const InviteUsersModalCommonAuth = lazy(() => import('./features/users/invite-users/invite-users-modal-common-auth'));

const Roles = lazy(() => import('./features/roles/Roles'));
const Role = lazy(() => import('./features/roles/role/Role'));
const AddRoleWizard = lazy(() => import('./features/roles/add-role/AddRoleWizard'));
const EditRole = lazy(() => import('./features/roles/EditRoleModal'));
const RemoveRole = lazy(() => import('./features/roles/RemoveRoleModal'));
const AddRolePermissionWizard = lazy(() => import('./features/roles/add-role-permissions/AddRolePermissionWizard'));
const ResourceDefinitions = lazy(() => import('./features/roles/RoleResourceDefinitions'));
const EditResourceDefinitionsModal = lazy(() => import('./features/roles/EditResourceDefinitionsModal'));
const AddGroupRoles = lazy(() => import('./features/groups/group/role/AddGroupRoles'));

const Groups = lazy(() => import('./features/groups/Groups'));
const Group = lazy(() => import('./features/groups/group/Group'));
const AddGroupWizard = lazy(() => import('./features/groups/add-group/AddGroupWizard'));
const EditGroup = lazy(() => import('./features/groups/EditGroupModal'));
const RemoveGroup = lazy(() => import('./features/groups/RemoveGroupModal'));
const GroupMembers = lazy(() => import('./features/groups/group/members/GroupMembers'));
const GroupRoles = lazy(() => import('./features/groups/group/role/GroupRoles'));
const GroupServiceAccounts = lazy(() => import('./features/groups/group/service-account/GroupServiceAccounts'));
const AddGroupMembers = lazy(() => import('./features/groups/group/member/AddGroupMembers'));
const AddGroupServiceAccounts = lazy(() => import('./features/groups/group/service-account/AddGroupServiceAccounts'));
const RemoveServiceAccountFromGroup = lazy(() => import('./features/groups/group/service-account/RemoveGroupServiceAccounts'));
const QuickstartsTest = lazy(() => import('./features/quickstarts/QuickstartsTest'));
const MyUserAccessPage = lazy(() => import('./features/myUserAccess/MyUserAccess'));

const GroupDetailRedirect = () => {
  const { groupId = '' } = useParams();
  return <Navigate to={mergeToBasename(pathnames['group-detail-roles'].link(groupId)) as string} />;
};

export const V1Routing = () => {
  const location = useLocation();
  const { setDocumentTitle } = usePlatformTracking();
  const isITLess = useFlag('platform.rbac.itless');
  const isCommonAuthModel = useFlag('platform.rbac.common-auth-model');
  const enableServiceAccounts = useFlag('platform.rbac.group-service-accounts.stable');
  const hasRbacDetailPages = useWorkspacesFlag('m3');
  const hasWorkspacesList = useWorkspacesFlag('m1');
  const hideWorkspaceDetails = hasWorkspacesList && !hasRbacDetailPages;
  const toAppLink = useAppLink();

  useEffect(() => {
    const currPath = Object.values(pathnames).find((item) => !!matchPath({ path: item.path, end: true }, location.pathname));
    if (currPath?.title) setDocumentTitle(`${currPath.title} - User Access`);
  }, [location.pathname, setDocumentTitle]);

  return (
    <Suspense fallback={<AppPlaceholder />}>
      <QuickstartsTestButtons />
      <Routes>
        {/* Overview */}
        <Route {...guard(['rbac:*:read'])}>
          <Route path={pathnames.overview.path} element={hasWorkspacesList ? <WorkspacesOverview /> : <Overview />} />
        </Route>

        {/* Workspaces */}
        <Route {...guard(['inventory:groups:read'])}>
          <Route path={pathnames.workspaces.path} element={<WorkspaceList />}>
            <Route {...guard(['inventory:groups:write'])}>
              <Route path={pathnames['create-workspace'].path} element={<CreateWorkspaceWizard />} />
              <Route
                path={pathnames['edit-workspaces-list'].path}
                element={outletElement(EditWorkspaceModal, pathnames['edit-workspaces-list'].path)}
              />
            </Route>
          </Route>

          {/* Workspace Detail */}
          {!hideWorkspaceDetails && (
            <Route path={pathnames['workspace-detail'].path} element={<WorkspaceDetail />}>
              <Route {...guard(['inventory:groups:write'])}>
                <Route path={pathnames['edit-workspace'].path} element={outletElement(EditWorkspaceModal, pathnames['edit-workspace'].path)} />
              </Route>
            </Route>
          )}
        </Route>

        {/* Users */}
        <Route {...guard(['rbac:principal:read'])}>
          <Route path={pathnames.users.path} element={<Users />}>
            {(isITLess || isCommonAuthModel) && (
              <Route {...guard(['rbac:principal:write'])}>
                <Route
                  path={pathnames['invite-users'].path}
                  element={isCommonAuthModel ? outletElement(InviteUsersModalCommonAuth) : outletElement(InviteUsersModal)}
                />
              </Route>
            )}
          </Route>

          {/* User Detail */}
          <Route path={pathnames['user-detail'].path} element={<UserDetail />}>
            <Route {...guard(['rbac:principal:write'])}>
              <Route path={pathnames['add-user-to-group'].path} element={<AddUserToGroup />} />
            </Route>
            <Route {...guard(['rbac:group:write'])}>
              <Route path={pathnames['user-add-group-roles'].path} element={<AddGroupRoles />} />
            </Route>
          </Route>
        </Route>

        {/* Roles */}
        <Route {...guard(['rbac:role:read'])}>
          <Route path={pathnames.roles.path} element={<Roles />}>
            <Route path={pathnames['roles-add-group-roles'].path} element={<AddGroupRoles />} />
            <Route {...guard(['rbac:role:write'])}>
              <Route path={pathnames['add-role'].path} element={outletElement(AddRoleWizard, pathnames['add-role'].path)} />
              <Route path={pathnames['remove-role'].path} element={outletElement(RemoveRole, pathnames['remove-role'].path)} />
              <Route path={pathnames['edit-role'].path} element={outletElement(EditRole, pathnames['edit-role'].path)} />
            </Route>
          </Route>

          {/* Role Detail */}
          <Route path={pathnames['role-detail'].path} element={<Role />}>
            <Route {...guard(['rbac:role:write'])}>
              <Route path={pathnames['role-detail-remove'].path} element={outletElement(RemoveRole, pathnames['role-detail-remove'].path)} />
              <Route path={pathnames['role-detail-edit'].path} element={outletElement(EditRole, pathnames['role-detail-edit'].path)} />
              <Route
                path={pathnames['role-add-permission'].path}
                element={outletElement(AddRolePermissionWizard, pathnames['role-add-permission'].path)}
              />
            </Route>
          </Route>

          {/* Role Permission Detail */}
          <Route path={pathnames['role-detail-permission'].path} element={<ResourceDefinitions />}>
            <Route {...guard(['rbac:role:write'])}>
              <Route
                path={pathnames['role-detail-permission-edit'].path}
                element={outletElement(EditResourceDefinitionsModal, pathnames['role-detail-permission-edit'].path)}
              />
            </Route>
          </Route>

          {/* Group Role Detail (standalone) */}
          <Route path={pathnames['group-detail-role-detail'].path} element={<Role />} />
        </Route>

        {/* Groups */}
        <Route {...guard(['rbac:group:read'])}>
          <Route path={pathnames.groups.path} element={<Groups />}>
            <Route {...guard(['rbac:group:write'])}>
              <Route path={pathnames['add-group'].path} element={<AddGroupWizard />} />
              <Route path={pathnames['edit-group'].path} element={outletElement(EditGroup, pathnames['edit-group'].path)} />
              <Route path={pathnames['remove-group'].path} element={outletElement(RemoveGroup, pathnames['remove-group'].path)} />
            </Route>
          </Route>

          {/* Group Detail */}
          <Route path={pathnames['group-detail'].path} element={<Group />}>
            <Route path={pathnames['group-detail'].path} element={<GroupDetailRedirect />} />
            <Route path={pathnames['group-detail-roles'].path} element={<GroupRoles />}>
              <Route {...guard(['rbac:group:write'])}>
                <Route path={pathnames['group-roles-edit-group'].path} element={outletElement(EditGroup, pathnames['group-roles-edit-group'].path)} />
                <Route
                  path={pathnames['group-roles-remove-group'].path}
                  element={outletElement(RemoveGroup, pathnames['group-roles-remove-group'].path)}
                />
                <Route path={pathnames['group-add-roles'].path} element={<AddGroupRoles />} />
              </Route>
            </Route>
            <Route path={pathnames['group-detail-members'].path} element={<GroupMembers />}>
              <Route {...guard(['rbac:group:write'])}>
                <Route
                  path={pathnames['group-members-edit-group'].path}
                  element={outletElement(EditGroup, pathnames['group-members-edit-group'].path)}
                />
                <Route
                  path={pathnames['group-members-remove-group'].path}
                  element={outletElement(RemoveGroup, pathnames['group-members-remove-group'].path)}
                />
                <Route path={pathnames['group-add-members'].path} element={outletElement(AddGroupMembers, pathnames['group-add-members'].path)} />
              </Route>
            </Route>
            {enableServiceAccounts && (
              <Route path={pathnames['group-detail-service-accounts'].path} element={<GroupServiceAccounts />}>
                <Route {...guard(['rbac:group:write'])}>
                  <Route
                    path={pathnames['group-service-accounts-edit-group'].path}
                    element={outletElement(EditGroup, pathnames['group-service-accounts-edit-group'].path)}
                  />
                  <Route
                    path={pathnames['group-service-accounts-remove-group'].path}
                    element={outletElement(RemoveServiceAccountFromGroup, pathnames['group-service-accounts-remove-group'].path)}
                  />
                  <Route
                    path={pathnames['group-add-service-account'].path}
                    element={outletElement(AddGroupServiceAccounts, pathnames['group-add-service-account'].path)}
                  />
                </Route>
              </Route>
            )}
          </Route>
        </Route>

        {/* Quickstarts (dev only) */}
        {localStorage.getItem('quickstarts:enabled') === 'true' && <Route path={pathnames['quickstarts-test'].path} element={<QuickstartsTest />} />}

        {/* My User Access (public) */}
        <Route path={pathnames['my-user-access'].path} element={<MyUserAccessPage />} />

        <Route path="*" element={<Navigate to={toAppLink(pathnames['my-user-access'].link())} />} />
      </Routes>
    </Suspense>
  );
};

export default V1Routing;
