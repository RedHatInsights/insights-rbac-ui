import type { QueryClient } from '@tanstack/react-query';

/**
 * Options for query hooks.
 * The optional queryClient bypasses React context lookup - needed for CLI
 * where ESM/CJS dual-package loading causes context issues.
 */
export interface QueryOptions {
  enabled?: boolean;
  /** Pass explicit QueryClient to bypass context (for CLI) */
  queryClient?: QueryClient;
}

/**
 * Options for mutation hooks.
 * Pass queryClient to bypass context (for CLI).
 */
export interface MutationOptions {
  /** Pass explicit QueryClient to bypass context (for CLI) */
  queryClient?: QueryClient;
  /** When true, the mutation's onSuccess skips notification and cache invalidation.
   *  The caller is responsible for handling both (e.g. after a post-submit progress step). */
  deferSuccessSideEffects?: boolean;
}
