import { getAccessApi } from '../../api/httpClient';

// Interface for helper parameters - exported for reuse in actions
export interface GetPrincipalAccessParams {
  limit?: number;
  offset?: number;
  username?: string;
  application?: string; // Often comma-separated list
  status?: string;
  orderBy?: string;
}

const accessApi = getAccessApi();

export async function getPrincipalAccess({ limit, offset, username, application = '', status, orderBy }: GetPrincipalAccessParams): Promise<unknown> {
  // NOTE: @redhat-cloud-services/rbac-client has completely broken TypeScript types
  // - API expects undefined for optional parameters, not explicit defaults
  // - Using (apiMethod as any) to bypass broken type definitions
  return await (accessApi.getPrincipalAccess as any)(application, username, orderBy, status, limit, offset);
}
