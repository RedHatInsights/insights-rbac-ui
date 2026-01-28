import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import type { QueryClient } from '@tanstack/react-query';
import type { OperationResult, RoleInput, SeedPayload, SeedSummary } from '../types.js';
import { Spinner } from './shared/index.js';
import { type RoleIn, useCreateGroupMutation, useCreateRoleMutation, useCreateWorkspaceMutation, useWorkspacesQuery } from '../queries.js';

// Types for internal components that need hookOptions
interface HookOptions {
  queryClient: QueryClient;
}

/**
 * Props for HeadlessSeeder component
 */
export interface HeadlessSeederProps {
  payload: SeedPayload;
  queryClient: QueryClient;
  onComplete: (summary: SeedSummary) => void;
}

// Types for mutation params (needed for internal seeder components)
interface CreateGroupParams {
  name: string;
  description?: string;
}

interface CreateWorkspaceParams {
  name: string;
  description?: string;
  parent_id?: string;
}

/**
 * Generic resource seeder component
 */
interface ResourceSeederProps<T, R> {
  resource: T;
  resourceType: 'role' | 'group' | 'workspace';
  getName: (r: T) => string;
  mutation: {
    mutate: (data: T, options?: { onSuccess?: (result: R) => void; onError?: (error: Error) => void }) => void;
    isPending: boolean;
    isError: boolean;
    isSuccess: boolean;
    error: Error | null;
    data?: R;
  };
  onComplete: (result: OperationResult) => void;
}

function ResourceSeeder<T, R extends { uuid?: string; id?: string; name?: string }>({
  resource,
  resourceType,
  getName,
  mutation,
  onComplete,
}: ResourceSeederProps<T, R>): React.ReactElement {
  const hasStarted = useRef(false);
  const name = getName(resource);

  useEffect(() => {
    if (hasStarted.current) return;
    hasStarted.current = true;

    mutation.mutate(resource, {
      onSuccess: (result) => {
        onComplete({
          success: true,
          uuid: result.uuid,
          id: result.id,
          name: result.name || name,
        });
      },
      onError: (error) => {
        onComplete({
          success: false,
          name,
          error: error.message,
        });
      },
    });
  }, [resource, mutation, onComplete, name]);

  if (mutation.isPending) {
    return (
      <Box>
        <Spinner />
        <Text>
          {' '}
          Creating {resourceType} &quot;{name}&quot;...
        </Text>
      </Box>
    );
  }

  if (mutation.isError) {
    return (
      <Text color="#C9190B">
        ✗ Failed to create {resourceType} &quot;{name}&quot;: {mutation.error?.message}
      </Text>
    );
  }

  if (mutation.isSuccess && mutation.data) {
    const id = mutation.data.uuid || mutation.data.id;
    return (
      <Text color="#3E8635">
        ✓ Created {resourceType} &quot;{name}&quot; → {id}
      </Text>
    );
  }

  return (
    <Text color="#6A6E73">
      Preparing to create {resourceType} &quot;{name}&quot;...
    </Text>
  );
}

/**
 * Role seeder wrapper
 * Uses RoleInput from CLI types which is compatible with the API's RoleIn type.
 */
function RoleSeeder({
  role,
  hookOptions,
  onComplete,
}: {
  role: RoleInput;
  hookOptions: HookOptions;
  onComplete: (result: OperationResult) => void;
}): React.ReactElement {
  const mutation = useCreateRoleMutation(hookOptions);
  // Cast RoleInput to RoleIn - they are structurally compatible
  return (
    <ResourceSeeder resource={role as unknown as RoleIn} resourceType="role" getName={(r) => r.name} mutation={mutation} onComplete={onComplete} />
  );
}

/**
 * Group seeder wrapper
 */
function GroupSeeder({
  group,
  hookOptions,
  onComplete,
}: {
  group: CreateGroupParams;
  hookOptions: HookOptions;
  onComplete: (result: OperationResult) => void;
}): React.ReactElement {
  const mutation = useCreateGroupMutation(hookOptions);
  return <ResourceSeeder resource={group} resourceType="group" getName={(g) => g.name} mutation={mutation} onComplete={onComplete} />;
}

/**
 * Workspace seeder wrapper
 * Automatically fetches root workspace to use as parent_id if not provided
 */
function WorkspaceSeeder({
  workspace,
  hookOptions,
  onComplete,
}: {
  workspace: CreateWorkspaceParams;
  hookOptions: HookOptions;
  onComplete: (result: OperationResult) => void;
}): React.ReactElement {
  const mutation = useCreateWorkspaceMutation(hookOptions);
  const rootQuery = useWorkspacesQuery({ type: 'root' }, hookOptions);
  const rootWorkspaceId = rootQuery.data?.data?.[0]?.id;

  // Wait for root workspace to be fetched if parent_id not provided
  const workspaceWithParent = React.useMemo(() => {
    if (workspace.parent_id) return workspace;
    if (!rootWorkspaceId) return null; // Still loading
    return { ...workspace, parent_id: rootWorkspaceId };
  }, [workspace, rootWorkspaceId]);

  if (!workspaceWithParent) {
    return (
      <Box>
        <Spinner />
        <Text> Fetching root workspace...</Text>
      </Box>
    );
  }

  return (
    <ResourceSeeder resource={workspaceWithParent} resourceType="workspace" getName={(w) => w.name} mutation={mutation} onComplete={onComplete} />
  );
}

/**
 * HeadlessSeeder component for scripting mode
 *
 * Executes seed operations and outputs results to stdout.
 * Exits with code 0 on success, 1 on failure.
 */
