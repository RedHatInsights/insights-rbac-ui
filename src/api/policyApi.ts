import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import createPolicies from '@redhat-cloud-services/rbac-client/CreatePolicies';
import deletePolicy from '@redhat-cloud-services/rbac-client/DeletePolicy';
import getPolicy from '@redhat-cloud-services/rbac-client/GetPolicy';
import listPolicies from '@redhat-cloud-services/rbac-client/ListPolicies';
import updatePolicy from '@redhat-cloud-services/rbac-client/UpdatePolicy';
import { axiosInstance } from './axiosConfig';
import { RBAC_API_BASE } from '../utilities/constants';

const policyApiEndpoints = {
  listPolicies,
  getPolicy,
  updatePolicy,
  createPolicies,
  deletePolicy,
};

const policyApi = APIFactory<typeof policyApiEndpoints>(RBAC_API_BASE, policyApiEndpoints, { axios: axiosInstance });

export function getPolicyApi() {
  return policyApi;
}
