import { GET_PRINCIPAL_ACCESS } from '../../redux/action-types';
import { defaultSettings } from '../../helpers/shared/pagination';

// Initial State
export const accessInitialState = {
  isLoading: false,
  access: {
    data: [],
    meta: defaultSettings,
  },
};

const setLoadingState = (state) => ({ ...state, isLoading: true });

const setAccess = (state, { payload }) => ({ ...state, access: payload, isLoading: false });

export default {
  [`${GET_PRINCIPAL_ACCESS}_PENDING`]: setLoadingState,
  [`${GET_PRINCIPAL_ACCESS}_FULFILLED`]: setAccess,
};
