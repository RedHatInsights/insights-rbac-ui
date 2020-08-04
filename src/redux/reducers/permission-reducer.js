import { LIST_PERMISSIONS } from '../action-types';
import { defaultSettings } from '../../helpers/shared/pagination';

// Initial State
export const permissionInitialState = {
    isLoading: false,
    permission: {
        data: [],
        meta: { ...defaultSettings, limit: 100 }
    }
};

const setLoadingState = state => ({ ...state, isLoading: true });

const setPermissions = (state, { payload }) => ({ ...state, permission: payload, isLoading: false });

export default {
    [`${LIST_PERMISSIONS}_PENDING`]: setLoadingState,
    [`${LIST_PERMISSIONS}_FULFILLED`]: setPermissions
};
