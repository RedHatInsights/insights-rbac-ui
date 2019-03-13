import { RBAC_API_BASE, RBAC_USER, RBAC_PWD } from '../../Utilities/Constants';
import { AccessApi, PrincipalApi, GroupApi, ApiClient } from 'rbac_api_jsclient';

const defaultRbacClient = ApiClient.instance;
defaultRbacClient.basePath = RBAC_API_BASE;

let rbac_basic_auth = defaultRbacClient.authentications.basic_auth;

if (RBAC_USER && RBAC_PWD) {
  rbac_basic_auth.username = RBAC_USER;
  rbac_basic_auth.password = RBAC_PWD;
}

let rbacApi = new AccessApi();
let principalApi = new PrincipalApi();
let groupApi = new GroupApi();

export function getRbacApi() {
  return rbacApi;
}

export function getPrincipalApi() {
  return principalApi;
}

export function getGroupApi() {
  return groupApi;
}
