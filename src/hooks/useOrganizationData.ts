import { useEffect, useState } from 'react';
import { usePlatformAuth } from './usePlatformAuth';

export interface OrganizationData {
  accountNumber: string;
  organizationId: string;
  organizationName: string;
}

interface UseOrganizationDataResult {
  data: OrganizationData | null;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to fetch organization data from the platform auth service.
 *
 * Extracts organization details (name, ID, account number) from the user identity.
 *
 * @example
 * ```tsx
 * const { data, isLoading, error } = useOrganizationData();
 *
 * if (isLoading) return <Spinner />;
 * if (error) return <Error message={error} />;
 *
 * return <div>Organization: {data.organizationName}</div>;
 * ```
 */
export function useOrganizationData(): UseOrganizationDataResult {
  const { getUser } = usePlatformAuth();
  const [data, setData] = useState<OrganizationData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setIsLoading(true);
    getUser()
      .then((user) => {
        const { identity } = user;
        if (!identity) {
          console.warn('useOrganizationData: User identity not available');
          setError('User identity not available');
          setData(null);
          return;
        }

        setData({
          accountNumber: identity.account_number || '',
          organizationId: identity.org_id || '',
          organizationName: identity.organization?.name || '',
        });
        setError(null);
      })
      .catch((err) => {
        console.error('useOrganizationData: Failed to fetch user data:', err);
        setError('Failed to load organization data');
        setData(null);
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [getUser]);

  return { data, isLoading, error };
}
