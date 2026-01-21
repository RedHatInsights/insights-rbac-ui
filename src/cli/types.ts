import { z } from 'zod';

// ============================================================================
// Zod Schemas for Input Validation
// ============================================================================

/**
 * Role input schema for CLI operations
 */
export const RoleInputSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  display_name: z.string().optional(),
  description: z.string().optional(),
  access: z
    .array(
      z.object({
        permission: z.string(),
        resourceDefinitions: z
          .array(
            z.object({
              attributeFilter: z.object({
                key: z.string(),
                operation: z.enum(['equal', 'in']),
                value: z.union([z.string(), z.array(z.string())]),
              }),
            }),
          )
          .optional()
          .default([]),
      }),
    )
    .optional()
    .default([]),
});

/**
 * Group input schema for CLI operations
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
