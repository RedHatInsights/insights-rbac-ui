import {
  EXPAND_SPLATS,
  LIST_APPLICATION_OPTIONS,
  LIST_OPERATION_OPTIONS,
  LIST_PERMISSIONS,
  LIST_RESOURCE_OPTIONS,
  RESET_EXPAND_SPLATS,
} from '../action-types';
import { defaultSettings } from '../../helpers/shared/pagination';

export const permissionInitialState = {
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

const setLoadingState = (state) => ({ ...state, isLoading: true });

const setPermissions = (state, { payload }) => ({ ...state, permission: payload, isLoading: false });

const setLoadingApplicationState = (state) => ({ ...state, options: { ...state.options, isLoadingApplication: true } });
const setLoadingResourcesState = (state) => ({ ...state, options: { ...state.options, isLoadingResource: true } });
const setLoadingOperationState = (state) => ({ ...state, options: { ...state.options, isLoadingOperation: true } });
const setApplicationOptions = (state, { payload }) => ({
  ...state,
  options: { ...state.options, application: payload, isLoadingApplication: false },
});
const setResourceOptions = (state, { payload }) => ({ ...state, options: { ...state.options, resource: payload, isLoadingResource: false } });
const setOperationOptions = (state, { payload }) => ({ ...state, options: { ...state.options, operation: payload, isLoadingOperation: false } });

const setLoadingExpandSplats = (state) => ({ ...state, isLoadingExpandSplats: true });
const setExpandSplats = (state, { payload }) => ({ ...state, expandSplats: payload, isLoadingExpandSplats: false });
const resetExpandSplats = () => permissionInitialState;

export default {
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
