import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import type { SeedPayload, SeedSummary } from '../types.js';
import { Spinner } from './shared/index.js';
import {
  useCreateGroupMutation,
  useCreateRoleMutation,
  useCreateRoleV2Mutation,
  useCreateWorkspaceMutation,
  useUpdateGroupRolesMutation,
  useWorkspacesQuery,
} from '../queries.js';

// ============================================================================
// Types
// ============================================================================

/**
 * Props for HeadlessSeeder component
 */
export interface HeadlessSeederProps {
  payload: SeedPayload;
  onComplete: (summary: SeedSummary) => void;
  /** 'v1' (default) or 'v2'. Controls role creation API and whether role bindings are created. */
  apiVersion?: 'v1' | 'v2';
  /** Write seed-map JSON to this file path when done. */
  outputPath?: string;
}

interface Mappings {
  roles: Record<string, string>;
  groups: Record<string, string>;
  workspaces: Record<string, string>;
}

type Phase = 'fetching' | 'creating' | 'binding' | 'done' | 'empty';

// ============================================================================
// Permission parsing (V2)
// ============================================================================

function parsePermission(perm: string) {
  const [application, resource_type, operation] = perm.split(':');
  return { application, resource_type, operation };
}

// ============================================================================
// HeadlessSeeder Component
// ============================================================================

/**
 * Headless Ink component that creates RBAC resources from a seed payload.
 *
 * Uses shared mutation hooks for creation and binding so parameter contracts
 * are guaranteed. The default workspace ID (needed as workspace parent in V2)
 * is fetched via the shared useWorkspacesQuery hook.
 *
 * Must be rendered inside AppWrapper (which provides QueryClientProvider + ServiceProvider).
 *
 * Phases:
 *   fetching (default workspace) → creating → binding (V2 only) → done
 */
