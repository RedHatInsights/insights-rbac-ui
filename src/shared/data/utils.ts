import { QueryClient, useQueryClient } from '@tanstack/react-query';

/**
 * Helper to get QueryClient that works in both web and CLI contexts.
 *
 * In CLI, useQueryClient() fails due to ESM/CJS dual-package issues causing
 * React Context mismatch. We accept an explicit QueryClient as fallback.
 *
 * We always call useQueryClient() to satisfy Rules of Hooks, but in CLI
 * where it throws due to dual-package issues, we fall back to explicit.
 */
export function useMutationQueryClient(explicit?: QueryClient): QueryClient {
  // Always call useQueryClient to maintain consistent hook call order
  // In CLI this throws, but we catch it and use explicit instead
  let contextClient: QueryClient | undefined;
  try {
    // This is intentionally in try-catch for CLI compatibility
    contextClient = useQueryClient();
  } catch {
    // Expected in CLI due to ESM/CJS context mismatch
  }

  if (explicit) return explicit;
  if (contextClient) return contextClient;
  throw new Error('No QueryClient available. For CLI, pass { queryClient } to mutation hooks.');
}
