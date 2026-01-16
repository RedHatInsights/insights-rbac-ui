/**
 * V2 Roles API - Temporary Types and Client
 *
 * These types are based on the RBAC V2 specs discussion (Jan 13, 2026).
 * They will be replaced with actual rbac-client types when V2 APIs are delivered.
 *
 * @see Meeting notes: "RBAC v2 specs review with team by Sneha"
 * @tag api-v2-temporary - Using temporary types until V2 API delivery
 */

/**
 * V2 Role type - simplified from V1, no workspaces/user groups in table columns
 */
export interface RoleV2 {
  uuid: string;
  name: string;
  description?: string;
  permissions?: number | null; // null = "Not available"
  modified?: string;
  system: boolean;
  // Detailed permissions for drawer view
  access?: Array<{
    application: string;
    resourceType: string;
    operation: string;
  }>;
}

/**
 * V2 Roles list response
 */
export interface RolesV2Pagination {
  data: RoleV2[];
  meta: {
    count: number;
    limit: number;
    offset: number;
  };
}

/**
 * List roles V2 parameters
 * Per meeting: supports pagination and filtering by name, sorting by name/modified
 */
export interface ListRolesV2Params {
  limit?: number;
  offset?: number;
  name?: string;
  orderBy?: 'name' | '-name' | 'modified' | '-modified';
}

/**
 * Create role V2 request
 * Per meeting: POST with name, description, permissions
 * Returns created role object (Riccardo's request)
 */
export interface CreateRoleV2Request {
  name: string;
  description?: string;
  permissions: string[];
}

/**
 * Update role V2 request
 * Per meeting: PUT with role ID, name, description, permissions
 * Returns updated role object
 */
export interface UpdateRoleV2Request {
  uuid: string;
  name: string;
  description?: string;
  permissions: string[];
}

/**
 * Role assignment (binding) for drawer view
 * Per meeting: Still showing assigned user groups in drawer
 */
export interface RoleAssignment {
  userGroup: string;
  workspace: string;
}

// Note: V2 API endpoints will be:
// - GET /api/rbac/v2/roles/ - List roles (with pagination, filtering, sorting)
// - GET /api/rbac/v2/roles/{uuid}/ - Get single role
// - POST /api/rbac/v2/roles/ - Create role
// - PUT /api/rbac/v2/roles/{uuid}/ - Update role
// - DELETE /api/rbac/v2/roles/{uuid}/ - Delete role (bulk supported)