export function HeadlessSeeder({ payload, onComplete, apiVersion = 'v1', outputPath }: HeadlessSeederProps): React.ReactElement {
  const { exit } = useApp();
  const isV2 = apiVersion === 'v2';

  const [phase, setPhase] = useState<Phase>('fetching');
  const [log, setLog] = useState<string[]>([]);
  const [summary, setSummary] = useState<SeedSummary | null>(null);
  const workStarted = useRef(false);

  const appendLog = (line: string) => {
    process.stderr.write(line + '\n');
    setLog((prev) => [...prev.slice(-20), line]);
  };

  // -- Query hook: fetch default workspace to use as parent for new workspaces (V2) --
  const payloadWorkspaces = payload.workspaces ?? [];
  const needsParentWorkspace = isV2 && payloadWorkspaces.length > 0;
  const defaultWorkspaceQuery = useWorkspacesQuery({ type: 'default' }, { enabled: needsParentWorkspace && phase === 'fetching' });
  const rootWorkspaceQuery = useWorkspacesQuery(
    { type: 'root' },
    { enabled: needsParentWorkspace && phase === 'fetching' && defaultWorkspaceQuery.isSuccess && !defaultWorkspaceQuery.data?.data?.[0]?.id },
  );

  // -- Mutation hooks (use React Query context client via AppWrapper's QueryClientProvider) --
  const createRoleV1 = useCreateRoleMutation();
  const createRoleV2 = useCreateRoleV2Mutation();
  const createGroup = useCreateGroupMutation();
  const createWorkspace = useCreateWorkspaceMutation();
  const updateGroupRoles = useUpdateGroupRolesMutation();

  const payloadRoles = payload.roles ?? [];
  const payloadGroups = payload.groups ?? [];
  const payloadBindings = payload.role_bindings ?? [];

  const totalCustomOps = payloadRoles.length + payloadGroups.length + payloadWorkspaces.length + (isV2 ? payloadBindings.length : 0);

  // Persona users to add to every created group
  const personaUsers = payload.personas ? Object.values(payload.personas).map((p) => ({ username: p.username })) : [];

  // Transition from fetching → creating once default workspace is available (or not needed)
  useEffect(() => {
    if (phase !== 'fetching') return;
    if (!needsParentWorkspace) {
      setPhase(totalCustomOps === 0 ? 'empty' : 'creating');
      return;
    }
    // Wait for at least one workspace query to succeed
    if (defaultWorkspaceQuery.isSuccess || rootWorkspaceQuery.isSuccess) {
      setPhase(totalCustomOps === 0 ? 'empty' : 'creating');
    }
  }, [phase, needsParentWorkspace, defaultWorkspaceQuery.isSuccess, rootWorkspaceQuery.isSuccess, totalCustomOps]);

  // Run all creation phases imperatively once we enter 'creating'
  useEffect(() => {
    if (phase !== 'creating' || workStarted.current) return;
    workStarted.current = true;

    // Compute the default parent workspace ID for new workspaces
    const defaultWorkspaceId = defaultWorkspaceQuery.data?.data?.[0]?.id ?? rootWorkspaceQuery.data?.data?.[0]?.id;

    async function run() {
      const mappings: Mappings = { roles: {}, groups: {}, workspaces: {} };
      let roleCreated = 0,
        roleFailed = 0,
        groupCreated = 0,
        groupFailed = 0,
        wsCreated = 0,
        wsFailed = 0,
        bindingsCreated = 0,
        bindingsFailed = 0;
      const roleResults: Record<string, import('../types.js').OperationResult> = {};
      const groupResults: Record<string, import('../types.js').OperationResult> = {};
      const wsResults: Record<string, import('../types.js').OperationResult> = {};

      // ======================================================================
      // PHASE 1: DISCOVER system groups (V1 only, using raw API factory via
      //          ServiceContext axios — accessed through a hook-provided ref)
      // ======================================================================
      appendLog(`\n${'━'.repeat(50)}`);
      appendLog(`📦 PHASE 1: Creating ${totalCustomOps} resource(s) via ${isV2 ? 'V2' : 'V1'} API`);
      appendLog(`${'━'.repeat(50)}`);

      // -- Roles --
      if (payloadRoles.length > 0) {
        appendLog(`\n📦 Creating ${payloadRoles.length} role(s)...`);
        for (const role of payloadRoles) {
          try {
            if (isV2) {
              const result = await createRoleV2.mutateAsync({
                name: role.name,
                description: role.description ?? '',
                permissions: (role.permissions ?? []).map(parsePermission),
              });
              const id = result.id!;
              mappings.roles[role.name] = id;
              roleResults[role.name] = { success: true, id, name: role.name };
              appendLog(`  ✓ Created V2 role "${role.name}" → ${id}`);
            } else {
              const result = await createRoleV1.mutateAsync({
                name: role.name,
                display_name: role.display_name,
                description: role.description,
                access: (role.permissions ?? []).map((p) => ({ permission: p, resourceDefinitions: [] })),
              });
              const uuid = result.uuid!;
              mappings.roles[role.display_name || role.name] = uuid;
              roleResults[role.name] = { success: true, uuid, name: role.name };
              appendLog(`  ✓ Created V1 role "${role.name}" → ${uuid}`);
            }
            roleCreated++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            roleResults[role.name] = { success: false, name: role.name, error: msg };
            appendLog(`  ✗ Failed to create role "${role.name}": ${msg}`);
            roleFailed++;
          }
        }
      }

      // -- Groups --
      if (payloadGroups.length > 0) {
        appendLog(`\n📦 Creating ${payloadGroups.length} group(s)...`);
        for (const group of payloadGroups) {
          try {
            // V1: resolve role names → UUIDs for direct attachment; V2 uses role bindings
            const resolvedRoleUuids =
              !isV2 && group.roles_list ? group.roles_list.map((name) => mappings.roles[name]).filter((uuid): uuid is string => !!uuid) : undefined;

            const result = await createGroup.mutateAsync({
              name: group.name,
              description: group.description,
              user_list: personaUsers.length > 0 ? personaUsers : undefined,
              roles_list: resolvedRoleUuids && resolvedRoleUuids.length > 0 ? resolvedRoleUuids : undefined,
            });
            const uuid = result.uuid!;
            mappings.groups[group.name] = uuid;
            groupResults[group.name] = { success: true, uuid, name: group.name };
            appendLog(`  ✓ Created group "${group.name}" → ${uuid}`);
            groupCreated++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            groupResults[group.name] = { success: false, name: group.name, error: msg };
            appendLog(`  ✗ Failed to create group "${group.name}": ${msg}`);
            groupFailed++;
          }
        }
      }

      // -- Workspaces --
      if (payloadWorkspaces.length > 0) {
        appendLog(`\n📦 Creating ${payloadWorkspaces.length} workspace(s)...`);
        for (const workspace of payloadWorkspaces) {
          try {
            // Resolve parent_id: workspace name → UUID, or use default/root workspace
            const resolvedParentId = workspace.parent_id ? (mappings.workspaces[workspace.parent_id] ?? workspace.parent_id) : defaultWorkspaceId;

            const result = await createWorkspace.mutateAsync({
              name: workspace.name,
              description: workspace.description,
              parent_id: resolvedParentId,
            });
            const id = result?.id!;
            mappings.workspaces[workspace.name] = id;
            wsResults[workspace.name] = { success: true, id, name: workspace.name };
            appendLog(`  ✓ Created workspace "${workspace.name}" → ${id}`);
            wsCreated++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            wsResults[workspace.name] = { success: false, name: workspace.name, error: msg };
            appendLog(`  ✗ Failed to create workspace "${workspace.name}": ${msg}`);
            wsFailed++;
          }
        }
      }

      // ======================================================================
      // PHASE 2: BIND (V2 only)
      // ======================================================================
      if (isV2 && payloadBindings.length > 0) {
        setPhase('binding');
        appendLog(`\n${'━'.repeat(50)}`);
        appendLog(`🔗 PHASE 2: Creating ${payloadBindings.length} role binding(s)`);
        appendLog(`${'━'.repeat(50)}`);

        // Group by (group, workspace) — one PUT per pair with all applicable roles
        const bySubject = new Map<string, { groupId: string; workspaceId: string; roleIds: string[]; label: string }>();

        for (const binding of payloadBindings) {
          const groupId = mappings.groups[binding.group];
          const roleId = mappings.roles[binding.role];
          const workspaceId = mappings.workspaces[binding.workspace];

          if (!groupId || !roleId || !workspaceId) {
            appendLog(`  ⚠ Skipping binding ${binding.group} → ${binding.workspace}: missing UUID`);
            bindingsFailed++;
            continue;
          }

          const key = `${groupId}:${workspaceId}`;
          const existing = bySubject.get(key);
          if (existing) {
            existing.roleIds.push(roleId);
          } else {
            bySubject.set(key, { groupId, workspaceId, roleIds: [roleId], label: `${binding.group} → ${binding.workspace}` });
          }
        }

        for (const { groupId, workspaceId, roleIds, label } of bySubject.values()) {
          try {
            await updateGroupRoles.mutateAsync({
              resourceId: workspaceId,
              resourceType: 'workspace',
              subjectId: groupId,
              subjectType: 'group',
              roleIds,
            });
            appendLog(`  ✓ Bound ${roleIds.length} role(s) for ${label}`);
            bindingsCreated += roleIds.length;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            appendLog(`  ✗ Failed to bind ${label}: ${msg}`);
            bindingsFailed++;
          }
        }
      }

      // ======================================================================
      // DONE: Build summary and write seed-map
      // ======================================================================
      const totalFailures = roleFailed + groupFailed + wsFailed + bindingsFailed;
      const finalSummary: SeedSummary = {
        success: totalFailures === 0,
        roles: { created: roleCreated, failed: roleFailed, results: roleResults },
        groups: { created: groupCreated, failed: groupFailed, results: groupResults },
        workspaces: { created: wsCreated, failed: wsFailed, results: wsResults },
        ...(isV2 && { role_bindings: { created: bindingsCreated, failed: bindingsFailed } }),
        mappings,
      };

      // Write seed-map
      const seedMap = { roles: mappings.roles, groups: mappings.groups, workspaces: mappings.workspaces };
      if (outputPath) {
        const { writeFile } = await import('fs/promises');
        try {
          await writeFile(outputPath, JSON.stringify(seedMap, null, 2), 'utf-8');
          appendLog(`\n📄 Seed map written to: ${outputPath}`);
        } catch (err) {
          appendLog(`\n⚠ Failed to write seed map: ${err instanceof Error ? err.message : String(err)}`);
        }
      } else {
        process.stdout.write('\n' + JSON.stringify(seedMap, null, 2) + '\n');
      }

      setSummary(finalSummary);
      onComplete(finalSummary);
      process.exitCode = totalFailures > 0 ? 1 : 0;
      setPhase('done');
    }

    run().catch((err) => {
      appendLog(`\n❌ Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      process.exitCode = 1;
      setPhase('done');
    });
  }, [phase]); // intentional: run once on phase transition, mutation refs are stable

  // Exit Ink once done or empty
  useEffect(() => {
    if (phase !== 'done' && phase !== 'empty') return;

    if (phase === 'empty') {
      process.stderr.write('No operations to perform. Payload was empty.\n');
      process.exitCode = 1;
    }

    setTimeout(() => exit(), 100);
  }, [phase, exit]);

  if (phase === 'empty') {
    return <Text color="#F0AB00">⚠ No operations to perform</Text>;
  }

  const phaseLabel =
    phase === 'fetching'
      ? 'Fetching workspace info...'
      : phase === 'creating'
        ? 'Creating resources...'
        : phase === 'binding'
          ? 'Creating role bindings...'
          : 'Done';

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="#00A4FF">
        RBAC Seeder ({apiVersion.toUpperCase()}) — {totalCustomOps} operation(s)
      </Text>

      {phase !== 'done' && (
        <Box marginTop={1}>
          <Spinner />
          <Text> {phaseLabel}</Text>
        </Box>
      )}

      {log.slice(-8).map((line, i) => (
        <Text key={i} color="#6A6E73" dimColor>
          {line}
        </Text>
      ))}

      {phase === 'done' && summary && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>{'━'.repeat(40)}</Text>
          <Text bold>📊 Summary:</Text>
          <Text>
            {' '}
            Roles: {summary.roles.created} created, {summary.roles.failed} failed
          </Text>
          <Text>
            {' '}
            Groups: {summary.groups.created} created, {summary.groups.failed} failed
          </Text>
          <Text>
            {' '}
            Workspaces: {summary.workspaces.created} created, {summary.workspaces.failed} failed
          </Text>
          {summary.role_bindings && (
            <Text>
              {' '}
              Role bindings: {summary.role_bindings.created} created, {summary.role_bindings.failed} failed
            </Text>
          )}
          {summary.success ? (
            <Text color="#3E8635">✅ Seeding completed successfully!</Text>
          ) : (
            <Text color="#F0AB00">⚠ Seeding completed with errors</Text>
          )}
        </Box>
      )}
    </Box>
  );
}

export default HeadlessSeeder;
