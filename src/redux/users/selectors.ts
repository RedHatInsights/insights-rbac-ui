/**
 * Memoized Redux Selectors for Users
 *
 * These selectors use 'reselect' to prevent unnecessary re-renders.
 * They should be used instead of inline selectors in components.
 */

import { createSelector } from 'reselect';
import { RBACStore } from '../store.d';
import { defaultSettings } from '../../helpers/pagination';
import type { User } from './reducer';

// ============================================================================
// Base Selectors - Direct state access
// ============================================================================

const selectUsersState = (state: RBACStore) => state.userReducer?.users;
const selectIsUserDataLoading = (state: RBACStore): boolean => state.userReducer?.isUserDataLoading || false;
const selectUserReducerState = (state: RBACStore) => state.userReducer;

// ============================================================================
// Memoized Selectors - Users List
// ============================================================================

/**
 * Select users data array
 * Used in: Users list tables
 */
export const selectUsers = createSelector([selectUsersState], (users): User[] => users?.data || []);

/**
 * Select users with UUID mapped from username
 * Used in: Components expecting uuid field
 * Note: Returns users with uuid as string (username) for components that need unique identifiers
 */
export const selectUsersWithUUID = createSelector(
  [selectUsers],
  (users): Array<Omit<User, 'uuid'> & { uuid: string }> => users?.map?.((user: User) => ({ ...user, uuid: user.username })) || [],
);

/**
 * Select users pagination
 * Used in: Users list pagination
 */
export const selectUsersPagination = createSelector([selectUsersState], (users) => users?.pagination || defaultSettings);

/**
 * Select users metadata
 * Used in: Users list metadata, pagination
 */
export const selectUsersMeta = createSelector([selectUsersState], (users) => users?.meta || {});

/**
 * Select users filters
 * Used in: Users list filter controls
 */
export const selectUsersFilters = createSelector([selectUsersState], (users) => users?.filters || {});

/**
 * Select users total count
 * Used in: Pagination, "X users" displays
 */
export const selectUsersTotalCount = createSelector([selectUsersMeta], (meta) => meta?.count || 0);

/**
 * Select users loading state (exported base selector)
 * Used in: Loading spinners, disabled states
 */
export const selectIsUsersLoading = selectIsUserDataLoading;

/**
 * Select user status
 * Used in: Error handling and status checks
 */
export const selectUserStatus = createSelector([selectUserReducerState], (userReducer): string | undefined => userReducer?.status);

/**
 * Select users pagination from meta
 * Used in: Components that use meta for pagination (non-URL mode)
 */
export const selectUsersPaginationFromMeta = createSelector([selectUsersState], (users): { limit: number; offset: number; count: number } => ({
  limit: users?.meta?.limit ?? 50,
  offset: users?.meta?.offset ?? 0,
  count: users?.meta?.count ?? 0,
}));

/**
 * Select users pagination from pagination object
 * Used in: Components that use pagination object (URL mode)
 */
export const selectUsersPaginationFromPagination = createSelector(
  [selectUsersState],
  (users): { limit: number; offset: number; count: number; redirected?: boolean } => ({
    limit: users?.pagination?.limit ?? 50,
    offset: users?.pagination?.offset ?? 0,
    count: users?.pagination?.count ?? 0,
    redirected: users?.pagination?.redirected,
  }),
);

/**
 * Select users raw data (for memoization in components)
 * Used in: Components that need stable empty array reference
 */
export const selectUsersRawData = createSelector([selectUsersState], (users): User[] => users?.data || []);

// ============================================================================
// Composite Selectors - For common component patterns
// ============================================================================

/**
 * Select users list with pagination and loading state
 * Used in: Complete table setups
 */
export const selectUsersListData = createSelector([selectUsersWithUUID, selectIsUsersLoading, selectUsersFilters], (users, isLoading, filters) => ({
  users,
  isLoading,
  filters,
}));

/**
 * Select users pagination data (for URL-based pagination)
 * Used in: Components that sync pagination with URL
 */
export const selectUsersPaginationData = createSelector([selectUsersPagination, selectUsersMeta], (pagination, meta) => ({
  limit: pagination?.limit ?? meta?.limit ?? defaultSettings.limit,
  offset: pagination?.offset ?? meta?.offset ?? defaultSettings.offset,
  count: pagination?.count ?? meta?.count ?? 0,
  redirected: pagination?.redirected,
}));

/**
 * Select users with filters defaulted to Active status
 * Used in: Components that default to showing active users
 */
export const selectUsersStateWithDefaultFilters = (hasUrlParams: boolean) =>
  createSelector([selectUsersFilters], (filters) => {
    // If URL has params or filters exist, use them; otherwise default to Active
    return hasUrlParams || Object.keys(filters).length > 0 ? filters : { status: ['Active'] };
  });
