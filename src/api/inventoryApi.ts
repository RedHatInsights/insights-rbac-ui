import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import { apiGroupGetGroupsById, apiResourceTypeGetResourceTypeGroupsList } from '@redhat-cloud-services/host-inventory-client';
import { axiosInstance } from './axiosConfig';
import { INVENTORY_API_BASE } from '../utilities/constants';

// Type for the sendRequest function that APIFactory passes
type SendRequest = (config: Promise<unknown>) => Promise<unknown>;

/**
 * Wrapper to make host-inventory-client paramCreator functions compatible with APIFactory.
 *
 * The rbac-client exports functions that expect sendRequest as first arg and call it:
 *   function getRoleParamCreator(sendRequest, ...args) { return sendRequest(config); }
 *
 * But host-inventory-client exports paramCreator functions that don't expect sendRequest:
 *   function apiGroupGetGroupsByIdParamCreator(...args) { return config; }
 *
 * This wrapper bridges that gap by:
 * 1. Accepting sendRequest as first arg (from APIFactory)
 * 2. Calling the paramCreator with remaining args
 * 3. Passing the result to sendRequest to make the actual HTTP call
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function wrapParamCreator(paramCreator: (...args: any[]) => Promise<any>) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return async (sendRequest: SendRequest, ...args: any[]): Promise<any> => {
    const config = await paramCreator(...args);
    return sendRequest(Promise.resolve(config));
  };
}

// Wrap the inventory client paramCreator functions to work with APIFactory
const inventoryResourceTypesEndpoints = {
  apiResourceTypeGetResourceTypeGroupsList: wrapParamCreator(apiResourceTypeGetResourceTypeGroupsList),
};

const inventoryResourceTypesApi = APIFactory<typeof inventoryResourceTypesEndpoints>(INVENTORY_API_BASE, inventoryResourceTypesEndpoints, {
  axios: axiosInstance,
});

const inventoryGroupsEndpoints = {
  apiGroupGetGroupsById: wrapParamCreator(apiGroupGetGroupsById),
};

const inventoryGroupsApi = APIFactory<typeof inventoryGroupsEndpoints>(INVENTORY_API_BASE, inventoryGroupsEndpoints, {
  axios: axiosInstance,
});

export function getInventoryResourceTypesApi() {
  return inventoryResourceTypesApi;
}

export function getInventoryGroupsApi() {
  return inventoryGroupsApi;
}
