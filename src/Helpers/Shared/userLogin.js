let ApprovalApi = require('insights_service_approval_ap_is');

import { APPROVAL_API_BASE } from '../../Utilities/Constants';

const defaultClient = ApprovalApi.ApiClient.instance;
defaultClient.basePath = APPROVAL_API_BASE;

let approvalApi = new ApprovalApi.AdminsApi();

export function getApprovalApi() {
  return approvalApi;
}

let RoleBasedAccessControl = require('role_based_access_control');

let defaultRbacClient = RoleBasedAccessControl.ApiClient.instance;
// Configure HTTP basic authorization: basic_auth
let rbac_basic_auth = defaultRbacClient.authentications['basic_auth'];
rbac_basic_auth.username = 'lgalis@redhat.com';
rbac_basic_auth.password = 'redhat';

let rbacApi = new RoleBasedAccessControl.AccessApi();

export function getRbacApi() {
  return rbacApi;
}