export function HeadlessSeeder({ payload, queryClient, onComplete }: HeadlessSeederProps): React.ReactElement {
  const { exit } = useApp();
  const hookOptions = { queryClient };

  const [roleResults, setRoleResults] = useState<Map<string, OperationResult>>(new Map());
  const [groupResults, setGroupResults] = useState<Map<string, OperationResult>>(new Map());
  const [workspaceResults, setWorkspaceResults] = useState<Map<string, OperationResult>>(new Map());
  const [phase, setPhase] = useState<'pending' | 'processing' | 'complete' | 'empty'>('pending');
  const [exitCode, setExitCode] = useState<number | null>(null);

  // Rename to avoid shadowing module-level imports
  const payloadRoles = payload.roles ?? [];
  const payloadGroups = payload.groups ?? [];
  const payloadWorkspaces = payload.workspaces ?? [];

  const totalOperations = payloadRoles.length + payloadGroups.length + payloadWorkspaces.length;
  const completedOperations = roleResults.size + groupResults.size + workspaceResults.size;

  // Handle completion of individual operations
  const handleRoleComplete = React.useCallback((roleName: string, result: OperationResult) => {
    setRoleResults((prev) => new Map(prev).set(roleName, result));
  }, []);

  const handleGroupComplete = React.useCallback((groupName: string, result: OperationResult) => {
    setGroupResults((prev) => new Map(prev).set(groupName, result));
  }, []);

  const handleWorkspaceComplete = React.useCallback((workspaceName: string, result: OperationResult) => {
    setWorkspaceResults((prev) => new Map(prev).set(workspaceName, result));
  }, []);

  // Track phase transitions
  useEffect(() => {
    if (phase === 'pending' && totalOperations === 0) {
      setPhase('empty');
      setExitCode(1);
    } else if (phase === 'pending' && totalOperations > 0) {
      setPhase('processing');
    } else if (phase === 'processing' && completedOperations === totalOperations) {
      setPhase('complete');
    }
  }, [phase, completedOperations, totalOperations]);

  // Handle empty payload exit
  useEffect(() => {
    if (phase !== 'empty') return;

    process.stderr.write('No operations to perform. Payload was empty.\n');
    // Use setTimeout to allow React to finish rendering before exit
    setTimeout(() => {
      exit();
    }, 100);
  }, [phase, exit]);

  // Handle final exit after completion
  useEffect(() => {
    if (phase !== 'complete') return;

    const roleFailures = Array.from(roleResults.values()).filter((r) => !r.success).length;
    const groupFailures = Array.from(groupResults.values()).filter((r) => !r.success).length;
    const workspaceFailures = Array.from(workspaceResults.values()).filter((r) => !r.success).length;
    const totalFailures = roleFailures + groupFailures + workspaceFailures;

    // Build summary
    const summary: SeedSummary = {
      success: totalFailures === 0,
      roles: {
        created: payloadRoles.length - roleFailures,
        failed: roleFailures,
        results: Object.fromEntries(roleResults.entries()),
      },
      groups: {
        created: payloadGroups.length - groupFailures,
        failed: groupFailures,
        results: Object.fromEntries(groupResults.entries()),
      },
      workspaces: {
        created: payloadWorkspaces.length - workspaceFailures,
        failed: workspaceFailures,
        results: Object.fromEntries(workspaceResults.entries()),
      },
    };

    // Output JSON summary
    process.stdout.write('\n' + JSON.stringify(summary, null, 2) + '\n');

    // Call completion callback
    onComplete(summary);

    // Set exit code and let Ink handle exit gracefully
    setExitCode(totalFailures > 0 ? 1 : 0);
    setTimeout(() => {
      exit();
    }, 100);
  }, [phase, roleResults, groupResults, workspaceResults, payloadRoles.length, payloadGroups.length, payloadWorkspaces.length, exit, onComplete]);

  // Handle process exit after Ink exits
  useEffect(() => {
    if (exitCode === null) return;
    // Set up cleanup on unmount to handle exit code
    return () => {
      process.exitCode = exitCode;
    };
  }, [exitCode]);

  // Empty payload state
  if (phase === 'empty') {
    return <Text color="#F0AB00">⚠ No operations to perform</Text>;
  }

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="#00A4FF">
        RBAC Seeder - Processing {totalOperations} operation(s)
      </Text>

      {/* Roles */}
      {payloadRoles.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Roles ({payloadRoles.length})</Text>
          {payloadRoles.map((role) => (
            <RoleSeeder key={role.name} role={role} hookOptions={hookOptions} onComplete={(result) => handleRoleComplete(role.name, result)} />
          ))}
        </Box>
      )}

      {/* Groups */}
      {payloadGroups.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Groups ({payloadGroups.length})</Text>
          {payloadGroups.map((group) => (
            <GroupSeeder key={group.name} group={group} hookOptions={hookOptions} onComplete={(result) => handleGroupComplete(group.name, result)} />
          ))}
        </Box>
      )}

      {/* Workspaces */}
      {payloadWorkspaces.length > 0 && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>Workspaces ({payloadWorkspaces.length})</Text>
          {payloadWorkspaces.map((workspace) => (
            <WorkspaceSeeder
              key={workspace.name}
              workspace={workspace}
              hookOptions={hookOptions}
              onComplete={(result) => handleWorkspaceComplete(workspace.name, result)}
            />
          ))}
        </Box>
      )}

      {/* Progress */}
      {phase === 'processing' && (
        <Box marginTop={1}>
          <Text color="#6A6E73">
            Progress: {completedOperations}/{totalOperations}
          </Text>
        </Box>
      )}
    </Box>
  );
}

export default HeadlessSeeder;
