import { apiClient } from './client';

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
}

/**
 * Service Accounts API configuration
 * Uses the external SSO API for service account management
 */
export interface ServiceAccountsQueryParams {
  page?: number;
  perPage?: number;
  token: string;
  ssoUrl: string;
}

/**
 * Fetch service accounts from the SSO API
 */
export async function fetchServiceAccounts({ page = 1, perPage = 20, token, ssoUrl }: ServiceAccountsQueryParams): Promise<ServiceAccount[]> {
  const first = (page - 1) * perPage;
  const response = await apiClient.get(`${ssoUrl}/realms/redhat-external/apis/service_accounts/v1`, {
    params: { first, max: Math.min(perPage + 1, 100) },
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  return response.data;
}
