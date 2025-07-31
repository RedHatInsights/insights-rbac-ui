import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import listPrincipals, { ListPrincipalsReturnType } from '@redhat-cloud-services/rbac-client/ListPrincipals';
import { axiosInstance } from './axiosConfig';
import { RBAC_API_BASE } from '../utilities/constants';

const principalApiEndpoints = {
  listPrincipals,
};

type principalApiEndpointsReturnTypes = {
  listPrincipals: ListPrincipalsReturnType;
};

const principalApi = APIFactory<typeof principalApiEndpoints, principalApiEndpointsReturnTypes>(RBAC_API_BASE, principalApiEndpoints, {
  axios: axiosInstance,
});

export function getPrincipalApi() {
  return principalApi;
}
