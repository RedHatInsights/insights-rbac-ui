import React, { useEffect, useRef, useState } from 'react';
import { Box, Text, useApp } from 'ink';
import { Spinner } from './shared/index.js';
import {
  useAllRolesV2Query,
  useBatchDeleteRolesV2Mutation,
  useDeleteGroupMutation,
  useDeleteRoleMutation,
  useDeleteWorkspaceMutation,
  useGroupsQuery,
  useRolesQuery,
  useWorkspacesQuery,
} from '../queries.js';

// ============================================================================
// Types
// ============================================================================

export interface HeadlessCleanupProps {
  prefix?: string;
  nameMatch?: string;
  dryRun?: boolean;
  apiVersion?: 'v1' | 'v2';
}

interface Resource {
  /** V1 UUID (for roles and groups) */
  uuid?: string;
  /** V2/workspace ID */
  id?: string;
  name: string;
  display_name?: string;
  system?: boolean;
  platform_default?: boolean;
  type?: string;
  parent_id?: string | null;
  /** Marks roles that are V2-only (delete via batch delete) */
  _apiVersion?: 'v1' | 'v2';
}

// ============================================================================
// Pure Helpers (moved from cleanup.ts)
// ============================================================================

function matchesGlob(name: string, pattern: string): boolean {
  const regexPattern = pattern
    .replace(/[.+^${}()|[\]\\]/g, '\\$&')
    .replace(/\*/g, '.*')
    .replace(/\?/g, '.');
  return new RegExp(`^${regexPattern}$`, 'i').test(name);
}

function matchesFilter(resource: Resource, prefix?: string, nameMatch?: string): boolean {
  const name = resource.display_name || resource.name;
  if (prefix) return name.startsWith(prefix);
  if (nameMatch) return matchesGlob(name, nameMatch);
  return false;
}

function isProtected(resource: Resource): boolean {
  return resource.system === true || resource.platform_default === true || resource.type === 'root';
}

/**
 * Sort workspaces deepest-first so children are deleted before parents.
 */
function sortChildrenFirst(workspaces: Resource[]): Resource[] {
  const byId = new Map(workspaces.map((w) => [w.id!, w]));

  function depth(ws: Resource): number {
    if (!ws.parent_id || !byId.has(ws.parent_id)) return 0;
    return 1 + depth(byId.get(ws.parent_id)!);
  }

  return [...workspaces].sort((a, b) => depth(b) - depth(a));
}

// ============================================================================
// HeadlessCleanup Component
// ============================================================================

/**
 * Headless Ink component that deletes RBAC resources matching a prefix or pattern.
 *
 * Uses shared query/mutation hooks so parameter contracts (e.g. resource_type=workspace
 * on the V2 roles list endpoint) are guaranteed — the same code path as the web app.
 *
 * Must be rendered inside AppWrapper (which provides QueryClientProvider + ServiceProvider).
 */
