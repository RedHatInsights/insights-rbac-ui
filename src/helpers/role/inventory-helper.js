
import { getInventoryGroupsApi } from '../shared/user-login';
import { useFlag } from '@unleash/proxy-client-react';
import { useChrome } from '@redhat-cloud-services/frontend-components/useChrome';
import flatten from 'lodash/flatten';
import { getInventoryGroupsApi, getInventoryResourceTypesApi } from '../shared/user-login';

const inventoryResourceTypesApi = getInventoryResourceTypesApi();
const inventoryGroupsApi = getInventoryGroupsApi();
const { isBeta } = useChrome();

export const getInventoryGroups = async ({ name, perPage, page, options } = {}) => {
  return await inventoryResourceTypesApi.apiResourceTypeGetResourceTypeGroupsList(name, perPage, page, options);
};

export const enableWorkspacesNameChange = isBeta && useFlag('platform.rbac.groups-to-workspaces-rename');

export const getInventoryGroupsDetails = async (groupsIds) => {
  return await inventoryGroupsApi.apiGroupGetGroupsById(groupsIds);
};

export const processResourceDefinitions = (resourceDefinitions) =>
  resourceDefinitions ? flatten(resourceDefinitions.map((definition) => definition.attributeFilter.value)) : [];

