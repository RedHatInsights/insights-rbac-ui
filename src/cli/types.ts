import { z } from 'zod';

// ============================================================================
// Zod Schemas for Input Validation
// ============================================================================

/**
 * Role input schema for CLI operations.
 *
 * Permissions format: "application:resource_type:operation" (colon-separated string)
 * Examples: "rbac:groups:read", "inventory:hosts:*", "cost-management:*:*"
 *
 * Note: System roles are auto-discovered from the API and included in the seed-map.
 * Only define custom roles here that should be created.
 *
 * The V1 API expects `access: [{ permission: string }]` but we use the
 * simpler `permissions: string[]` interface (matching CreateRoleV2Request).
 */
export const RoleInputSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  display_name: z.string().optional(),
  description: z.string().optional(),
  permissions: z.array(z.string()).optional().default([]),
});

/**
 * Group input schema for CLI operations.
 *
 * Note: System groups are auto-discovered from the API and included in the seed-map.
 * Only define custom groups here that should be created.
 */
export const GroupInputSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  user_list: z.array(z.object({ username: z.string() })).optional(),
  roles_list: z.array(z.string()).optional(),
});

/**
 * Workspace input schema for CLI operations
 */
export const WorkspaceInputSchema = z.object({
  name: z.string().min(1, 'Workspace name is required'),
  description: z.string().optional(),
  parent_id: z.string().optional(),
});

/**
 * Seed payload schema - wrapper for batch operations
 */
export const SeedPayloadSchema = z.object({
  roles: z.array(RoleInputSchema).optional(),
  groups: z.array(GroupInputSchema).optional(),
  workspaces: z.array(WorkspaceInputSchema).optional(),
});

// ============================================================================
// TypeScript Types (inferred from Zod schemas)
// ============================================================================

export type RoleInput = z.infer<typeof RoleInputSchema>;
export type GroupInput = z.infer<typeof GroupInputSchema>;
export type WorkspaceInput = z.infer<typeof WorkspaceInputSchema>;
export type SeedPayload = z.infer<typeof SeedPayloadSchema>;

/**
 * CLI operation result
 */
export interface OperationResult {
  success: boolean;
  id?: string;
  uuid?: string;
  name?: string;
  error?: string;
}

/**
 * Seed summary output
 */
export interface SeedSummary {
  success: boolean;
  roles: {
    created: number;
    failed: number;
    results: Record<string, OperationResult>;
  };
  groups: {
    created: number;
    failed: number;
    results: Record<string, OperationResult>;
  };
  workspaces: {
    created: number;
    failed: number;
    results: Record<string, OperationResult>;
  };
}
