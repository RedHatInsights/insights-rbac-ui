import { useRef } from 'react';
import { useMockState } from '../contexts/StorybookMockContext';

/**
 * Permission matching with wildcard support.
 * e.g., 'rbac:*:*' matches 'rbac:role:read'
 */
const matchPermission = (granted: string, required: string): boolean => {
  if (granted === required) return true;

  const [gApp, gResource, gAction] = granted.split(':');
  const [rApp, rResource, rAction] = required.split(':');

  if (gApp !== rApp) return false;
  if (gResource !== '*' && gResource !== rResource) return false;
  if (gAction !== '*' && gAction !== rAction) return false;

  return true;
};

interface UsePermissionsResult {
  hasAccess: boolean;
  isLoading: boolean;
}

const usePermissions = (_app: string, requiredPermissions: string[], _disableCache?: boolean, checkAll?: boolean): UsePermissionsResult => {
  const mock = useMockState();

  // Keep mock state in ref for stable closures
  const mockRef = useRef(mock);
  mockRef.current = mock;

  // Compute access - always synchronous in mock
  const hasAccess = checkAll
    ? requiredPermissions.every((req) => mockRef.current.permissions.some((granted) => matchPermission(granted, req)))
    : requiredPermissions.some((req) => mockRef.current.permissions.some((granted) => matchPermission(granted, req)));

  return { hasAccess, isLoading: false };
};

export default usePermissions;
