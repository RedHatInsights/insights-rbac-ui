import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import listPrincipals from '@redhat-cloud-services/rbac-client/ListPrincipals';
import { axiosInstance } from './axiosConfig';
import { RBAC_API_BASE } from '../utilities/constants';

const principalApiEndpoints = {
  listPrincipals,
};

const principalApi = APIFactory<typeof principalApiEndpoints>(RBAC_API_BASE, principalApiEndpoints, {
  axios: axiosInstance,
});

export function getPrincipalApi() {
  return principalApi;
}
