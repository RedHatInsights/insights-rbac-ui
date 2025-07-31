import { API_ERROR } from './action-types';

// Type definitions for API error state
export interface ApiErrorState {
  errorCode: string | number;
}

// Using global ReduxAction interface from store.d.ts instead of local Action interface

const setErrorState = (state: ApiErrorState, action?: ReduxAction<string | number>): ApiErrorState => {
  if (!action) return state;
  const { payload } = action;
  return { errorCode: payload };
};

// Reducer function map with proper typing
type ReducerFunctions = Record<string, (state: ApiErrorState, action?: ReduxAction<any>) => ApiErrorState>;

const apiErrorReducer: ReducerFunctions = {
  [API_ERROR]: setErrorState,
};

export default apiErrorReducer;
