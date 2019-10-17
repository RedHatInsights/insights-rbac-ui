import { RBAC_API_BASE } from '../../utilities/constants';
import { getPolicyApi, getAxiosInstance } from '../shared/user-login';

const policyApi = getPolicyApi();
const axiosInstance = getAxiosInstance();

export async function fetchGroupPolicies({ group_uuid, limit, offset }) {
  let policiesData = await policyApi.listPolicies(limit, offset, undefined, undefined, group_uuid);
  let policies = policiesData.data;
  return await Promise.all(policies.map(async policy => {
    let policyWithRoles = await policyApi.getPolicy(policy.uuid);
    return { ...policy, roles: policyWithRoles.roles };
  })).then(data => ({
    ...policiesData,
    data
  }));
}

export async function fetchPolicy(uuid) {
  return await policyApi.getPolicy(uuid);
}

export async function createPolicy(data) {
  return await policyApi.createPolicies(data);
}

export async function updatePolicy(uuid, data) {
  return await policyApi.updatePolicy(uuid, data);
}

export async function removePolicy(policyId) {
  return await policyApi.deletePolicy(policyId);
}

export function fetchPolicyByName(name = '') {
  return axiosInstance.get(`${RBAC_API_BASE}/policies/?name=${name}`);
}
