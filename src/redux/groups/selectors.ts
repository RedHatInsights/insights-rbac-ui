/**
 * Memoized Redux Selectors for Groups
 *
 * These selectors use 'reselect' to prevent unnecessary re-renders.
 * They should be used instead of inline selectors in components.
 *
 * Benefits:
 * - Performance: Only recompute when inputs change
 * - Consistency: Same selector logic across components
 * - Maintainability: Update in one place
 */

import { createSelector } from 'reselect';
import { RBACStore } from '../store.d';
import { PaginationDefaultI, defaultSettings } from '../../helpers/pagination';
import type { ApiError, Group, GroupFilters, GroupStore, Member, SelectedGroupState, ServiceAccount } from './reducer';
import type { RoleWithAccess } from '@redhat-cloud-services/rbac-client/types';

// ============================================================================
// Base Selectors - Direct state access (no computation)
// ============================================================================

const selectGroupsState = (state: RBACStore): GroupStore['groups'] | undefined => state.groupReducer?.groups;
const selectSelectedGroupState = (state: RBACStore): SelectedGroupState | undefined => state.groupReducer?.selectedGroup;
const selectGroupsIsLoading = (state: RBACStore): boolean => state.groupReducer?.isLoading || false;
const selectGroupsIsRecordLoading = (state: RBACStore): boolean => state.groupReducer?.isRecordLoading || false;
const selectGroupsListError = (state: RBACStore): ApiError | undefined => state.groupReducer?.groups?.error;
const selectGroupError = (state: RBACStore): string | undefined => state.groupReducer?.error;

// ============================================================================
// Memoized Selectors - Computed values
// ============================================================================

/**
 * Select groups data array
 * Used in: Groups list tables, group selection dropdowns
 */
export const selectGroups = createSelector([selectGroupsState], (groups: GroupStore['groups'] | undefined): Group[] => groups?.data || []);

/**
 * Select groups pagination
 * Used in: Groups list tables
 * Note: Returns pagination || meta || defaultSettings to handle various data structures
 * Must use memoization to avoid creating new object references on each call
 */
export const selectGroupsPagination = createSelector(
  [selectGroupsState],
  (groups: GroupStore['groups'] | undefined): Partial<PaginationDefaultI> & { redirected?: boolean } =>
    groups?.pagination || groups?.meta || defaultSettings,
);

/**
 * Select groups filters
 * Used in: Groups list filter controls
 * Note: Must use createSelector to memoize empty object {} to prevent unnecessary rerenders
 */
export const selectGroupsFilters = createSelector(
  [selectGroupsState],
  (groups: GroupStore['groups'] | undefined): GroupFilters => groups?.filters || {},
);

/**
 * Select groups metadata (count, etc)
 * Used in: Pagination, count displays
 */
export const selectGroupsMeta = createSelector([selectGroupsState], (groups: GroupStore['groups'] | undefined) => ({
  count: groups?.meta?.count || 0,
  limit: groups?.meta?.limit || defaultSettings.limit,
  offset: groups?.meta?.offset || defaultSettings.offset,
}));

/**
 * Select groups total count
 * Used in: Pagination, "X groups" displays
 */
export const selectGroupsTotalCount = createSelector([selectGroupsMeta], (meta: { count: number; limit: number; offset: number }) => meta.count);

/**
 * Select groups loading state (exported base selector)
 * Used in: Loading spinners, disabled states
 */
export const selectIsGroupsLoading = selectGroupsIsLoading;

/**
 * Select groups record loading state (exported base selector)
 * Used in: Individual group record loading (e.g., edit modal)
 */
export const selectIsGroupRecordLoading = selectGroupsIsRecordLoading;

/**
 * Select groups list error (exported base selector)
 * Used in: Error messages, error boundaries for groups list
 */
export const selectGroupsErrorState = selectGroupsListError;

// ============================================================================
// Selected Group Selectors
// ============================================================================

/**
 * Select the currently selected/active group (exported base selector)
 * Used in: Group detail pages, edit forms
 */
export const selectSelectedGroup = selectSelectedGroupState;

/**
 * Select selected group name
 * Used in: Page titles, breadcrumbs
 */
export const selectSelectedGroupName = createSelector([selectSelectedGroupState], (selectedGroup): string | undefined => selectedGroup?.name);

/**
 * Select whether selected group exists (no BAD_UUID error)
 * Used in: Error handling, 404 checks
 */