export function HeadlessCleanup({ prefix, nameMatch, dryRun = false, apiVersion }: HeadlessCleanupProps): React.ReactElement {
  const { exit } = useApp();

  const [phase, setPhase] = useState<'fetching' | 'deleting' | 'done'>('fetching');
  const [log, setLog] = useState<string[]>([]);
  const [summary, setSummary] = useState<{ roles: number; groups: number; workspaces: number; errors: number } | null>(null);
  const deletionStarted = useRef(false);

  const appendLog = (line: string) => {
    process.stderr.write(line + '\n');
    setLog((prev) => [...prev.slice(-20), line]);
  };

  const skipV2 = apiVersion === 'v1';

  // -- Query hooks (hooks are always called; disabled via `enabled` when not needed) --

  // V2 roles: cursor-paginated fetch-all with resource_type=workspace baked in
  const v2RolesQuery = useAllRolesV2Query({ resourceType: 'workspace', enabled: phase === 'fetching' && !skipV2 });

  // V1 roles: up to 1000 (sufficient for test cleanup)
  const v1RolesQuery = useRolesQuery({ limit: 1000 }, { enabled: phase === 'fetching' });

  const groupsQuery = useGroupsQuery({ limit: 1000 }, { enabled: phase === 'fetching' });

  const workspacesQuery = useWorkspacesQuery({ limit: -1 }, { enabled: phase === 'fetching' && !skipV2 });

  // -- Mutation hooks (use React Query context client via AppWrapper's QueryClientProvider) --
  const deleteRoleV1 = useDeleteRoleMutation();
  const deleteRoleV2 = useBatchDeleteRolesV2Mutation();
  const deleteGroup = useDeleteGroupMutation();
  const deleteWorkspace = useDeleteWorkspaceMutation();

  // Check if all needed queries have resolved
  const allFetched = v1RolesQuery.isSuccess && groupsQuery.isSuccess && (skipV2 || v2RolesQuery.isSuccess) && (skipV2 || workspacesQuery.isSuccess);

  // Transition from fetching → deleting once data is ready
  useEffect(() => {
    if (phase !== 'fetching' || !allFetched) return;
    setPhase('deleting');
  }, [phase, allFetched]);

  // Run deletion imperatively once we enter the 'deleting' phase
  useEffect(() => {
    if (phase !== 'deleting' || deletionStarted.current) return;
    deletionStarted.current = true;

    async function runDeletion() {
      const actionWord = dryRun ? 'Would delete' : 'Deleting';
      let roleCount = 0,
        groupCount = 0,
        workspaceCount = 0,
        errorCount = 0;

      // -- Roles --
      const v1RolesRaw = (v1RolesQuery.data?.data ?? []) as Resource[];
      const v2RolesRaw = !skipV2 ? ((v2RolesQuery.data ?? []) as Resource[]) : [];

      let rolesToDelete: Resource[];

      if (skipV2) {
        rolesToDelete = v1RolesRaw.filter((r) => matchesFilter(r, prefix, nameMatch) && !isProtected(r));
      } else {
        // Dedup: V1 names take precedence; V2-only roles deleted via V2 batch delete
        const v1Names = new Set(v1RolesRaw.map((r) => r.display_name || r.name));
        const v2Only = v2RolesRaw.filter((r) => !v1Names.has(r.name)).map((r) => ({ ...r, _apiVersion: 'v2' as const }));
        rolesToDelete = [...v1RolesRaw, ...v2Only].filter((r) => matchesFilter(r, prefix, nameMatch) && !isProtected(r));
      }

      appendLog(`\n🔍 Scanning roles...`);
      appendLog(`  Fetched ${v1RolesRaw.length} V1 role(s), ${v2RolesRaw.length} V2 role(s)`);
      appendLog(`  Found ${rolesToDelete.length} matching role(s)`);

      if (rolesToDelete.length > 0) {
        appendLog(`\n🗑️  ${actionWord} ${rolesToDelete.length} role(s)...`);
        for (const role of rolesToDelete) {
          const name = role.display_name || role.name;
          const isV2 = role._apiVersion === 'v2';

          if (dryRun) {
            appendLog(`  🔍 Would delete ${isV2 ? 'V2' : 'V1'} role "${name}"`);
            roleCount++;
            continue;
          }

          try {
            if (isV2) {
              await deleteRoleV2.mutateAsync({ ids: [role.id!] });
              appendLog(`  ✓ Deleted V2 role "${name}"`);
            } else {
              await deleteRoleV1.mutateAsync(role.uuid!);
              appendLog(`  ✓ Deleted V1 role "${name}"`);
            }
            roleCount++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            appendLog(`  ✗ Failed to delete role "${name}": ${msg}`);
            errorCount++;
          }
        }
      }

      // -- Groups --
      const groupsRaw = (groupsQuery.data?.data ?? []) as Resource[];
      const groupsToDelete = groupsRaw.filter((g) => matchesFilter(g, prefix, nameMatch) && !isProtected(g));

      appendLog(`\n🔍 Scanning groups...`);
      appendLog(`  Fetched ${groupsRaw.length} total groups`);
      appendLog(`  Found ${groupsToDelete.length} matching group(s)`);

      if (groupsToDelete.length > 0) {
        appendLog(`\n🗑️  ${actionWord} ${groupsToDelete.length} group(s)...`);
        for (const group of groupsToDelete) {
          if (dryRun) {
            appendLog(`  🔍 Would delete group "${group.name}"`);
            groupCount++;
            continue;
          }

          try {
            await deleteGroup.mutateAsync(group.uuid!);
            appendLog(`  ✓ Deleted group "${group.name}"`);
            groupCount++;
          } catch (err) {
            const msg = err instanceof Error ? err.message : 'Unknown error';
            appendLog(`  ✗ Failed to delete group "${group.name}": ${msg}`);
            errorCount++;
          }
        }
      }

      // -- Workspaces (skipped in V1 mode) --
      if (skipV2) {
        appendLog(`\n📋 Skipping workspaces (V1 mode)`);
      } else {
        const workspacesRaw = (workspacesQuery.data?.data ?? []) as Resource[];
        const matching = workspacesRaw.filter((w) => matchesFilter(w, prefix, nameMatch) && !isProtected(w));
        const workspacesToDelete = sortChildrenFirst(matching);

        appendLog(`\n🔍 Scanning workspaces...`);
        appendLog(`  Fetched ${workspacesRaw.length} total workspaces`);
        appendLog(`  Found ${workspacesToDelete.length} matching workspace(s)`);

        if (workspacesToDelete.length > 0) {
          appendLog(`\n🗑️  ${actionWord} ${workspacesToDelete.length} workspace(s)...`);
          for (const ws of workspacesToDelete) {
            if (dryRun) {
              appendLog(`  🔍 Would delete workspace "${ws.name}"`);
              workspaceCount++;
              continue;
            }

            try {
              await deleteWorkspace.mutateAsync({ id: ws.id!, name: ws.name });
              appendLog(`  ✓ Deleted workspace "${ws.name}"`);
              workspaceCount++;
            } catch (err) {
              const msg = err instanceof Error ? err.message : 'Unknown error';
              appendLog(`  ✗ Failed to delete workspace "${ws.name}": ${msg}`);
              errorCount++;
            }
          }
        }
      }

      setSummary({ roles: roleCount, groups: groupCount, workspaces: workspaceCount, errors: errorCount });
      process.exitCode = errorCount > 0 ? 1 : 0;
      setPhase('done');
    }

    runDeletion().catch((err) => {
      appendLog(`\n❌ Unexpected error: ${err instanceof Error ? err.message : String(err)}`);
      process.exitCode = 1;
      setPhase('done');
    });
  }, [phase]); // intentional: run once on phase transition, mutation refs are stable

  // Exit Ink once done
  useEffect(() => {
    if (phase !== 'done') return;
    setTimeout(() => exit(), 100);
  }, [phase, exit]);

  const filterDesc = prefix ? `prefix="${prefix}"` : `name-match="${nameMatch}"`;
  const modeLabel = dryRun ? ' [DRY-RUN]' : '';

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="#00A4FF">
        RBAC Cleanup{modeLabel} — {filterDesc}
        {apiVersion ? ` (${apiVersion})` : ''}
      </Text>

      {phase === 'fetching' && (
        <Box marginTop={1}>
          <Spinner />
          <Text> Fetching resources...</Text>
        </Box>
      )}

      {phase === 'deleting' && (
        <Box marginTop={1} flexDirection="column">
          <Box>
            <Spinner />
            <Text> Deleting...</Text>
          </Box>
          {log.slice(-5).map((line, i) => (
            <Text key={i} color="#6A6E73" dimColor>
              {line}
            </Text>
          ))}
        </Box>
      )}

      {phase === 'done' && summary && (
        <Box marginTop={1} flexDirection="column">
          <Text bold>{'━'.repeat(40)}</Text>
          <Text bold>📊 Summary:</Text>
          <Text>
            {' '}
            Roles: {summary.roles} {dryRun ? 'would be deleted' : 'deleted'}
          </Text>
          <Text>
            {' '}
            Groups: {summary.groups} {dryRun ? 'would be deleted' : 'deleted'}
          </Text>
          <Text>
            {' '}
            Workspaces: {summary.workspaces} {dryRun ? 'would be deleted' : 'deleted'}
          </Text>
          {summary.errors > 0 && <Text color="#C9190B"> Errors: {summary.errors}</Text>}
          {summary.errors === 0 ? (
            <Text color="#3E8635">{dryRun ? '✅ Dry-run completed. No changes were made.' : '✅ Cleanup completed successfully!'}</Text>
          ) : (
            <Text color="#F0AB00">⚠ Cleanup completed with {summary.errors} error(s)</Text>
          )}
        </Box>
      )}
    </Box>
  );
}

export default HeadlessCleanup;
