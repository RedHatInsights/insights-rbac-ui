import { AdminsApi, ApiClient as ApprovalApiClient } from '@manageiq/approval-api';
import { APPROVAL_API_BASE } from '../../Utilities/Constants';

const defaultClient = ApprovalApiClient.instance;
defaultClient.basePath = APPROVAL_API_BASE;

let approvalApi = new AdminsApi();

export function getApprovalApi() {
  return approvalApi;
}

