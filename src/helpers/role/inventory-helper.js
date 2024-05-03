import flatten from 'lodash/flatten';
import { getInventoryGroupsApi, getInventoryResourceTypesApi } from '../shared/user-login';

const inventoryResourceTypesApi = getInventoryResourceTypesApi();
const inventoryGroupsApi = getInventoryGroupsApi();

export const getInventoryGroups = async ({ name, perPage, page, options } = {}) => {
  return await inventoryResourceTypesApi.apiResourceTypeGetResourceTypeGroupsList(name, perPage, page, options);
};

export const getInventoryGroupsDetails = async (groupsIds) => {
  return await inventoryGroupsApi.apiGroupGetGroupsById(groupsIds);
};

export const processResourceDefinitions = (resourceDefinitions) =>
  resourceDefinitions ? flatten(resourceDefinitions.map((definition) => definition.attributeFilter.value)) : [];
