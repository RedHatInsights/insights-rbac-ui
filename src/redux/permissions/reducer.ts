import { EXPAND_SPLATS, RESET_EXPAND_SPLATS } from '../cost-management/action-types';
import { LIST_APPLICATION_OPTIONS, LIST_OPERATION_OPTIONS, LIST_PERMISSIONS, LIST_RESOURCE_OPTIONS } from './action-types';
import { PaginationDefaultI, defaultSettings } from '../../helpers/pagination';

// Type definitions for permissions
interface Permission {
  permission: string;
  application: string;
  resource_type: string;
  verb: string;
  [key: string]: unknown;
}

interface PermissionData {
  data: Permission[];
  meta: PaginationDefaultI;
}

interface OptionData {
  data: string[];
  [key: string]: unknown;
}

interface PermissionOptions {
  isLoadingApplication: boolean;
  isLoadingResource: boolean;
  isLoadingOperation: boolean;
  application: OptionData;
  resource: OptionData;
  operation: OptionData;
}

export interface PermissionState {
  isLoading: boolean;
  isLoadingExpandSplats?: boolean;
  options: PermissionOptions;
  permission: PermissionData;
  expandSplats: PermissionData;
  [key: string]: unknown;
}

// Using global ReduxAction interface from store.d.ts instead of local Action interface

export const permissionInitialState: PermissionState = {
  isLoading: false,
  options: {
    isLoadingApplication: false,
    isLoadingResource: false,
    isLoadingOperation: false,
    application: { data: [] },
    resource: { data: [] },
    operation: { data: [] },
  },
  permission: {
    data: [],
    meta: defaultSettings,
  },
  expandSplats: {
    data: [],
    meta: defaultSettings,
  },
};

const setLoadingState = (state: PermissionState): PermissionState => ({ ...state, isLoading: true });

const setPermissions = (state: PermissionState, action?: ReduxAction<PermissionData>): PermissionState => {
  if (!action) return state;
  const { payload } = action;
  return { ...state, permission: payload, isLoading: false };
};

const setLoadingApplicationState = (state: PermissionState): PermissionState => ({
  ...state,
  options: { ...state.options, isLoadingApplication: true },
});

const setLoadingResourcesState = (state: PermissionState): PermissionState => ({
  ...state,
  options: { ...state.options, isLoadingResource: true },
});

const setLoadingOperationState = (state: PermissionState): PermissionState => ({
  ...state,
  options: { ...state.options, isLoadingOperation: true },
});

const setApplicationOptions = (state: PermissionState, action?: ReduxAction<OptionData>): PermissionState => {
  if (!action) return state;
  const { payload } = action;
  return {
    ...state,
    options: { ...state.options, application: payload, isLoadingApplication: false },
  };
};

const setResourceOptions = (state: PermissionState, action?: ReduxAction<OptionData>): PermissionState => {
  if (!action) return state;
  const { payload } = action;
  return { ...state, options: { ...state.options, resource: payload, isLoadingResource: false } };
};

const setOperationOptions = (state: PermissionState, action?: ReduxAction<OptionData>): PermissionState => {
  if (!action) return state;
  const { payload } = action;
  return { ...state, options: { ...state.options, operation: payload, isLoadingOperation: false } };
};

const setLoadingExpandSplats = (state: PermissionState): PermissionState => ({
  ...state,
  isLoadingExpandSplats: true,
});

const setExpandSplats = (state: PermissionState, action?: ReduxAction<PermissionData>): PermissionState => {
  if (!action) return state;
  const { payload } = action;
  return { ...state, expandSplats: payload, isLoadingExpandSplats: false };
};

const resetExpandSplats = (): PermissionState => permissionInitialState;

// Reducer function map with proper typing
type ReducerFunctions = Record<string, (state: PermissionState, action?: ReduxAction<any>) => PermissionState>;

const permissionReducer: ReducerFunctions = {
  [`${LIST_PERMISSIONS}_PENDING`]: setLoadingState,
  [`${LIST_PERMISSIONS}_FULFILLED`]: setPermissions,
  [`${LIST_APPLICATION_OPTIONS}_PENDING`]: setLoadingApplicationState,
  [`${LIST_APPLICATION_OPTIONS}_FULFILLED`]: setApplicationOptions,
  [`${LIST_RESOURCE_OPTIONS}_PENDING`]: setLoadingResourcesState,
  [`${LIST_RESOURCE_OPTIONS}_FULFILLED`]: setResourceOptions,
  [`${LIST_OPERATION_OPTIONS}_PENDING`]: setLoadingOperationState,
  [`${LIST_OPERATION_OPTIONS}_FULFILLED`]: setOperationOptions,
  [`${EXPAND_SPLATS}_PENDING`]: setLoadingExpandSplats,
  [`${EXPAND_SPLATS}_FULFILLED`]: setExpandSplats,
  [`${RESET_EXPAND_SPLATS}`]: resetExpandSplats,
};

export default permissionReducer;
