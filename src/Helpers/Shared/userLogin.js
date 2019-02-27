import { RBAC_API_BASE, RBAC_USER, RBAC_PWD } from '../../Utilities/Constants';

let RoleBasedAccessControl = require('role_based_access_control');

// Configure HTTP basic authorization: basic_auth
let defaultRbacClient = RoleBasedAccessControl.ApiClient.instance;
defaultRbacClient.basePath = RBAC_API_BASE;

let rbac_basic_auth = defaultRbacClient.authentications.basic_auth;

if (RBAC_USER && RBAC_PWD) {
  rbac_basic_auth.username = RBAC_USER;
  rbac_basic_auth.password = RBAC_PWD;
}

let rbacApi = new RoleBasedAccessControl.AccessApi();
let principalApi = new RoleBasedAccessControl.PrincipalApi();
let groupApi = new RoleBasedAccessControl.GroupApi();

export function getRbacApi() {
  return rbacApi;
}

export function getPrincipalApi() {
  return principalApi;
}

export function getGroupApi() {
  return groupApi;
}