export const selectGroupExists = createSelector([selectGroupError], (error: string | undefined) => error !== 'BAD_UUID');

/**
 * Select if selected group is admin default
 * Used in: Permission checks, UI conditionals
 */
export const selectIsAdminDefaultGroup = createSelector([selectSelectedGroupState], (selectedGroup) => selectedGroup?.admin_default || false);

/**
 * Select if selected group is platform default
 * Used in: Permission checks, UI conditionals
 */
export const selectIsPlatformDefaultGroup = createSelector([selectSelectedGroupState], (selectedGroup) => selectedGroup?.platform_default || false);

/**
 * Select if selected group is loaded
 * Used in: Loading states, skeleton displays
 */
export const selectIsSelectedGroupLoaded = createSelector([selectSelectedGroupState], (selectedGroup) => selectedGroup?.loaded || false);

// ============================================================================
// Selected Group Members Selectors
// ============================================================================

/**
 * Select members of the selected group
 * Used in: Group members table
 */
export const selectGroupMembers = createSelector([selectSelectedGroupState], (selectedGroup): Member[] => selectedGroup?.members?.data || []);

/**
 * Select group members pagination/meta
 * Used in: Members table pagination
 */
export const selectGroupMembersMeta = createSelector(
  [selectSelectedGroupState],
  (selectedGroup): PaginationDefaultI => selectedGroup?.members?.meta || defaultSettings,
);

/**
 * Select group members loading state
 * Used in: Members loading spinner
 */
export const selectIsGroupMembersLoading = createSelector(
  [selectSelectedGroupState],
  (selectedGroup): boolean => selectedGroup?.members?.isLoading || false,
);

/**
 * Select group members error
 * Used in: Members error messages
 */
export const selectGroupMembersError = createSelector(
  [selectSelectedGroupState],
  (selectedGroup): ApiError | undefined => selectedGroup?.error || selectedGroup?.members?.error,
);

// ============================================================================
// Selected Group Roles Selectors
// ============================================================================

/**
 * Select roles of the selected group
 * Used in: Group roles table
 */
export const selectGroupRoles = createSelector([selectSelectedGroupState], (selectedGroup): RoleWithAccess[] => selectedGroup?.roles?.data || []);

/**
 * Select group roles pagination/meta
 * Used in: Roles table pagination
 */
export const selectGroupRolesMeta = createSelector(
  [selectSelectedGroupState],
  (selectedGroup): Partial<PaginationDefaultI> => ({
    ...defaultSettings,
    ...(selectedGroup?.roles?.meta || {}),
  }),
);

/**
 * Select group roles loading state
 * Used in: Roles loading spinner
 */
export const selectIsGroupRolesLoading = createSelector(
  [selectSelectedGroupState],
  (selectedGroup): boolean => selectedGroup?.roles?.isLoading || false,
);

/**
 * Select group roles error
 * Used in: Roles error messages
 */
export const selectGroupRolesError = createSelector(
  [selectSelectedGroupState],
  (selectedGroup): ApiError | undefined => selectedGroup?.error || selectedGroup?.roles?.error,
);

/**
 * Select whether group is a changed default group (admin/platform but not system)
 * Used in: Detecting when default groups have been modified
 */
export const selectIsChangedDefaultGroup = createSelector([selectSelectedGroupState], (selectedGroup): boolean =>
  Boolean((selectedGroup?.admin_default || selectedGroup?.platform_default) && !selectedGroup?.system),
);

/**
 * Select whether "Add Roles" should be disabled
 * Used in: Determining if role addition is available for the group
 */
export const selectShouldDisableAddRoles = createSelector([selectSelectedGroupState], (selectedGroup): boolean => {
  const addRolesPagination = selectedGroup?.addRoles?.pagination;
  // First validate if the pagination object exists and is not empty.
  // If empty or undefined, the disable condition will be always true
  if (!addRolesPagination || Object.keys(addRolesPagination).length === 0) {
    return true;
  }
  return !((addRolesPagination?.count || 0) > 0) || !!selectedGroup?.admin_default;
});

// ============================================================================
// Selected Group Service Accounts Selectors
// ============================================================================

/**
 * Select service accounts of the selected group
 * Used in: Group service accounts table
 */
export const selectGroupServiceAccounts = createSelector(
  [selectSelectedGroupState],
  (selectedGroup): ServiceAccount[] => selectedGroup?.serviceAccounts?.data || [],
);

