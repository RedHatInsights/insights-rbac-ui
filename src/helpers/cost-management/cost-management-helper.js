import { getCostApi } from '../shared/user-login';

function isObjectResponse(response) {
  return typeof response === 'object' && response !== null && !Array.isArray(response);
}

const costApi = getCostApi();

export async function getResourceDefinitions(apiProps) {
  try {
    const res = await costApi.getResourceTypes(apiProps);
    if (isObjectResponse(res)) {
      return res;
    }
  } catch {
    // this API can be not available on some environments
  }

  return {
    data: [],
    links: {},
    meta: { count: 0, limit: 10, offset: 0 },
  };
}

export async function getResource(apiProps) {
  return await costApi.getResource(apiProps);
}
