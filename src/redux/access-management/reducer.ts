import { GET_PRINCIPAL_ACCESS } from './action-types';
import { PaginationDefaultI, defaultSettings } from '../../helpers/pagination';

// Type definitions for access management
interface AccessItem {
  permission: string;
  application: string;
  resource_type: string;
  verb: string;
  resourceDefinitions?: unknown[];
  [key: string]: unknown;
}

interface AccessData {
  data: AccessItem[];
  meta: PaginationDefaultI;
}

export interface AccessState {
  isLoading: boolean;
  access: AccessData;
  [key: string]: unknown;
}

// Using global ReduxAction interface from store.d.ts instead of local Action interface

// Initial State
export const accessInitialState: AccessState = {
  isLoading: false,
  access: {
    data: [],
    meta: defaultSettings,
  },
};

const setLoadingState = (state: AccessState): AccessState => ({ ...state, isLoading: true });

const setAccess = (state: AccessState, action?: ReduxAction<AccessData>): AccessState => {
  if (!action) return state;
  const { payload } = action;
  return { ...state, access: payload, isLoading: false };
};

// Reducer function map with proper typing
type ReducerFunctions = Record<string, (state: AccessState, action?: ReduxAction<any>) => AccessState>;

const accessReducer: ReducerFunctions = {
  [`${GET_PRINCIPAL_ACCESS}_PENDING`]: setLoadingState,
  [`${GET_PRINCIPAL_ACCESS}_FULFILLED`]: setAccess,
};

export default accessReducer;
