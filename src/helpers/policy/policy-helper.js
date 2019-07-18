
import { getPolicyApi } from '../shared/user-login';

const policyApi = getPolicyApi();

export async function fetchPolicies({ limit, offset }) {
  let policiesData = await policyApi.listPolicies(limit, offset);
  let policies = policiesData.data;
  return Promise.all(policies.map(async policy => {
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

export async function removePolicy(policyId) {
  return await policyApi.deletePolicy(policyId);
}
