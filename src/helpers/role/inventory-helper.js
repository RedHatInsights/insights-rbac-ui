import { getInventoryGroupsApi } from '../shared/user-login';

const inventoryGroupsApi = getInventoryGroupsApi();

export const getInventoryGroups = async (apiProps) => {
  return await inventoryGroupsApi.getInventoryGroups(apiProps);
};
