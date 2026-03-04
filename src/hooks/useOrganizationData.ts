import useUserData from './useUserData';

export interface OrganizationData {
  accountNumber: string;
  organizationId: string;
  organizationName: string;
}

interface UseOrganizationDataResult extends OrganizationData {
  isLoading: boolean;
}

/**
 * Hook to fetch organization data from the platform auth service.
 *
 * Extracts organization details (name, ID, account number) from the user identity.
 *
 * @example
 * ```tsx
 * const { organizationName, isLoading } = useOrganizationData();
 *
 * if (isLoading) return <Spinner />;
 *
 * return <div>Organization: {organizationName}</div>;
 * ```
 */
export function useOrganizationData(): UseOrganizationDataResult {
  const user = useUserData();

  const data: OrganizationData = {
    accountNumber: user.identity?.account_number || '',
    organizationId: user.identity?.org_id || '',
    organizationName: user.identity?.organization?.name || '',
  };
  return { ...data, isLoading: user.ready === false };
}
