import useIdentity, { type IdentityData } from '../../shared/hooks/useIdentity';
import { useAccessPermissions } from './useAccessPermissions';

export interface UserData extends IdentityData {
  userAccessAdministrator: boolean;
}

/**
 * V1 user data hook. Composes shared useIdentity (Chrome identity) with
 * V1 useAccessPermissions (rbac:*:* wildcard check) to provide the
 * userAccessAdministrator flag.
 *
 * V1-only — V2 code should use useIdentity from shared/hooks directly.
 */
const useUserData = (): UserData => {
  const identity = useIdentity();
  const { hasAccess: hasRbacWildcard, isLoading: permissionsLoading } = useAccessPermissions(['rbac:*:*']);

  return {
    ...identity,
    userAccessAdministrator: identity.ready && !permissionsLoading && hasRbacWildcard,
  };
};

export default useUserData;
