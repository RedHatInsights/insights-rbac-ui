import type { AxiosInstance } from 'axios';

/**
 * Service Account type from the SSO API
 */
export interface ServiceAccount {
  id: string;
  clientId: string;
  name: string;
  description?: string;
  createdBy?: string;
  createdAt?: string;
  type?: string;
}

/**
 * Valid service account type values for the SSO API filter.
 */
export type ServiceAccountType = 'service_account' | 'service_access_token';

/**
 * Service Accounts API configuration.
 * Uses the external SSO API for service account management.
 */
export interface ServiceAccountsQueryParams {
  axios: AxiosInstance;
  page?: number;
  perPage?: number;
  token: string;
  ssoUrl: string;
  type?: ServiceAccountType;
}

/**
 * Fetch service accounts from the SSO API.
 * Accepts an injected AxiosInstance for DI compatibility.
 */
export async function fetchServiceAccounts({
  axios,
  page = 1,
  perPage = 20,
  token,
  ssoUrl,
  type,
}: ServiceAccountsQueryParams): Promise<ServiceAccount[]> {
  const first = (page - 1) * perPage;
  const params: Record<string, string | number> = { first, max: Math.min(perPage + 1, 100) };
  if (type) {
    params.type = type;
  }
  const response = await axios.get(`${ssoUrl}/realms/redhat-external/apis/service_accounts/v1`, {
    params,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}
