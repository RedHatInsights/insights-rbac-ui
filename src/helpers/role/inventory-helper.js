import { getInventoryGroupsApi, getInventoryResourceTypesApi } from '../shared/user-login';

const inventoryResourceTypesApi = getInventoryResourceTypesApi();
const inventoryGroupsApi = getInventoryGroupsApi();

export const getInventoryGroups = async ({ name, perPage, page, options } = {}) => {
  return await inventoryResourceTypesApi.apiResourceTypeGetResourceTypeGroupsList(name, perPage, page, options);
};
};
