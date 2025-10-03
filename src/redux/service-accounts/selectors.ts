import { createSelector } from 'reselect';
import type { RBACStore } from '../store.d';
import type { ServiceAccount } from './types';
import type { ServiceAccountsState } from './reducer';

// ============================================================================
// Base Selectors - Direct state access
// ============================================================================

const selectServiceAccountsState = (state: RBACStore): ServiceAccountsState | undefined => state.serviceAccountReducer;

const selectServiceAccountsIsLoading = (state: RBACStore): boolean => state.serviceAccountReducer?.isLoading || false;

// ============================================================================
// Memoized Selectors - Service Accounts List
// ============================================================================

/**
 * Select service accounts data array
 * Used in: Service accounts tables
 */
export const selectServiceAccounts = createSelector(
  [selectServiceAccountsState],
  (serviceAccountsState): ServiceAccount[] => serviceAccountsState?.serviceAccounts || [],
);

/**
 * Select service accounts status
 * Used in: Pagination, API status checks
 */
export const selectServiceAccountsStatus = createSelector(
  [selectServiceAccountsState],
  (serviceAccountsState): string => serviceAccountsState?.status || '',
);

/**
 * Select service accounts loading state (exported base selector)
 * Used in: Loading spinners, disabled states
 */
export const selectIsServiceAccountsLoading = selectServiceAccountsIsLoading;

/**
 * Select service accounts offset
 * Used in: Pagination
 */
export const selectServiceAccountsOffset = createSelector(
  [selectServiceAccountsState],
  (serviceAccountsState): number => serviceAccountsState?.offset || 0,
);

/**
 * Select service accounts limit
 * Used in: Pagination
 */
export const selectServiceAccountsLimit = createSelector(
  [selectServiceAccountsState],
  (serviceAccountsState): number => serviceAccountsState?.limit || 20,
);

/**
 * Combined selector for service accounts data and status
 * Used in: Components that need multiple service account properties
 */
export const selectServiceAccountsFullState = createSelector(
  [selectServiceAccounts, selectServiceAccountsStatus, selectIsServiceAccountsLoading, selectServiceAccountsOffset],
  (
    serviceAccounts,
    status,
    isLoading,
    offset,
  ): {
    serviceAccounts: ServiceAccount[];
    status: string;
    isLoading: boolean;
    offset: number;
  } => ({
    serviceAccounts,
    status,
    isLoading,
    offset,
  }),
);
