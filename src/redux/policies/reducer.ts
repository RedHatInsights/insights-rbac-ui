import { FETCH_GROUP_POLICIES, FETCH_POLICY } from './action-types';
import { PolicyExtended, PolicyPagination } from '@redhat-cloud-services/rbac-client/types';

export interface PoliciesState extends Record<string, unknown> {
  policies: PolicyPagination;
  policy: PolicyExtended | Record<string, never>;
  isLoading: boolean;
  isRecordLoading: boolean;
  selectedPolicy?: PolicyExtended;
}

// Initial State
export const policiesInitialState: PoliciesState = {
  policies: {
    data: [],
    meta: {
      count: 0,
    },
  },
  policy: {},
  isLoading: false,
  isRecordLoading: false,
};

const setLoadingState = (state: PoliciesState): PoliciesState => ({ ...state, isLoading: true });
const setPolicies = (state: PoliciesState, { payload }: ActionWithPayload<PolicyPagination>): PoliciesState => ({
  ...state,
  policies: payload,
  isLoading: false,
});
const setRecordLoadingState = (state: PoliciesState): PoliciesState => ({ ...state, isRecordLoading: true });
const selectPolicy = (state: PoliciesState, { payload }: ActionWithPayload<PolicyExtended>): PoliciesState => ({
  ...state,
  selectedPolicy: payload,
  isRecordLoading: false,
});

export default {
  [`${FETCH_GROUP_POLICIES}_PENDING`]: setLoadingState,
  [`${FETCH_GROUP_POLICIES}_FULFILLED`]: setPolicies,
  [`${FETCH_POLICY}_PENDING`]: setRecordLoadingState,
  [`${FETCH_POLICY}_FULFILLED`]: selectPolicy,
};
