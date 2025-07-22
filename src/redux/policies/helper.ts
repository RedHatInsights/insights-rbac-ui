import { RBAC_API_BASE } from '../../utilities/constants';
import { getPolicyApi } from '../../api/policyApi';
import { axiosInstance } from '../../api/axiosConfig';
import { PolicyExtended, PolicyIn, PolicyPagination } from '@redhat-cloud-services/rbac-client/types';
import { ListPoliciesOrderByEnum, ListPoliciesScopeEnum } from '@redhat-cloud-services/rbac-client/ListPolicies';

const policyApi = getPolicyApi();

export interface FetchGroupPoliciesParams {
  group_uuid?: string;
  limit?: number;
  offset?: number;
  name?: string;
  scope?: ListPoliciesScopeEnum;
  groupName?: string;
  orderBy?: ListPoliciesOrderByEnum;
}

export async function fetchGroupPolicies(params: FetchGroupPoliciesParams): Promise<PolicyPagination> {
  const { group_uuid, limit, offset, name, scope, groupName, orderBy } = params;

  // NOTE: @redhat-cloud-services/rbac-client has completely broken TypeScript types
  // - API expects undefined for optional parameters, not explicit defaults like limit || 20
  // - Parameters must be undefined instead of empty strings or explicit defaults to work correctly
  // - Using (apiMethod as any) to bypass the broken type definitions
  return await (policyApi.listPolicies as any)(
    limit,
    offset,
    name,
    scope,
    groupName,
    group_uuid,
    orderBy,
    undefined, // options - undefined instead of empty object
  );
}

export async function fetchPolicy(uuid: string): Promise<PolicyExtended> {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  return await (policyApi.getPolicy as any)(uuid, undefined);
}

export async function createPolicy(data: PolicyIn): Promise<PolicyExtended> {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  return await (policyApi.createPolicies as any)(data, undefined);
}

export async function updatePolicy(uuid: string, data: PolicyIn): Promise<PolicyExtended> {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  return await (policyApi.updatePolicy as any)(uuid, data, undefined);
}

export async function removePolicy(policyId: string): Promise<void> {
  // NOTE: @redhat-cloud-services/rbac-client broken types - using (as any) to bypass
  return await (policyApi.deletePolicy as any)(policyId, undefined);
}

export function fetchPolicyByName(name: string = ''): Promise<{ data: PolicyPagination }> {
  return axiosInstance.get(`${RBAC_API_BASE}/policies/?name=${name}`);
}
