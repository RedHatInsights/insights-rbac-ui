/**
 * Shared types for MyUserAccess feature - ONLY truly shared types
 */

// ===== RESOURCE DEFINITIONS =====
/**
 * Resource definition structure used across permission and role displays
 * Used by: ResourceDefinitionsModal, ResourceDefinitionsLink, AccessTable, RolesTable
 */
export interface ResourceDefinition {
  attributeFilter: {
    value: string | string[] | null;
    key?: string;
    operation?: string;
  };
}

// ===== TABLE SHARED TYPES =====
/**
 * Standard sort state for table components
 * Used by: AccessTable, RolesTable
 */
export interface SortByState {
  index: number;
  direction: 'asc' | 'desc';
}

/**
 * Configuration for Resource Definitions Modal state
 * Used by: AccessTable, RolesTable
 */
export interface ResourceDefinitionsConfig {
  rdOpen: boolean;
  rdPermission?: string;
  resourceDefinitions?: ResourceDefinition[];
}

// ===== FILTER TYPES =====
/**
 * Clean filter state discriminated union - no bloated FilterItem[] at business logic level!
 * Used by: MyUserAccess, AccessTable, RolesTable
 */
export type FilterState = { type: 'role'; filter: string } | { type: 'application'; filter: string[] };
