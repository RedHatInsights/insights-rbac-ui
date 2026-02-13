import React, { useRef } from 'react';
import { useMockState } from '../contexts/StorybookMockContext';

interface Resource {
  id: string;
  type: string;
  reporter?: { type: string };
}

interface AccessCheckResult {
  resource: Resource;
  allowed: boolean;
}

interface UseSelfAccessCheckOptions {
  relation: string;
  resources: Resource[];
}

export const useSelfAccessCheck = ({ relation, resources }: UseSelfAccessCheckOptions) => {
  const mock = useMockState();

  const mockRef = useRef(mock);
  mockRef.current = mock;

  // Generic lookup: supports all 6 workspace relations (view, edit, delete, create, move, rename)
  const allowedIds = mockRef.current.workspacePermissions[relation as keyof typeof mockRef.current.workspacePermissions] ?? [];

  const data: AccessCheckResult[] = resources.map((resource) => ({
    resource,
    allowed: allowedIds.includes(resource.id),
  }));

  return { data, loading: false };
};

// Mock AccessCheck.Provider - passes children through
export const AccessCheck = {
  Provider: ({ children }: { children: React.ReactNode; baseUrl?: string; apiPath?: string }) => <>{children}</>,
};
