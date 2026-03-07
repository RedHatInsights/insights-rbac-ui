import useUserData from '../../shared/hooks/useUserData';

export interface OrganizationData {
  accountNumber: string;
  organizationId: string;
  organizationName: string;
}

interface UseOrganizationDataResult extends OrganizationData {
  isLoading: boolean;
}

/**
 * Hook to access organization data from the platform auth service.
 * V2-only — reads from useUserData which already fetches identity once.
 */
export function useOrganizationData(): UseOrganizationDataResult {
  const { identity, ready } = useUserData();

  return {
    accountNumber: identity?.account_number || '',
    organizationId: identity?.org_id || '',
    organizationName: identity?.organization?.name || '',
    isLoading: !ready,
  };
}
