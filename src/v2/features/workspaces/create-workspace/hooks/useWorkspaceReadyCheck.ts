import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useSelfAccessCheck } from '@project-kessel/react-kessel-access-check';
import type { NotEmptyArray, SelfAccessCheckResourceWithRelation } from '@project-kessel/react-kessel-access-check/types';
import { WORKSPACE_RELATIONS } from '../../../../data/queries/workspaces';

const POLL_INTERVAL_MS = 1000;
const TIMEOUT_MS = 60_000;

/**
 * SpiceDB replication can cause permission checks to flap (true -> false -> true)
 * before settling. Require this many consecutive "all allowed" responses before
 * declaring the workspace ready.
 */
export const CONSECUTIVE_SUCCESS_THRESHOLD = 5;

const RBAC_REPORTER = { type: 'rbac' } as const;

/**
 * Thin wrapper that calls useSelfAccessCheck for all workspace relations.
 * Designed to be remounted (via React key) to trigger fresh API calls,
 * since the SDK hook only fetches once per mount.
 */
export function useWorkspaceAccessSnapshot(workspaceId: string) {
  const resources = useMemo<NotEmptyArray<SelfAccessCheckResourceWithRelation>>(
    () =>
      WORKSPACE_RELATIONS.map((relation) => ({
        id: workspaceId,
        type: 'workspace' as const,
        reporter: RBAC_REPORTER,
        relation,
      })) as unknown as NotEmptyArray<SelfAccessCheckResourceWithRelation>,
    [workspaceId],
  );

  const { data, loading } = useSelfAccessCheck({ resources });

  const allAllowed = useMemo(() => {
    if (!Array.isArray(data) || data.length !== WORKSPACE_RELATIONS.length) return false;
    return data.every((d) => d.allowed);
  }, [data]);

  return { allAllowed, loading };
}

/**
 * Drives the polling lifecycle for workspace readiness.
 *
 * Uses completion-driven polling: the next poll is only scheduled after
 * the consumer signals the previous check finished (via `markCheckComplete`).
 * This prevents overlapping requests when Kessel responses are slow.
 */
export function useWorkspaceReadyPoll(isReady: boolean) {
  const [pollKey, setPollKey] = useState(0);
  const [startTime, setStartTime] = useState(() => Date.now());
  const [timedOut, setTimedOut] = useState(false);
  const pendingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNext = useCallback(() => {
    if (isReady || timedOut) return;
    pendingTimer.current = setTimeout(() => {
      if (Date.now() - startTime >= TIMEOUT_MS) {
        setTimedOut(true);
        return;
      }
      setPollKey((k) => k + 1);
    }, POLL_INTERVAL_MS);
  }, [isReady, timedOut, startTime]);

  useEffect(() => {
    scheduleNext();
    return () => {
      if (pendingTimer.current) clearTimeout(pendingTimer.current);
    };
  }, [scheduleNext]);

  const markCheckComplete = useCallback(() => {
    scheduleNext();
  }, [scheduleNext]);

  const reset = useCallback(() => {
    if (pendingTimer.current) clearTimeout(pendingTimer.current);
    pendingTimer.current = null;
    setPollKey(0);
    setTimedOut(false);
    setStartTime(Date.now());
  }, []);

  return { pollKey, timedOut, markCheckComplete, reset };
}
