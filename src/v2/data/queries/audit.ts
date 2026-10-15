import { type UseQueryResult, useQuery } from '@tanstack/react-query';
import { type AuditLogPagination, type GetAuditlogsParams, createAuditApi } from '../api/audit';
import { useAppServices } from '../../../shared/contexts/ServiceContext';
import type { QueryOptions } from '../../../shared/data/types';

export const auditLogsKeys = {
  all: ['audit-logs'] as const,
  lists: () => [...auditLogsKeys.all, 'list'] as const,
  list: (params: GetAuditlogsParams) => [...auditLogsKeys.lists(), params] as const,
};

export function useAuditLogsQuery(params: GetAuditlogsParams, options?: QueryOptions): UseQueryResult<AuditLogPagination> {
  const { axios } = useAppServices();
  const auditApi = createAuditApi(axios);

  return useQuery(
    {
      queryKey: auditLogsKeys.list(params),
      queryFn: async () => {
        const response = await auditApi.getAuditlogs(params);
        return response.data;
      },
      enabled: options?.enabled ?? true,
    },
    options?.queryClient,
  );
}

export type { GetAuditlogsParams, AuditLogPagination } from '../api/audit';
export { GetAuditlogsResourceTypeEnum, GetAuditlogsActionEnum } from '../api/audit';
export type { AuditLog } from '../api/audit';
