import { FETCH_RESOURCE, FETCH_RESOURCE_DEFINITIONS } from './action-types';
import { getResource, getResourceDefinitions } from './helper';

// Based on cost API usage patterns, apiProps is typically a configuration object
interface ApiProps {
  [key: string]: unknown;
}

// Using global ReduxAction interface from store.d.ts
export const fetchResourceDefinitions = (apiProps: ApiProps): ReduxAction<Promise<unknown>> => ({
  type: FETCH_RESOURCE_DEFINITIONS,
  payload: getResourceDefinitions(apiProps),
});

export const fetchResource = (apiProps: ApiProps): ReduxAction<Promise<unknown>> => ({
  type: FETCH_RESOURCE,
  payload: getResource(apiProps),
});
