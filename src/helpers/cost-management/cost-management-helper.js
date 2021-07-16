import { getCostApi } from '../shared/user-login';

const costApi = getCostApi();

export async function getResourceDefinitions(apiProps) {
  return await costApi.getResourceTypes(apiProps);
}

export async function getResource(apiProps) {
  return await costApi.getResource(apiProps);
}
