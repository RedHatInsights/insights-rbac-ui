/**
 * Memoized Redux Selectors for Roles
 *
 * These selectors use 'reselect' to prevent unnecessary re-renders.
 * They should be used instead of inline selectors in components.
 */

import { createSelector } from 'reselect';
import { RBACStore } from '../store.d';
import { defaultSettings } from '../../helpers/pagination';
import type { Access, Role } from './reducer';

// ============================================================================
// Base Selectors - Direct state access
// ============================================================================

const selectRolesState = (state: RBACStore) => state.roleReducer?.roles;
const selectSelectedRoleState = (state: RBACStore) => state.roleReducer?.selectedRole;
const selectRolesIsLoading = (state: RBACStore): boolean => state.roleReducer?.isLoading || false;
const selectRolesIsRecordLoading = (state: RBACStore): boolean => state.roleReducer?.isRecordLoading || false;
const selectRolesError = (state: RBACStore) => state.roleReducer?.roles?.error;

// ============================================================================
// Memoized Selectors - Roles List
// ============================================================================

/**
 * Select roles data array
 * Used in: Roles list tables, role selection dropdowns
 */
export const selectRoles = createSelector([selectRolesState], (roles): Role[] => roles?.data || []);

/**
 * Select roles pagination
 * Used in: Roles list tables
 */
export const selectRolesPagination = createSelector([selectRolesState], (roles) => roles?.pagination || roles?.meta || defaultSettings);

/**
 * Select roles filters
 * Used in: Roles list filter controls
 */
export const selectRolesFilters = createSelector([selectRolesState], (roles) => roles?.filters || {});

/**
 * Select roles metadata
 * Used in: Pagination, count displays
 */
export const selectRolesMeta = createSelector([selectRolesState], (roles) => ({
  count: roles?.meta?.count || 0,
  limit: roles?.meta?.limit || defaultSettings.limit,
  offset: roles?.meta?.offset || defaultSettings.offset,
}));

/**
 * Select roles total count
 * Used in: Pagination, "X roles" displays
 */
export const selectRolesTotalCount = createSelector([selectRolesMeta], (meta) => meta.count);

/**
 * Select roles loading state (exported base selector)
 * Used in: Loading spinners, disabled states
 */
export const selectIsRolesLoading = selectRolesIsLoading;

/**
 * Select roles record loading state (exported base selector)
 * Used in: Individual record loading states
 */
export const selectIsRoleRecordLoading = selectRolesIsRecordLoading;

/**
 * Select roles error (exported base selector)
 * Used in: Error messages, error boundaries
 */
export const selectRolesErrorState = selectRolesError;

// ============================================================================
// Selected Role Selectors
// ============================================================================

/**
 * Select the currently selected/active role (exported base selector)
 * Used in: Role detail pages, edit forms
 */
export const selectSelectedRole = selectSelectedRoleState;

/**
 * Select permissions/access of the selected role
 * Used in: Permission lists, access management
 */
export const selectSelectedRoleAccess = createSelector([selectSelectedRoleState], (selectedRole): Access[] => selectedRole?.access || []);

/**
 * Select a specific permission from selected role by ID
 * Used in: Permission detail views
 */
export const selectRolePermissionById = (permissionId: string) =>
  createSelector([selectSelectedRoleAccess], (access: Access[]): Access | undefined => access.find((a) => a.permission === permissionId));

// ============================================================================
// Composite Selectors
// ============================================================================

/**
 * Select roles list with pagination and loading state
 * Used in: Complete table setups
 */
export const selectRolesListData = createSelector(
  [selectRoles, selectRolesPagination, selectIsRolesLoading, selectRolesTotalCount],
  (roles, pagination, isLoading, totalCount) => ({
    roles,
    pagination,
    isLoading,
    totalCount,
  }),
);

/**
 * Select selected role with access permissions
 * Used in: Role detail pages
 */
export const selectSelectedRoleWithAccess = createSelector([selectSelectedRole, selectSelectedRoleAccess], (role, access) => ({
  role,
  access,
}));
