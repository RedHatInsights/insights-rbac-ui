import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import createPolicies from '@redhat-cloud-services/rbac-client/CreatePolicies';
import deletePolicy from '@redhat-cloud-services/rbac-client/DeletePolicy';
import getPolicy from '@redhat-cloud-services/rbac-client/GetPolicy';
import listPolicies from '@redhat-cloud-services/rbac-client/ListPolicies';
import updatePolicy from '@redhat-cloud-services/rbac-client/UpdatePolicy';
import { axiosInstance } from './axiosConfig';
import { RBAC_API_BASE } from '../utilities/constants';
import { PolicyExtended, PolicyPagination } from '@redhat-cloud-services/rbac-client/types';

const policyApiEndpoints = {
  listPolicies,
  getPolicy,
  updatePolicy,
  createPolicies,
  deletePolicy,
};

// These types reflect what our responseDataInterceptor actually returns
// (unwrapped data instead of AxiosPromise<data>)
type policyApiEndpointsReturnTypes = {
  listPolicies: PolicyPagination;
  getPolicy: PolicyExtended;
  createPolicies: PolicyExtended;
  updatePolicy: PolicyExtended;
  deletePolicy: void;
};

const policyApi = APIFactory<typeof policyApiEndpoints, policyApiEndpointsReturnTypes>(RBAC_API_BASE, policyApiEndpoints, { axios: axiosInstance });

export function getPolicyApi() {
  return policyApi;
}
