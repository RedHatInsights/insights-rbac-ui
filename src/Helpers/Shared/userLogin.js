let ApprovalApi = require('insights_service_approval_ap_is');

import { APPROVAL_API_BASE, RBAC_API_BASE } from '../../Utilities/Constants';

const defaultClient = ApprovalApi.ApiClient.instance;
defaultClient.basePath = APPROVAL_API_BASE;

let approvalApi = new ApprovalApi.AdminsApi();

export function getApprovalApi() {
  return approvalApi;
}

let RoleBasedAccessControl = require('role_based_access_control');

// Configure HTTP basic authorization: basic_auth
let defaultRbacClient = RoleBasedAccessControl.ApiClient.instance;
defaultRbacClient.basePath = RBAC_API_BASE;

let rbac_basic_auth = defaultRbacClient.authentications.basic_auth;
rbac_basic_auth.username = 'mkanoor@redhat.com';
rbac_basic_auth.password = 'redhat';

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
