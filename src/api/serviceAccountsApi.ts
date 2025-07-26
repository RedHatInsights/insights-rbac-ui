import { axiosInstance } from './axiosConfig';

interface ServiceAccountsApiResponse {
  getServiceAccounts: (page: number, perPage: number, token: string, sso: string) => Promise<any>;
}

export const getServiceAccountsApi = (): ServiceAccountsApiResponse => ({
  getServiceAccounts: (page: number, perPage: number, token: string, sso: string) => {
    const first = (page - 1) * perPage;
    return axiosInstance.get(`${sso}/realms/redhat-external/apis/service_accounts/v1?first=${first}&max=${Math.min(perPage + 1, 100)}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  },
});
