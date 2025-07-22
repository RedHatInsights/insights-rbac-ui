import flatten from 'lodash/flatten';
import { getInventoryGroupsApi, getInventoryResourceTypesApi } from '../../api/httpClient';

// Type definitions for resource definitions
interface AttributeFilter {
  value: unknown[];
}

interface ResourceDefinition {
  attributeFilter: AttributeFilter;
  [key: string]: unknown;
}

// Interface for inventory groups config
interface InventoryGroupsConfig {
  name?: string;
  perPage?: number;
  page?: number;
  options?: Record<string, unknown>;
}

const inventoryResourceTypesApi = getInventoryResourceTypesApi();
const inventoryGroupsApi = getInventoryGroupsApi();

export const getInventoryGroups = async (config: InventoryGroupsConfig = {}): Promise<unknown> => {
  const { name, perPage, page, options } = config;
  // NOTE: Following our Redux helpers rule - inventory API may have broken type definitions
  // - Using (apiMethod as any) to bypass potentially broken type definitions
  return await (inventoryResourceTypesApi.apiResourceTypeGetResourceTypeGroupsList as any)(name, perPage, page, options);
};

export const getInventoryGroupsDetails = async (groupsIds: string[]): Promise<unknown> => {
  // NOTE: Following our Redux helpers rule - inventory API may have broken type definitions
  // - Using (apiMethod as any) to bypass potentially broken type definitions
  return await (inventoryGroupsApi.apiGroupGetGroupsById as any)(groupsIds);
};

export const processResourceDefinitions = (resourceDefinitions?: ResourceDefinition[]): unknown[] =>
  resourceDefinitions ? flatten(resourceDefinitions.map((definition) => definition.attributeFilter.value)) : [];