/**
 * Select group service accounts pagination/meta
 * Used in: Service accounts table pagination
 */
export const selectGroupServiceAccountsMeta = createSelector(
  [selectSelectedGroupState],
  (selectedGroup): Partial<PaginationDefaultI> => ({
    ...defaultSettings,
    ...(selectedGroup?.serviceAccounts?.meta || {}),
  }),
);

/**
 * Select group service accounts loading state
 * Used in: Service accounts loading spinner
 */
export const selectIsGroupServiceAccountsLoading = createSelector(
  [selectSelectedGroupState],
  (selectedGroup): boolean => selectedGroup?.serviceAccounts?.isLoading || false,
);

/**
 * Select group service accounts error
 * Used in: Service accounts error messages
 */
export const selectGroupServiceAccountsError = createSelector(
  [selectSelectedGroupState],
  (selectedGroup): ApiError | undefined => selectedGroup?.error || selectedGroup?.serviceAccounts?.error,
);

// ============================================================================
// Admin/System Groups Selectors
// ============================================================================

/**
 * Select admin group (base selector - direct state access)
 * Used in: Admin group displays
 */
const selectAdminGroupState = (state: RBACStore): Group | undefined => state.groupReducer?.adminGroup;

/**
 * Select system group (base selector - direct state access)
 * Used in: System group displays
 */
const selectSystemGroupState = (state: RBACStore): Group | undefined => state.groupReducer?.systemGroup;

/**
 * Select system group UUID
 * Used in: Comparing against default system group
 */
export const selectSystemGroupUUID = createSelector(
  [selectSystemGroupState],
  (systemGroup: Group | undefined): string | undefined => systemGroup?.uuid,
);

/**
 * Select merged groups with admin/system groups filtered by name
 * Used in: Groups list combining admin, system, and regular groups
 */
export const selectMergedGroupsWithDefaults = createSelector(
  [selectGroups, selectAdminGroupState, selectSystemGroupState, selectGroupsFilters],
  (groups: Group[], adminGroup: Group | undefined, systemGroup: Group | undefined, filters: GroupFilters): Group[] => {
    const nameFilter = filters?.name || '';
    const matchesName = (name?: string) => !nameFilter || name?.match(new RegExp(nameFilter, 'i'));

    const result: Group[] = [];
    if (adminGroup && matchesName(adminGroup.name)) {
      result.push(adminGroup);
    }
    if (systemGroup && matchesName(systemGroup.name)) {
      result.push(systemGroup);
    }

    // Add non-default groups
    const regularGroups = groups.filter((group: Group) => !group.platform_default && !group.admin_default);
    result.push(...regularGroups);

    return result;
  },
);

/**
 * Select groups pagination with defaults based on admin status
 * Used in: Groups list pagination
 */
export const selectGroupsPaginationWithDefaults = (isAdmin: boolean) =>
  createSelector(
    [selectGroupsPagination],
    (pagination: Partial<PaginationDefaultI> & { redirected?: boolean }): { limit: number; offset: number; count: number; redirected?: boolean } => {
      const defaults = isAdmin ? { limit: 20, offset: 0 } : { limit: 10, offset: 0 };
      return {
        limit: pagination?.limit ?? defaults.limit,
        offset: pagination?.offset ?? defaults.offset,
        count: pagination?.count ?? 0,
        redirected: pagination?.redirected,
      };
    },
  );

// ============================================================================
// Composite Selectors - Combine multiple pieces of state
// ============================================================================

/**
 * Select groups list with pagination and loading state
 * Used in: Complete table setups
 */
export const selectGroupsListData = createSelector(
  [selectGroups, selectGroupsPagination, selectIsGroupsLoading, selectGroupsTotalCount],
  (groups: Group[], pagination: Partial<PaginationDefaultI> & { redirected?: boolean }, isLoading: boolean, totalCount: number) => ({
    groups,
    pagination,
    isLoading,
    totalCount,
  }),
);

/**
 * Select selected group with all related data
 * Used in: Group detail pages
 */
export const selectSelectedGroupWithRelations = createSelector(
  [selectSelectedGroup, selectGroupMembers, selectGroupRoles, selectGroupServiceAccounts, selectIsSelectedGroupLoaded],
  (group, members, roles, serviceAccounts, loaded) => ({
    group,
    members,
    roles,
    serviceAccounts,
    loaded,
  }),
);
