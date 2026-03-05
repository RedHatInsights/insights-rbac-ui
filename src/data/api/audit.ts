import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import type { AxiosInstance } from 'axios';
import getAuditlogs from '@redhat-cloud-services/rbac-client/GetAuditlogs';
import { RBAC_API_BASE, apiClient } from './client';

const auditEndpoints = {
  getAuditlogs,
};

export type AuditApiClient = ReturnType<typeof APIFactory<typeof auditEndpoints>>;

export function createAuditApi(axios: AxiosInstance): AuditApiClient {
  return APIFactory(RBAC_API_BASE, auditEndpoints, { axios });
}

export const auditApi = createAuditApi(apiClient);

export type { GetAuditlogsParams, GetAuditlogsOrderByEnum } from '@redhat-cloud-services/rbac-client/GetAuditlogs';
export { GetAuditlogsOrderByEnum as AuditlogsOrderByEnum } from '@redhat-cloud-services/rbac-client/GetAuditlogs';
export type { AuditLog, AuditLogPagination } from '@redhat-cloud-services/rbac-client/types';
