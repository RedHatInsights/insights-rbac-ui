
import { getPolicyApi } from '../shared/user-login';

/*
data :
{
    "name": "TestLG3",
    "description": "TestLG3",
    "group":  "d6b1bcaa-e6eb-4d38-8512-a736eec9a6c7" ,
    "roles": ["4c1c4c87-09f0-4062-905a-e5c48623aeeb"]
}
*/

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
