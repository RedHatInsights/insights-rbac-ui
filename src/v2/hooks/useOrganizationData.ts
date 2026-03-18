import useIdentity from '../../shared/hooks/useIdentity';

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
 * V2-only — reads from useIdentity which fetches Chrome identity once.
 */
export function useOrganizationData(): UseOrganizationDataResult {
  const { identity, ready } = useIdentity();

  return {
    accountNumber: identity?.account_number || '',
    organizationId: identity?.org_id || '',
    organizationName: identity?.organization?.name || '',
    isLoading: !ready,
  };
}
