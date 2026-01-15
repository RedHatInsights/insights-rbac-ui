import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import { useDataViewFilters, useDataViewPagination, useDataViewSelection, useDataViewSort } from '@patternfly/react-data-view';

import { defaultSettings } from '../../helpers/pagination';
import { type ListRolesParams, useRolesQuery } from '../../data/queries/roles';
import type { RoleOutDynamic } from '@redhat-cloud-services/rbac-client/types';

// Re-export Role type for backwards compatibility
export type Role = RoleOutDynamic;

export interface RoleFilters {
  display_name: string;
}

export interface UseRolesOptions {
  /** Whether to enable admin functionality */
  enableAdminFeatures?: boolean;
}

export interface UseRolesReturn {
  // Data
  roles: Role[];
  isLoading: boolean;
  totalCount: number;

  // Permissions
  orgAdmin: boolean;
  userAccessAdministrator: boolean;

  // DataView hooks
  filters: ReturnType<typeof useDataViewFilters<RoleFilters>>['filters'];
  sortBy: string;
  direction: 'asc' | 'desc';
  onSort: ReturnType<typeof useDataViewSort>['onSort'];
  pagination: ReturnType<typeof useDataViewPagination>;
  selection: ReturnType<typeof useDataViewSelection>;

  // Focus state
  focusedRole: Role | null;
  setFocusedRole: (role: Role | null) => void;

  // Actions
  refetch: () => void;
  handleRowClick: (role: Role) => void;

  // Clear all filters
  clearAllFilters: () => void;
  onSetFilters: ReturnType<typeof useDataViewFilters<RoleFilters>>['onSetFilters'];
}

/**
 * Custom hook for managing Roles business logic
 * Migrated from Redux to TanStack Query
 */
export const useRoles = (options: UseRolesOptions = {}): UseRolesReturn => {
  const { enableAdminFeatures = true } = options;

  const [searchParams, setSearchParams] = useSearchParams();

  // Focus state for drawer
  const [focusedRole, setFocusedRole] = useState<Role | null>(null);

  // Data view hooks - use search params for persistence
  const { sortBy, direction, onSort } = useDataViewSort({
    searchParams,
    setSearchParams,
    initialSort: {
      sortBy: 'display_name',
      direction: 'asc',
    },
  });

  const { filters, onSetFilters, clearAllFilters } = useDataViewFilters<RoleFilters>({
    initialFilters: { display_name: '' },
    searchParams,
    setSearchParams,
  });

  const pagination = useDataViewPagination({
    perPage: defaultSettings.limit,
    searchParams,
    setSearchParams,
  });

  const selection = useDataViewSelection({
    matchOption: (a: { uuid: string }, b: { uuid: string }) => a.uuid === b.uuid,
  });

  // Build query params from data view state
  const queryParams: ListRolesParams = {
    limit: pagination.perPage,
    offset: (pagination.page - 1) * pagination.perPage,
    orderBy: (sortBy || 'display_name') as ListRolesParams['orderBy'],
    displayName: filters.display_name || undefined,
    nameMatch: 'partial',
    scope: 'org_id',
    addFields: ['groups_in_count', 'groups_in', 'access'],
  };

  // Use TanStack Query instead of Redux
  const { data: rolesData, isLoading, refetch } = useRolesQuery(queryParams);

  // Extract roles and total count from query result
  const roles = (rolesData?.data ?? []) as Role[];
  const totalCount = rolesData?.meta?.count ?? 0;

  // Permission context
  const orgAdmin = enableAdminFeatures;
  const userAccessAdministrator = enableAdminFeatures;

  // Handle row click for role focus and drawer events
  const handleRowClick = useCallback(
    (role: Role) => {
      setFocusedRole(role);
    },
    [setFocusedRole],
  );

  return {
    // Data
    roles,
    isLoading,
    totalCount,

    // Permissions
    orgAdmin: enableAdminFeatures && orgAdmin,
    userAccessAdministrator: enableAdminFeatures && userAccessAdministrator,

    // DataView hooks
    filters,
    sortBy: sortBy || 'display_name',
    direction: direction || 'asc',
    onSort,
    pagination,
    selection,

    // Focus state
    focusedRole,
    setFocusedRole,

    // Actions
    refetch,
    handleRowClick,

    // Clear all filters
    clearAllFilters,
    onSetFilters,
  };
};
