import { getInventoryGroupsApi } from '../shared/user-login';

const inventoryGroupsApi = getInventoryGroupsApi();

// export const getInventoryGroupsApi = async () => {
//   return {
//     getInventoryGroups: () => inventoryApi.axios.get(`${INVENTORY_API_BASE}/groups`),
//   }
// };

export const getInventoryGroups = async (apiProps) => {
  return await inventoryGroupsApi.getInventoryGroups(apiProps);
};
