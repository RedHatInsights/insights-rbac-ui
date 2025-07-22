import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import {
  ApiGroupGetGroupsByIdReturnType,
  ApiResourceTypeGetResourceTypeGroupsListReturnType,
  apiGroupGetGroupsById,
  apiResourceTypeGetResourceTypeGroupsList,
} from '@redhat-cloud-services/host-inventory-client';
import { axiosInstance } from './axiosConfig';
import { INVENTORY_API_BASE } from '../utilities/constants';

const inventoryResourceTypesEndpoints = {
  apiResourceTypeGetResourceTypeGroupsList,
};

type inventoryResourceTypesEndpointsReturnTypes = {
  apiResourceTypeGetResourceTypeGroupsList: ApiResourceTypeGetResourceTypeGroupsListReturnType;
};

const inventoryResourceTypesApi = APIFactory<typeof inventoryResourceTypesEndpoints, inventoryResourceTypesEndpointsReturnTypes>(
  INVENTORY_API_BASE,
  inventoryResourceTypesEndpoints,
  { axios: axiosInstance },
);

const inventoryGroupsEndpoints = {
  apiGroupGetGroupsById,
};

type inventoryGroupsEndpointsReturnTypes = {
  apiGroupGetGroupsById: ApiGroupGetGroupsByIdReturnType;
};

const inventoryGroupsApi = APIFactory<typeof inventoryGroupsEndpoints, inventoryGroupsEndpointsReturnTypes>(
  INVENTORY_API_BASE,
  inventoryGroupsEndpoints,
  { axios: axiosInstance },
);

export function getInventoryResourceTypesApi() {
  return inventoryResourceTypesApi;
}

export function getInventoryGroupsApi() {
  return inventoryGroupsApi;
}
