/**
 * Permissions Redux Selectors
 *
 * Memoized selectors for the permissionReducer slice.
 * Uses reselect to prevent unnecessary re-renders by caching selector results.
 */

import { createSelector } from 'reselect';
import type { RBACStore } from '../store.d';
import type { Permission, PermissionState } from './reducer';
import type { PaginationDefaultI } from '../../helpers/pagination';

// ============================================================================
// Base Selectors - Direct state access (no computation)
// ============================================================================

const selectPermissionState = (state: RBACStore): PermissionState => state.permissionReducer;

// ============================================================================
// Memoized Selectors - Computed values
// ============================================================================

/**
 * Select permissions data array
 * Used in: Permission lists, tables
 */
export const selectPermissionsData = createSelector(
  [selectPermissionState],
  (permissionState): Permission[] => permissionState.permission?.data || [],
);

/**
 * Select permissions total count
 * Used in: Pagination, total count displays
 */
export const selectPermissionsTotalCount = createSelector(
  [selectPermissionState],
  (permissionState): number => permissionState.permission?.meta?.count || 0,
);

/**
 * Select permissions loading state
 * Used in: Loading spinners, skeleton states
 */
export const selectIsPermissionsLoading = createSelector([selectPermissionState], (permissionState): boolean => permissionState.isLoading || false);

/**
 * Select permissions meta object
 * Used in: Pagination components
 */
export const selectPermissionsMeta = createSelector(
  [selectPermissionState],
  (permissionState): Partial<PaginationDefaultI> => permissionState.permission?.meta || {},
);

/**
 * Select full permissions state for components that need data + loading + meta
 * Used in: edit-role-permissions.tsx and similar components
 * Returns: { permissions, totalCount, isLoading }
 */
export const selectPermissionsFullState = createSelector(
  [selectPermissionsData, selectPermissionsTotalCount, selectIsPermissionsLoading],
  (
    permissions,
    totalCount,
    isLoading,
  ): {
    permissions: Permission[];
    totalCount: number;
    isLoading: boolean;
  } => ({
    permissions,
    totalCount,
    isLoading,
  }),
);
