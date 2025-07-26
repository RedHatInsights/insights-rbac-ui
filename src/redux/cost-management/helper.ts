import { getCostApi } from '../../api/httpClient';

// Type for API configuration
interface ApiProps {
  [key: string]: unknown;
}

// Type for response structure
interface ResourceResponse {
  data: unknown[];
  links: Record<string, unknown>;
  meta: {
    count: number;
    limit: number;
    offset: number;
  };
}

function isObjectResponse(response: unknown): response is Record<string, unknown> {
  return typeof response === 'object' && response !== null && !Array.isArray(response);
}

const costApi = getCostApi();

export async function getResourceDefinitions(apiProps: ApiProps): Promise<ResourceResponse> {
  try {
    // NOTE: Following our Redux helpers rule - cost API may have broken type definitions
    // - Using (apiMethod as any) to bypass potentially broken type definitions
    const res = await (costApi.getResourceTypes as any)(apiProps);
    if (isObjectResponse(res)) {
      return res as unknown as ResourceResponse; // Use unknown first for safer type assertion
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

export async function getResource(apiProps: ApiProps): Promise<unknown> {
  // NOTE: Following our Redux helpers rule - cost API may have broken type definitions
  // - Using (apiMethod as any) to bypass potentially broken type definitions
  return await (costApi.getResource as any)(apiProps);
}
