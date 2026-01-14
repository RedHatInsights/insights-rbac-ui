import { APIFactory } from '@redhat-cloud-services/javascript-clients-shared';
import listGroups from '@redhat-cloud-services/rbac-client/ListGroups';
import getGroup from '@redhat-cloud-services/rbac-client/GetGroup';
import { RBAC_API_BASE, apiClient } from './client';

// Bundle group endpoints needed for roles page
const groupEndpoints = {
  listGroups,
  getGroup,
};

/**
 * Groups API client - fully typed via rbac-client library.
 */
export const groupsApi = APIFactory(RBAC_API_BASE, groupEndpoints, { axios: apiClient });

// Re-export types
export type { ListGroupsParams } from '@redhat-cloud-services/rbac-client/ListGroups';
export type { GroupPagination, GroupOut } from '@redhat-cloud-services/rbac-client/types';
