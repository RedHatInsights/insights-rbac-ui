import { GET_PRINCIPAL_ACCESS } from './action-types';
import { GetPrincipalAccessParams, getPrincipalAccess as getPrincipalAccessHelper } from './helper';

// Using global ReduxAction interface from store.d.ts
export const getPrincipalAccess = (apiProps: GetPrincipalAccessParams): ReduxAction<Promise<unknown>> => ({
  type: GET_PRINCIPAL_ACCESS,
  payload: getPrincipalAccessHelper(apiProps),
});
