let ApprovalApi = require('insights_service_approval_ap_is');

import { APPROVAL_API_BASE } from '../../Utilities/Constants';

const defaultClient = ApprovalApi.ApiClient.instance;
defaultClient.basePath = APPROVAL_API_BASE;

let approvalApi = new ApprovalApi.AdminsApi();

export function getApprovalApi() {
  return approvalApi;
}
